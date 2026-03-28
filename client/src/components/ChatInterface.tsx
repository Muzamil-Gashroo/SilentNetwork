import { useState, useRef } from 'react';
import { useMeshStore } from '../store/useMeshStore';
import { Send, AlertTriangle, Route, Info } from 'lucide-react';

export const ChatInterface = () => {
  const { messages, sendMessage, nodeId, connectedPeers, setInspectMessageId, inspectMessageId } = useMeshStore();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleEmergency = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText.trim(), true); 
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-black/40 border border-neutral-800/80 rounded-xl overflow-hidden backdrop-blur-md relative">
      
      {/* Mesh Banner warning */}
      {connectedPeers === 0 && (
        <div className="bg-danger/10 border-b border-danger/30 p-2 text-center text-danger text-[10px] uppercase tracking-widest font-bold animate-pulse">
          No active links. Searching for peers...
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col-reverse custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500 opacity-60">
            <Route className="w-12 h-12 mb-3 stroke-1 opacity-40" />
            <p className="text-sm font-medium">Comm-link idle.</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender === nodeId;
          const isInspected = msg.id === inspectMessageId;

          return (
            <div 
              key={msg.id} 
              className={`flex flex-col font-mono text-[13px] ${isMine ? 'items-end' : 'items-start'} transition-all w-full`}
            >
              <div className="flex items-center gap-2 mb-1 pl-1 pr-1">
                <span className="text-[10px] font-bold text-neutral-500 uppercase">{msg.sender}</span>
                {!isMine && (
                  <span className="text-[9px] text-neutral-400 bg-neutral-900 px-1 rounded border border-neutral-800">
                    Hops: {msg.hopCount} | TTL: {msg.ttl}
                  </span>
                )}
                {msg.isEmergency && (
                  <span className="text-[9px] font-bold text-white bg-danger px-1 py-0.5 rounded shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse">EMERGENCY</span>
                )}
                
                <button 
                  onClick={() => setInspectMessageId(msg.id)}
                  className={`p-0.5 rounded hover:bg-white/10 transition-colors ${isInspected ? 'text-primary' : 'text-neutral-600'}`}
                  title="Inspect Packet"
                >
                   <Info className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className={`
                relative px-3 py-2.5 max-w-[90%] md:max-w-[75%] break-words shadow-md transition-all
                ${isInspected ? 'ring-2 ring-primary/50' : ''}
                ${isMine 
                  ? 'bg-primary/90 text-white rounded-l-lg rounded-br-lg border border-primary/20' 
                  : msg.isEmergency 
                    ? 'bg-danger/20 border border-danger/50 text-danger-100 rounded-r-lg rounded-bl-lg backdrop-blur-sm' 
                    : 'bg-surface/80 border border-neutral-700/50 text-textMain rounded-r-lg rounded-bl-lg hover:border-neutral-600/50'
                }
              `}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-surface/60 border-t border-neutral-800 backdrop-blur-lg">
        <form onSubmit={handleSend} className="flex gap-2">
            
          <button
            type="button"
            onClick={handleEmergency}
            disabled={!inputText.trim() || connectedPeers === 0}
            className="p-3 bg-neutral-900 text-danger hover:bg-danger/20 transition-all rounded-lg border border-neutral-700 hover:border-danger/50 disabled:opacity-50  group shrink-0 shadow-inner"
            title="Emergency Priority Transmission"
          >
            <AlertTriangle className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Transmit data..."
            disabled={connectedPeers === 0}
            className="flex-1 font-mono text-sm bg-black/50 border border-neutral-700 focus:border-primary/50 text-textMain rounded-lg px-3 py-2 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:bg-neutral-900 shadow-inner"
          />
          
          <button
            type="submit"
            disabled={!inputText.trim() || connectedPeers === 0}
            className="px-4 py-2 bg-primary hover:bg-blue-500 text-white font-medium rounded-lg disabled:opacity-50 border border-primary/20 shadow-[0_0_10px_rgba(59,130,246,0.2)] hover:shadow-primary/40 transition-all flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>

        </form>
      </div>

    </div>
  );
};
