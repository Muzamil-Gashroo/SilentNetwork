import React from 'react';
import { useMeshStore } from '../store/useMeshStore';
import { Network, Activity, Clock, ShieldCheck, XCircle } from 'lucide-react';

export const PacketInspector: React.FC = () => {
  const { messages, inspectMessageId, setInspectMessageId } = useMeshStore();
  
  const msg = messages.find(m => m.id === inspectMessageId);

  if (!msg) {
    return (
      <div className="h-full bg-surface/40 border border-neutral-800/50 rounded-xl flex flex-col items-center justify-center p-6 text-center text-neutral-500">
        <Network className="w-12 h-12 mb-4 opacity-20" />
        <h3 className="text-sm font-semibold mb-1">Packet Inspector</h3>
        <p className="text-xs">Select a standard or emergency transmission to analyze its routing telemetry.</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-black/60 border border-primary/20 rounded-xl flex flex-col overflow-hidden backdrop-blur-md relative">
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-primary/50 to-blue-600/50"></div>
      
      <div className="flex items-center justify-between p-3 border-b border-neutral-800 bg-surface/50">
        <div className="flex items-center gap-2 text-primary">
          <Activity className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-widest">Protocol Analysis</h3>
        </div>
        <button onClick={() => setInspectMessageId(null)} className="text-neutral-500 hover:text-white transition">
           <XCircle className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-sm">
        
        <div>
          <label className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1 block">Packet ID</label>
          <div className="font-mono text-xs text-textMain bg-neutral-900 px-2 py-1.5 rounded">{msg.id}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1 block">Origin Node</label>
            <div className="font-mono text-primary/90">{msg.sender}</div>
          </div>
          <div>
            <label className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1 block">TTL Remaining</label>
            <div className="font-mono text-warning text-yellow-500">{msg.ttl} Hops</div>
          </div>
          <div>
            <label className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1 block">Priority</label>
            <div className={`font-mono ${msg.isEmergency ? 'text-danger font-bold' : 'text-success'}`}>
              {msg.isEmergency ? 'CRITICAL (EMERGENCY)' : 'STANDARD'}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1 block">Timestamp</label>
            <div className="font-mono text-neutral-300 flex items-center gap-1">
               <Clock className="w-3 h-3" />
               {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1 flex items-center gap-1">
             <ShieldCheck className="w-3 h-3" /> Encrypted Payload
          </label>
          <div className="font-mono text-[10px] text-neutral-600 bg-neutral-900 border border-neutral-800 px-2 py-1.5 rounded break-all">
            {msg.content} {/* In our demo we use the pseudo-encrypted content string we received */}
          </div>
        </div>

        <div>
          <label className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 block">Routing Path (Hops: {msg.hopCount})</label>
          <div className="bg-neutral-900 rounded-lg p-3 border border-neutral-800">
            {msg.route.map((r, i) => (
              <div key={i} className="flex gap-3 mb-2 last:mb-0 items-start">
                <div className="flex flex-col items-center mt-1">
                   <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-primary' : i === msg.route.length - 1 ? 'bg-success animate-pulse' : 'bg-neutral-500'}`}></div>
                   {i !== msg.route.length - 1 && <div className="w-0.5 h-6 bg-neutral-800 my-1"></div>}
                </div>
                <div>
                   <div className="text-xs font-mono font-medium text-neutral-300">{r}</div>
                   <div className="text-[10px] text-neutral-600">{i === 0 ? 'Origin' : i === msg.route.length - 1 ? 'Terminal' : 'Relay'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
