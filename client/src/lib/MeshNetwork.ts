/*
  MeshNetwork.ts
  Core singleton class for handling WebRTC P2P connections and message relay.
  Includes Topology discovery for global visualization.
*/

export interface MessagePayload {
  id: string;
  sender: string;
  content: string;
  ttl: number;
  hopCount: number;
  timestamp: number;
  isEmergency?: boolean;
  route: string[]; // Nodes this message has traversed
}

export type MeshProtocolMessage = 
  | { type: 'MESSAGE', payload: MessagePayload }
  | { type: 'TOPOLOGY', payload: { nodeId: string, peers: string[] } };

const generateId = () => 'node_' + Math.random().toString(36).substr(2, 6);

export class MeshNetwork {
  public nodeId: string;
  private ws: WebSocket | null = null;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private seenMessages: Set<string> = new Set();
  private pendingManualConnection: { pc: RTCPeerConnection, targetId: string } | null = null;
  
  public globalTopology: Map<string, string[]> = new Map();
  
  public onPeersChange: ((peers: number) => void) | null = null;
  public onMessageReceived: ((msg: MessagePayload) => void) | null = null;
  public onNetworkStatusChange: ((status: 'idle' | 'connected_server' | 'mesh_only') => void) | null = null;
  public onTopologyChange: ((topology: Map<string, string[]>) => void) | null = null;
  public onActivityLog: ((log: string) => void) | null = null;

  private signalingServerUrl = 'ws://localhost:3001';
  
  private rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }, 
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  constructor() {
    this.nodeId = generateId();
    this.globalTopology.set(this.nodeId, []);
  }

  private logActivity(msg: string) {
    if (this.onActivityLog) this.onActivityLog(msg);
  }

  private async encryptPayload(text: string): Promise<string> {
    return btoa(unescape(encodeURIComponent(text))); 
  }

  private async decryptPayload(encoded: string): Promise<string> {
    return decodeURIComponent(escape(atob(encoded)));
  }

  public connectToSignaling(url?: string) {
    if (url) this.signalingServerUrl = url;
    
    this.ws = new WebSocket(this.signalingServerUrl);
    
    this.ws.onopen = () => {
      this.updateNetworkStatus('connected_server');
      this.sendToWs('REGISTER', { nodeId: this.nodeId });
      this.logActivity(`[SERVER] Connected to signaling as ${this.nodeId}`);
    };

    this.ws.onmessage = (event) => this.handleWsMessage(event);
    
    this.ws.onclose = () => {
      this.updateNetworkStatus('mesh_only');
      this.logActivity('[SERVER] Disconnected. Mesh is working offline.');
    };

    this.ws.onerror = () => {
      this.updateNetworkStatus('mesh_only');
    };
  }

  private sendToWs(type: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  private handleWsMessage(event: MessageEvent) {
    const { type, data } = JSON.parse(event.data);
    switch (type) {
      case 'PEER_JOINED': 
        this.initiateConnection(data.peerId);
        break;
      case 'SIGNAL':
        this.handleWebRtcSignal(data.senderId, data.signal);
        break;
    }
  }

  private createPeerConnection(targetId: string): RTCPeerConnection {
    if (this.peers.has(targetId)) return this.peers.get(targetId)!;

    const pc = new RTCPeerConnection(this.rtcConfig);
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendToWs('SIGNAL', { targetId, signal: { type: 'candidate', candidate: event.candidate } });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeer(targetId);
      }
    };
    
    pc.ondatachannel = (event) => {
      this.setupDataChannel(targetId, event.channel);
    };

    this.peers.set(targetId, pc);
    return pc;
  }

  private async initiateConnection(targetId: string) {
    const pc = this.createPeerConnection(targetId);
    const dc = pc.createDataChannel('silent-network-chat');
    this.setupDataChannel(targetId, dc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    this.sendToWs('SIGNAL', { targetId, signal: { type: 'offer', offer } });
  }

  private async handleWebRtcSignal(senderId: string, signal: any) {
    const pc = this.createPeerConnection(senderId);

    if (signal.type === 'offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.sendToWs('SIGNAL', { targetId: senderId, signal: { type: 'answer', answer } });
    } else if (signal.type === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
    } else if (signal.type === 'candidate') {
      await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
    }
  }

  // --- Manual (Offline) Connection Implementation ---

  private async waitForIce(pc: RTCPeerConnection): Promise<void> {
    if (pc.iceGatheringState === 'complete') return;
    
    return new Promise((resolve) => {
      const checkState = () => {
        if (pc.iceGatheringState === 'complete') {
          pc.removeEventListener('icegatheringstatechange', checkState);
          resolve();
        }
      };
      pc.addEventListener('icegatheringstatechange', checkState);
      
      // Fallback timeout
      setTimeout(resolve, 5000);
    });
  }

  public async generateManualOffer(): Promise<string> {
    const tempId = 'manual_' + Math.random().toString(36).substr(2, 4);
    const pc = new RTCPeerConnection(this.rtcConfig);
    
    // Manual connections must handle their own ICE candidates in the SDP
    const dc = pc.createDataChannel('silent-network-chat');
    this.setupDataChannel(tempId, dc);

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        // Once connected, we can finalize the peer ID if we get it from a message or similar
        // For now we keep the tempId until discovery
      }
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeer(tempId);
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    this.logActivity('[MANUAL] Gathering ICE candidates for offer...');
    await this.waitForIce(pc);
    
    this.pendingManualConnection = { pc, targetId: tempId };
    this.peers.set(tempId, pc);

    const sdp = pc.localDescription?.sdp || '';
    return btoa(sdp);
  }

  public async receiveManualOffer(encodedOffer: string): Promise<string> {
    const sdp = atob(encodedOffer);
    const tempId = 'manual_' + Math.random().toString(36).substr(2, 4);
    
    const pc = new RTCPeerConnection(this.rtcConfig);
    
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeer(tempId);
      }
    };
    
    pc.ondatachannel = (event) => {
      this.setupDataChannel(tempId, event.channel);
    };

    this.peers.set(tempId, pc);

    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    this.logActivity('[MANUAL] Gathering ICE candidates for answer...');
    await this.waitForIce(pc);
    
    return btoa(pc.localDescription?.sdp || '');
  }

  public async completeManualConnection(encodedAnswer: string): Promise<void> {
    if (!this.pendingManualConnection) {
      throw new Error("No pending manual connection found on this device.");
    }
    
    const sdp = atob(encodedAnswer);
    const { pc } = this.pendingManualConnection;
    
    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }));
    this.logActivity('[MANUAL] Remote description set. Establishing connection...');
    this.pendingManualConnection = null;
  }

  private setupDataChannel(targetId: string, dc: RTCDataChannel) {
    dc.onopen = () => {
      this.dataChannels.set(targetId, dc);
      this.logActivity(`[CONNECT] P2P link established with ${targetId}`);
      this.updateLocalTopology();
    };

    dc.onclose = () => {
      this.closePeer(targetId);
    };

    dc.onmessage = async (event) => {
      const parsed: MeshProtocolMessage = JSON.parse(event.data);
      if (parsed.type === 'MESSAGE') {
        await this.handleIncomingMessage(parsed.payload, targetId);
      } else if (parsed.type === 'TOPOLOGY') {
        this.handleTopologyUpdate(parsed.payload);
      }
    };
  }

  private closePeer(targetId: string) {
    this.peers.get(targetId)?.close();
    this.dataChannels.get(targetId)?.close();
    this.peers.delete(targetId);
    this.dataChannels.delete(targetId);
    this.logActivity(`[DISCONNECT] Lost connection to ${targetId}`);
    
    this.globalTopology.delete(targetId);
    this.updateLocalTopology();
  }

  private updateLocalTopology() {
    // Current open channels
    const activePeers: string[] = [];
    this.dataChannels.forEach((dc, id) => {
      if (dc.readyState === 'open') activePeers.push(id);
    });
    
    this.globalTopology.set(this.nodeId, activePeers);
    this.broadcastTopology();
    
    if (this.onPeersChange) this.onPeersChange(activePeers.length);
    if (this.onTopologyChange) this.onTopologyChange(new Map(this.globalTopology));
  }

  private broadcastTopology() {
    const activePeers = this.globalTopology.get(this.nodeId) || [];
    const msg: MeshProtocolMessage = {
      type: 'TOPOLOGY',
      payload: { nodeId: this.nodeId, peers: activePeers }
    };
    this.sendRawToAll(JSON.stringify(msg));
  }

  private handleTopologyUpdate({ nodeId, peers }: { nodeId: string, peers: string[] }) {
    // Basic topology merge loop prevention - only update if different to avoid infinite broadcasts
    const current = this.globalTopology.get(nodeId);
    if (!current || current.join(',') !== peers.join(',')) {
      this.globalTopology.set(nodeId, peers);
      if (this.onTopologyChange) this.onTopologyChange(new Map(this.globalTopology));
      
      // Relay topology update to others so the whole network maps the graph
      const msg: MeshProtocolMessage = {
        type: 'TOPOLOGY',
        payload: { nodeId, peers }
      };
      this.sendRawToAll(JSON.stringify(msg), nodeId);
    }
  }

  private updateNetworkStatus(status: 'idle' | 'connected_server' | 'mesh_only') {
    if (this.onNetworkStatusChange) this.onNetworkStatusChange(status);
  }

  // --- Core Routing Logic ---

  public async broadcast(content: string, isEmergency = false) {
    const msgId = crypto.randomUUID();
    const encryptedContent = await this.encryptPayload(content);
    
    const message: MessagePayload = {
      id: msgId,
      sender: this.nodeId,
      content: encryptedContent,
      ttl: isEmergency ? 10 : 5,
      hopCount: 0,
      timestamp: Date.now(),
      isEmergency,
      route: [this.nodeId]
    };

    this.seenMessages.add(msgId);
    this.logActivity(`[TRANSMIT] Broadcasting message ${msgId.substr(0,8)}...`);
    
    this.dispatchToUI(message, content);
    this.forwardMessage(message);
  }

  private async handleIncomingMessage(message: MessagePayload, sourcePeerId: string) {
    if (this.seenMessages.has(message.id)) {
      return; 
    }
    this.seenMessages.add(message.id);

    let clearText = "";
    try {
      clearText = await this.decryptPayload(message.content);
    } catch {
      clearText = "[Encrypted Payload]";
    }

    this.logActivity(`[RECEIVE] Msg ${message.id.substr(0,8)} from ${message.sender} via ${sourcePeerId} (Hop ${message.hopCount})`);
    
    const updatedMessage = {
      ...message,
      route: [...message.route, this.nodeId]
    };
    
    this.dispatchToUI(updatedMessage, clearText);

    const newTtl = updatedMessage.ttl - 1;
    if (newTtl <= 0) {
      this.logActivity(`[DROP] TTL expired for ${message.id.substr(0,8)}`);
      return; 
    }

    const relayMessage: MessagePayload = {
      ...updatedMessage,
      ttl: newTtl,
      hopCount: updatedMessage.hopCount + 1
    };

    // Add 500ms mock delay for visualization of relays
    setTimeout(() => {
      this.logActivity(`[RELAY] Forwarding ${message.id.substr(0,8)} to other peers`);
      this.forwardMessage(relayMessage, sourcePeerId);
    }, 500);
  }

  private forwardMessage(message: MessagePayload, excludePeerId?: string) {
    const msg: MeshProtocolMessage = { type: 'MESSAGE', payload: message };
    this.sendRawToAll(JSON.stringify(msg), excludePeerId);
  }

  private sendRawToAll(dataString: string, excludePeerId?: string) {
    this.dataChannels.forEach((dc, peerId) => {
      if (peerId !== excludePeerId && dc.readyState === 'open') {
        dc.send(dataString);
      }
    });
  }

  private dispatchToUI(message: MessagePayload, decryptedContent: string) {
    if (this.onMessageReceived) {
      this.onMessageReceived({ ...message, content: decryptedContent });
    }
  }

  public disconnect() {
    this.ws?.close();
    this.peers.forEach(pc => pc.close());
    this.peers.clear();
    this.dataChannels.clear();
    this.seenMessages.clear();
    this.globalTopology.clear();
    this.globalTopology.set(this.nodeId, []);
    this.updateLocalTopology();
    this.logActivity('[OFFLINE] Network interfaces down');
  }
}

export const network = new MeshNetwork();
