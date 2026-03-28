import { useEffect, useState } from 'react';
import { NetworkStatus } from './components/NetworkStatus';
import { ChatInterface } from './components/ChatInterface';
import { ActivityLog } from './components/ActivityLog';
import { PacketInspector } from './components/PacketInspector';
import { NetworkGraph } from './components/NetworkGraph';
import { ManualConnect } from './components/ManualConnect';
import { useMeshStore } from './store/useMeshStore';
import { ShieldAlert } from 'lucide-react';

function App() {
  const { initNetwork, disconnectNetwork, currentView, messages, inspectMessageId } = useMeshStore();
  const [isEmergencyAlert, setIsEmergencyAlert] = useState(false);

  useEffect(() => {
    initNetwork();
    return () => disconnectNetwork();
  }, [initNetwork, disconnectNetwork]);

  // Compute Emergency state based on recent messages
  useEffect(() => {
    if (messages.length > 0) {
      const latest = messages[0];
      if (latest.isEmergency && (Date.now() - latest.timestamp < 15000)) {
        setTimeout(() => setIsEmergencyAlert(true), 0);
        const timer = setTimeout(() => setIsEmergencyAlert(false), 15000);
        return () => clearTimeout(timer);
      } else {
        setTimeout(() => setIsEmergencyAlert(false), 0);
      }
    }
  }, [messages]);

  return (
    <div className={`h-screen w-full flex flex-col bg-background relative overflow-hidden text-textMain transition-colors duration-1000 ${isEmergencyAlert ? 'bg-danger/5' : ''}`}>
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-surface/80 via-background to-background pointer-events-none"></div>

      {/* Emergency Global Banner */}
      {isEmergencyAlert && (
        <div className="absolute top-0 w-full bg-danger text-white text-xs font-bold tracking-[0.2em] py-1 text-center animate-pulse z-50 flex items-center justify-center gap-4 shadow-[0_0_20px_rgba(239,68,68,0.8)]">
          <ShieldAlert className="w-4 h-4" />
          HIGH PRIORITY PROPAGATION ACTIVE
          <ShieldAlert className="w-4 h-4" />
        </div>
      )}

      {/* Top Protocol Status Bar */}
      <NetworkStatus />

      {/* Manual Connection Wizard Overlay */}
      <ManualConnect />

      {/* Main Dashboard Grid */}
      <main className="flex-1 flex flex-col md:flex-row gap-4 p-4 lg:p-6 overflow-hidden relative z-10 w-full max-w-[1800px] mx-auto">
        
        {/* Left Panel: Telemetry & Comms */}
        <div className={`w-full md:w-[380px] lg:w-[450px] flex flex-col gap-4 h-full ${currentView === 'graph' ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Top Half: Packet Analysis or Live Logs */}
          <div className="flex-1 min-h-[250px] relative transition-all">
            {inspectMessageId ? <PacketInspector /> : <ActivityLog />}
          </div>

          {/* Bottom Half: Chat/Transmitter */}
          <div className="h-[45%] min-h-[350px]">
            <ChatInterface />
          </div>

        </div>

        {/* Right Panel: Force Graph */}
        <div className={`flex-1 flex relative w-full h-full ${currentView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
          <NetworkGraph />
          
          {/* Optional overlay vignette indicating emergency */}
          {isEmergencyAlert && (
            <div className="absolute inset-0 pointer-events-none rounded-xl ring-2 ring-inset ring-danger/50 shadow-[inset_0_0_100px_rgba(239,68,68,0.2)] transition-opacity duration-500"></div>
          )}
        </div>

      </main>
    </div>
  );
}

export default App;
