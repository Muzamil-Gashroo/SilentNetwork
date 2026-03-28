import React from 'react';
import { useMeshStore } from '../store/useMeshStore';
import { Terminal } from 'lucide-react';

export const ActivityLog: React.FC = () => {
  const activityLogs = useMeshStore(state => state.activityLogs);

  return (
    <div className="flex flex-col h-full bg-black/60 border border-neutral-800/80 rounded-xl overflow-hidden backdrop-blur-md">
      <div className="flex items-center gap-2 px-4 py-2 bg-surface/80 border-b border-neutral-800">
        <Terminal className="w-4 h-4 text-primary" />
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-textMuted">Live Telemetry</span>
        <div className="ml-auto flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
          <span className="text-[10px] text-success font-medium">REC</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[11px] leading-relaxed flex flex-col-reverse custom-scrollbar">
        {activityLogs.map(log => {
          let color = 'text-neutral-400';
          if (log.text.includes('[SERVER]')) color = 'text-primary/80';
          if (log.text.includes('[CONNECT]')) color = 'text-success/90';
          if (log.text.includes('[RECEIVE]')) color = 'text-blue-400';
          if (log.text.includes('[TRANSMIT]')) color = 'text-yellow-400';
          if (log.text.includes('[RELAY]')) color = 'text-purple-400';
          if (log.text.includes('[DROP]')) color = 'text-danger/90';
          if (log.text.includes('[DISCONNECT]') || log.text.includes('[OFFLINE]')) color = 'text-danger';

          return (
            <div key={log.id} className={`${color} break-all hover:bg-white/5 px-1 py-0.5 rounded transition-colors`}>
              <span className="text-neutral-600 mr-2">
                {log.timestamp.toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 })}
              </span>
              {log.text}
            </div>
          )
        })}
      </div>
    </div>
  );
};
