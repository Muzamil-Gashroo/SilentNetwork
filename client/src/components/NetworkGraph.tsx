import React, { useRef, useEffect, useState, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useMeshStore } from '../store/useMeshStore';

export const NetworkGraph: React.FC = () => {
  const { graphData, messages } = useMeshStore();
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Provide auto-resizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      setDimensions({
        width: entries[0].contentRect.width,
        height: entries[0].contentRect.height
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute Active Links for Particle Animation based on recent messages (last 10 seconds)
  const activeLinks = useMemo(() => {
    const active = new Set<string>();
    const now = Date.now();
    
    // We only care about messages recent enough to actively animate
    messages.slice(0, 50).forEach(msg => {
      if (now - msg.timestamp < 10000) {
        for (let i = 0; i < msg.route.length - 1; i++) {
          active.add(`${msg.route[i]}-${msg.route[i+1]}`);
          active.add(`${msg.route[i+1]}-${msg.route[i]}`); // Undirected match
        }
      }
    });
    
    return active;
  }, [messages]);

  useEffect(() => {
    // Re-center graph gently when data changes, without aggressive re-zooming on every node add
    if (fgRef.current) {
      fgRef.current.d3Force('charge')?.strength(-300);
      fgRef.current.d3ReheatSimulation();
    }
  }, [graphData.nodes.length, graphData.links.length]);

  return (
    <div ref={containerRef} className="w-full h-full bg-black relative rounded-xl border border-neutral-800/60 overflow-hidden shadow-2xl">
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black pointer-events-none z-0"></div>
      
      <div className="absolute top-4 left-4 z-10">
         <h2 className="text-sm font-bold tracking-widest uppercase text-textMuted bg-surface/50 px-3 py-1.5 rounded-lg border border-neutral-800/50 backdrop-blur-sm">Tactical Node Map</h2>
      </div>

      <div className="z-0 absolute inset-0">
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="id"
          nodeColor={(node: any) => node.isSelf ? '#3b82f6' : '#22c55e'} // Primary for self, green for peers
          nodeRelSize={6}
          linkColor={(link: any) => {
             const key = `${link.source.id || link.source}-${link.target.id || link.target}`;
             return activeLinks.has(key) ? '#3b82f6' : 'rgba(255,255,255,0.1)';
          }}
          linkWidth={(link: any) => {
             const key = `${link.source.id || link.source}-${link.target.id || link.target}`;
             return activeLinks.has(key) ? 2 : 1;
          }}
          linkDirectionalParticles={(link: any) => {
             const key = `${link.source.id || link.source}-${link.target.id || link.target}`;
             return activeLinks.has(key) ? 4 : 0;
          }}
          linkDirectionalParticleSpeed={0.015}
          linkDirectionalParticleColor={() => '#ef4444'} // Red particles representing data payload
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          backgroundColor="rgba(0,0,0,0)"
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.4}
          onNodeClick={() => { /* Could implement node-specific details */ }}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            // Advanced cyber node rendering
            const label = node.id;
            const fontSize = 12 / globalScale;
            ctx.font = `${Math.max(fontSize, 4)}px monospace`;
            
            // Draw Node Circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
            const isActive = node.isSelf;
            ctx.fillStyle = isActive ? '#3b82f6' : '#22c55e';
            ctx.fill();
            
            // Outer Glow ring
            ctx.beginPath();
            ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI, false);
            ctx.strokeStyle = isActive ? 'rgba(59, 130, 246, 0.4)' : 'rgba(34, 197, 94, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Label text
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillText(label, node.x, node.y + 12);
          }}
        />
      </div>
    </div>
  );
};
