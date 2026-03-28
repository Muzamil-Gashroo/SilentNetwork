const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Track connected clients
// clients is a Map of nodeId -> WebSocket
const clients = new Map();

wss.on('connection', (ws) => {
  let nodeId = null;

  ws.on('message', (messageAsString) => {
    try {
      const message = JSON.parse(messageAsString);
      const { type, data } = message;

      if (type === 'REGISTER') {
        nodeId = data.nodeId;
        clients.set(nodeId, ws);
        console.log(`Node registered: ${nodeId} (Total: ${clients.size})`);
        
        // Notify others about the new peer so they can initiate connection
        clients.forEach((clientWs, id) => {
          if (id !== nodeId && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
              type: 'PEER_JOINED',
              data: { peerId: nodeId }
            }));
          }
        });
      } 
      else if (type === 'SIGNAL') {
        // Relay signaling data (offer, answer, ice-candidate) to the specific target
        const targetWs = clients.get(data.targetId);
        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
          targetWs.send(JSON.stringify({
            type: 'SIGNAL',
            data: {
              senderId: nodeId,
              signal: data.signal
            }
          }));
        }
      }
    } catch (e) {
      console.error('Failed to process message', e);
    }
  });

  ws.on('close', () => {
    if (nodeId) {
      clients.delete(nodeId);
      console.log(`Node disconnected: ${nodeId} (Total: ${clients.size})`);
      
      // Notify remaining clients
      clients.forEach((clientWs) => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            type: 'PEER_LEFT',
            data: { peerId: nodeId }
          }));
        }
      });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
