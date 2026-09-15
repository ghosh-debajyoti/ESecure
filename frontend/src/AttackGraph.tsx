import React, { useState, useEffect, useMemo, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { X, Maximize, GitCommit } from 'lucide-react';
import { fetchAttackGraph, fetchCampaigns } from './api';

export function AttackGraph({ activeCase }: { activeCase: string | null }) {
  const [graph, setGraph] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeCase) {
      setGraph(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetchAttackGraph(activeCase)
      .then(setGraph)
      .catch((e) => setError(e.message || 'Failed to fetch graph data'))
      .finally(() => setLoading(false));
  }, [activeCase]);

  const [selectedNode, setSelectedNode] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 700 });
  const fgRef = useRef<any>();

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: 700
      });
    }
  }, [graph]);

  const graphData = useMemo(() => {
    if (!graph || !graph.nodes || !graph.edges) return { nodes: [], links: [] };
    
    const nodes = graph.nodes.map((n: any) => {
      const typeStr = (n.type || '').toLowerCase();
      let color = '#7da0ff'; // Default Blue
      let size = 10;
      
      if (typeStr.includes('email')) { color = '#ffffff'; size = 12; }
      else if (typeStr.includes('ip') || typeStr.includes('domain') || typeStr.includes('url')) { color = '#ff9f0a'; size = 12; }
      else if (typeStr.includes('hash') || typeStr.includes('malware') || typeStr.includes('indicator') || typeStr.includes('cve')) { color = '#ff3b30'; size = 12; }
      else if (typeStr.includes('campaign')) { color = '#00ffcc'; size = 20; }
      else if (typeStr.includes('case')) { color = '#34c759'; size = 16; }

      return {
        ...n,
        id: n.id,
        name: n.name || n.label || n.id,
        color,
        val: size
      };
    });

    const links = graph.edges.map((e: any) => ({
      source: e.source,
      target: e.target,
      name: e.relationship || e.label || ''
    }));

    const validLinks = links.filter((l: any) => 
      nodes.find((n: any) => n.id === l.source) && 
      nodes.find((n: any) => n.id === l.target)
    );

    return { nodes, links: validLinks };
  }, [graph]);

  return (
    <div className="dashboard-container glass-card" style={{ position: 'relative', width: '100%', height: 'calc(100vh - 120px)', overflow: 'hidden', padding: 0 }}>
      {error && (
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, color: 'var(--danger)', background: 'rgba(255,95,84,0.1)', padding: '8px 16px', borderRadius: '4px' }}>
          {error}
        </div>
      )}
      {loading ? (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--white)' }}>
          Loading graph data...
        </div>
      ) : (!graphData.links || graphData.links.length === 0) ? (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(255,255,255,0.05)', padding: '32px', textAlign: 'center', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.2)' }}>
           <h4 style={{ color: 'var(--white)', margin: '0 0 8px 0' }}>No Graph Data</h4>
           <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '14px' }}>No attack graph data for this case.</p>
        </div>
      ) : (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeColor="color"
            nodeRelSize={1}
            nodeVal="val"
            nodeLabel="name"
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={1}
            linkColor={() => 'rgba(125,160,255,0.4)'}
            linkWidth={1.5}
            onNodeClick={(node) => setSelectedNode(node)}
            onBackgroundClick={() => setSelectedNode(null)}
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const label = node.name;
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Inter, sans-serif`;
              
              ctx.beginPath();
              ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
              ctx.fillStyle = node.color;
              ctx.fill();
              
              if (selectedNode && selectedNode.id === node.id) {
                ctx.lineWidth = 2 / globalScale;
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();
              }

              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

              ctx.fillStyle = 'rgba(17, 20, 36, 0.8)';
              ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + node.val + 2 - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.fillText(label, node.x, node.y + node.val + 2);
            }}
            cooldownTicks={100}
            cooldownTime={15000}
            onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
          />

          {/* Floating Panels */}
          {/* Top-Right: Legend card */}
          <div className="floating-panel floating-top-right">
            <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', textTransform: 'uppercase', color: 'var(--secondary)' }}>Node Types</h4>
            <div className="flex-col" style={{ gap: '8px' }}>
              <div className="flex-row"><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00ffcc' }}/> <span style={{ fontSize: '12px' }}>Campaign</span></div>
              <div className="flex-row"><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34c759' }}/> <span style={{ fontSize: '12px' }}>Case</span></div>
              <div className="flex-row"><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffffff' }}/> <span style={{ fontSize: '12px' }}>Email Metadata</span></div>
              <div className="flex-row"><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff9f0a' }}/> <span style={{ fontSize: '12px' }}>Infrastructure (IP/Domain/URL)</span></div>
              <div className="flex-row"><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff3b30' }}/> <span style={{ fontSize: '12px' }}>Threat / Indicator</span></div>
            </div>
          </div>

          {/* Bottom-Left: Selected node details */}
          {selectedNode && (
            <div className="floating-panel floating-bottom-left" style={{ animation: 'fadeInUp 0.2s ease-out' }}>
               <div className="flex-between" style={{ marginBottom: '12px' }}>
                 <h4 style={{ margin: 0, color: 'var(--accent)', fontSize: '13px', textTransform: 'uppercase' }}>Node Details</h4>
                 <X size={16} className="card-icon card-selectable" onClick={() => setSelectedNode(null)} />
               </div>
               <div style={{ fontSize: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                 <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px', marginBottom: '8px' }}>
                   <p style={{ margin: '0 0 4px 0', color: 'var(--secondary)' }}>Label</p>
                   <p style={{ margin: 0, fontWeight: 600 }}>{selectedNode.name}</p>
                 </div>
                 <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px', marginBottom: '8px' }}>
                   <p style={{ margin: '0 0 4px 0', color: 'var(--secondary)' }}>Type</p>
                   <p style={{ margin: 0, fontWeight: 600 }}>{selectedNode.type?.toUpperCase()}</p>
                 </div>
                 {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
                   <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px' }}>
                     <p style={{ margin: '0 0 8px 0', color: 'var(--secondary)' }}>Metadata</p>
                     {Object.entries(selectedNode.metadata).map(([key, value]) => (
                       <p key={key} style={{ margin: '0 0 4px 0', wordBreak: 'break-all', fontSize: '11px' }}>
                         <span style={{ color: 'var(--muted)', textTransform: 'capitalize' }}>{key.replace('_', ' ')}:</span> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                       </p>
                     ))}
                   </div>
                 )}
               </div>
            </div>
          )}

          {/* Bottom-Right: Controls */}
          <div className="floating-panel floating-bottom-right" style={{ padding: '4px', borderRadius: '8px', background: 'rgba(10,15,26,0.6)' }}>
             <button className="btn-icon" onClick={() => fgRef.current?.zoomToFit(400, 50)} title="Fit to screen">
               <Maximize size={16} />
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
