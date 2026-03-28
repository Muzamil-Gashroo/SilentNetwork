import React from 'react';
import { useMeshStore } from '../store/useMeshStore';
import { Activity, Radio, WifiOff, ShieldAlert, LayoutDashboard, MessageSquare, PowerOff, Plus } from 'lucide-react';

export const NetworkStatus: React.FC = () => {
  const { nodeId, connectedPeers, networkStatus, currentView, setView, disconnectNetwork, setManualModalOpen } = useMeshStore();

  const isConnectedServer = networkStatus === 'connected_server';
  const isMeshOnly = networkStatus === 'mesh_only';

  return (
    <div className="bg-black/60 backdrop-blur-md border border-neutral-800/80 p-3 sm:px-6 shrink-0 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all z-20 sticky top-0">
      
      {/* Node Identity */}
      <div className="flex items-center gap-4">
        <div className="relative">
           <div className="absolute inset-0 bg-primary/20 blur-md rounded-full"></div>
           <div className="bg-neutral-900 border border-primary/30 p-2.5 rounded-full relative z-10 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
             <Activity className="w-5 h-5 text-primary animate-pulse" />
           </div>
        </div>
        <div>
          <h2 className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-1 inline-flex rounded mb-0.5">Tactical ID</h2>
          <p className="text-lg font-bold text-textMain tracking-tight leading-none">{nodeId}</p>
        </div>
      </div>

      {/* Main Controls & Metrics */}
      <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
        
        {/* View Toggle */}
        <div className="flex bg-neutral-900 border border-neutral-800 rounded-lg p-1">
          <button 
            onClick={() => setView('graph')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all ${currentView === 'graph' ? 'bg-primary text-white shadow-md' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Graph
          </button>
          <button 
            onClick={() => setView('chat')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all ${currentView === 'chat' ? 'bg-primary text-white shadow-md' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat
          </button>
        </div>

        {/* Signaling Server Status & Disconnect Demo */}
        <div className="flex items-center group relative">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-l-lg border-y border-l bg-neutral-900 transition-colors ${isConnectedServer ? 'border-primary/30' : 'border-danger/30'}`}>
            {isConnectedServer ? (
              <>
                <Radio className="w-4 h-4 text-success animate-pulse" />
                <span className="text-xs font-bold text-success uppercase tracking-wider">Signaling</span>
              </>
            ) : isMeshOnly ? (
              <>
                <WifiOff className="w-4 h-4 text-warning text-yellow-500" />
                <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Mesh Only</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-danger" />
                <span className="text-xs font-bold text-danger uppercase tracking-wider">Offline</span>
              </>
            )}
          </div>
          <button 
            onClick={disconnectNetwork}
            disabled={!isConnectedServer}
            title="Simulate Server Outage"
            className="px-3 py-1.5 bg-neutral-800 border-y border-r border-neutral-700 rounded-r-lg hover:bg-danger/20 hover:text-danger hover:border-danger/50 text-neutral-500 transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
          >
            <PowerOff className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Peer Count */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-l-lg bg-surface border border-neutral-700 shadow-inner group relative">
          <div className="relative flex h-2.5 w-2.5">
            {connectedPeers > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${connectedPeers > 0 ? 'bg-success' : 'bg-danger'}`}></span>
          </div>
          <span className="text-sm font-mono font-bold text-textMain whitespace-nowrap">{connectedPeers} <span className="text-neutral-500 text-xs tracking-wide">PEERS</span></span>
        </div>

        {/* Manual Peer Entry Button */}
        <button 
          onClick={() => setManualModalOpen(true)}
          className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-r-lg font-bold text-xs flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">ADD PEER</span>
        </button>

      </div>
    </div>
  );
};
