import { create } from 'zustand';
import { network } from '../lib/MeshNetwork';
import type { MessagePayload } from '../lib/MeshNetwork';

export interface GraphNode {
  id: string;
  isSelf: boolean;
  group: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  text: string;
}

interface MeshState {
  nodeId: string;
  connectedPeers: number;
  networkStatus: 'idle' | 'connected_server' | 'mesh_only';
  
  // Data
  messages: MessagePayload[];
  graphData: { nodes: GraphNode[]; links: GraphLink[] };
  activityLogs: ActivityLogEntry[];
  
  // UI State
  currentView: 'chat' | 'graph';
  inspectMessageId: string | null;
  
  // Actions
  initNetwork: () => void;
  sendMessage: (text: string, isEmergency?: boolean) => void;
  disconnectNetwork: () => void;
  setView: (view: 'chat' | 'graph') => void;
  setInspectMessageId: (id: string | null) => void;
  
  // Manual Connect
  isManualModalOpen: boolean;
  setManualModalOpen: (open: boolean) => void;
  manualStep: 'idle' | 'create' | 'join' | 'show_offer' | 'show_answer' | 'scan_answer' | 'scan_offer';
  setManualStep: (step: 'idle' | 'create' | 'join' | 'show_offer' | 'show_answer' | 'scan_answer' | 'scan_offer') => void;
  generateManualOffer: () => Promise<string>;
  receiveManualOffer: (offer: string) => Promise<string>;
  completeManualConnection: (answer: string) => Promise<void>;
}

export const useMeshStore = create<MeshState>((set) => ({
  nodeId: network.nodeId,
  connectedPeers: 0,
  networkStatus: 'idle',
  
  messages: [],
  graphData: { nodes: [{ id: network.nodeId, isSelf: true, group: 1 }], links: [] },
  activityLogs: [],
  
  currentView: 'graph', // Default to graph for maximum wow-factor
  inspectMessageId: null,

  isManualModalOpen: false,
  manualStep: 'idle',
  
  setManualModalOpen: (open) => set({ isManualModalOpen: open, manualStep: 'idle' }),
  setManualStep: (step) => set({ manualStep: step }),

  generateManualOffer: async () => {
    return await network.generateManualOffer();
  },

  receiveManualOffer: async (offer) => {
    return await network.receiveManualOffer(offer);
  },

  completeManualConnection: async (answer) => {
    await network.completeManualConnection(answer);
  },

  initNetwork: () => {
    network.onPeersChange = (peers) => set({ connectedPeers: peers });
    
    network.onMessageReceived = (msg) => {
      set((state) => {
        if (state.messages.find(m => m.id === msg.id)) return state;
        return { messages: [msg, ...state.messages] };
      });
    };
    
    network.onNetworkStatusChange = (status) => set({ networkStatus: status });
    
    network.onActivityLog = (text) => {
      set((state) => ({
        activityLogs: [
          { id: crypto.randomUUID(), timestamp: new Date(), text }, 
          ...state.activityLogs
        ].slice(0, 100) // Keep last 100 logs
      }));
    };

    network.onTopologyChange = (topologyMap) => {
      const nodesMap = new Set<string>();
      const links: GraphLink[] = [];
      
      topologyMap.forEach((peers, nodeId) => {
        nodesMap.add(nodeId);
        peers.forEach(peer => {
          nodesMap.add(peer);
          // Prevent bi-directional duplicates in D3
          const linkId1 = `${nodeId}-${peer}`;
          const linkId2 = `${peer}-${nodeId}`;
          if (!links.some(l => `${l.source}-${l.target}` === linkId1 || `${l.source}-${l.target}` === linkId2)) {
            links.push({ source: nodeId, target: peer });
          }
        });
      });

      const nodes: GraphNode[] = Array.from(nodesMap).map(id => ({
        id,
        isSelf: id === network.nodeId,
        group: id === network.nodeId ? 1 : 2
      }));

      set({ graphData: { nodes, links } });
    };

    network.connectToSignaling('ws://localhost:3001');
  },
  
  sendMessage: (text: string, isEmergency = false) => {
    network.broadcast(text, isEmergency);
  },
  
  disconnectNetwork: () => {
    network.disconnect();
    set({
      connectedPeers: 0,
      networkStatus: 'idle',
      // Keep messages, but maybe clear graph or logs
      graphData: { nodes: [{ id: network.nodeId, isSelf: true, group: 1 }], links: [] }
    });
  },
  
  setView: (view) => set({ currentView: view }),
  setInspectMessageId: (id) => set({ inspectMessageId: id })
}));
