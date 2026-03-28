# Silent Network - Resilient Offline Communication

A full-stack prototype of a decentralized, peer-to-peer mesh messaging system designed for austere and low-connectivity environments.

## How to Start and Run the Project

This project uses a single command to concurrently run both the Node.js Signaling Server and the React (Vite) Client Application.

### Prerequisites
Make sure you have Node.js and NPM installed.

### 1. Install Dependencies
Open your terminal in the root folder (`a:\abc\project`) and run the master install script:
```bash
npm run install:all
```
*(This automatically installs packages for the root project, the `/server` folder, and the `/client` folder).*

### 2. Start the Development Servers
In the exact same root folder, run:
```bash
npm run dev
```

### What Happens When You Run That?
The `npm run dev` script launches `concurrently` which starts:
1. **Backend:** The WebSocket signaling server on port `3001` (used exclusively for initial peer discovery).
2. **Frontend:** The Vite React app on `http://localhost:port`.

### 3. Open the Dashboard to Test
To actually see the mesh network working, you **must open multiple browser tabs**.
1. Open Google Chrome or Edge.
2. Navigate to [http://localhost:port](http://localhost:port).
3. Open a **second** and **third** tab to the exact same URL. 

The nodes will automatically discover each other through the signaling server and construct WebRTC P2P Data Channels. You will see the Force Graph construct itself, and you can test sending messages between tabs to observe the red data packets traversing the graph!
