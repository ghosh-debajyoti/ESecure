import React, { useState, useEffect, useMemo, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { fetchAttackGraph, fetchCampaigns } from './api';

export function AttackGraph() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [graph, setGraph] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns()
      .then((c) => {
        setCampaigns(c);
        if (c.length > 0) {
          setSelectedCampaignId(c[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch((e) => {
        setError('Failed to fetch campaigns');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedCampaignId === null) return;
    setLoading(true);
    setError(null);
    fetchAttackGraph(selectedCampaignId)
      .then(setGraph)
      .catch((e) => setError(e.message || 'Failed to fetch graph data'))
      .finally(() => setLoading(false));
  }, [selectedCampaignId]);

  const [selectedNode, setSelectedNode] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const fgRef = useRef<any>();

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: 600
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
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        {campaigns.length > 0 && (
          <select 
            value={selectedCampaignId || ''} 
            onChange={(e) => setSelectedCampaignId(Number(e.target.value))}
            style={{ padding: '8px', background: 'rgba(0,0,0,0.5)', color: 'var(--white)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', outline: 'none' }}
          >
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.name || `Campaign #${c.id}`}</option>
            ))}
          </select>
        )}
      </div>
      
      {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
      
      {loading ? <p>Loading graph data...</p> : (
        <>
          {campaigns.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '32px', textAlign: 'center', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.2)' }}>
               <h4 style={{ color: 'var(--white)', margin: '0 0 8px 0' }}>No Campaigns Found</h4>
               <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '14px' }}>Upload an email in the Analyze tab to generate case data.</p>
            </div>
          ) : graphData.nodes.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '32px', textAlign: 'center', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.2)' }}>
               <h4 style={{ color: 'var(--white)', margin: '0 0 8px 0' }}>No Graph Data</h4>
               <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '14px' }}>There are no nodes or edges associated with this campaign.</p>
            </div>
          ) : (
            <div ref={containerRef} style={{ height: '600px', width: '100%', background: 'radial-gradient(circle at center, #111424 0%, #05060A 100%)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(125,160,255,0.1)' }}>
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
                onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
              />
              
              <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(10,10,15,0.8)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', zIndex: 10 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#00ffcc' }}></div> Campaign</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#34c759' }}></div> Case</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff9f0a' }}></div> Infrastructure (IP/Domain)</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff3b30' }}></div> Threat/Malware</div>
              </div>

              {selectedNode && (
                <div style={{ position: 'absolute', top: 16, left: 16, width: 250, background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(10px)', border: '1px solid var(--accent)', borderRadius: 8, padding: 16, color: 'white', zIndex: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>
                   <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent)', fontSize: '14px' }}>Node Details</h4>
                   <div style={{ fontSize: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                     <p style={{ margin: '4px 0' }}><strong>Label:</strong> {selectedNode.name}</p>
                     <p style={{ margin: '4px 0' }}><strong>Type:</strong> {selectedNode.type?.toUpperCase()}</p>
                     {selectedNode.metadata && Object.entries(selectedNode.metadata).map(([key, value]) => {
                       if (typeof value === 'object' && value !== null) {
                           return (
                               <p key={key} style={{ margin: '4px 0', wordBreak: 'break-all' }}>
                                 <strong style={{ textTransform: 'capitalize' }}>{key.replace('_', ' ')}:</strong> {JSON.stringify(value)}
                               </p>
                           );
                       }
                       return (
                         <p key={key} style={{ margin: '4px 0', wordBreak: 'break-all' }}>
                           <strong style={{ textTransform: 'capitalize' }}>{key.replace('_', ' ')}:</strong> {String(value)}
                         </p>
                       )
                     })}
                   </div>
                   <button onClick={() => setSelectedNode(null)} style={{ marginTop: 12, padding: '4px 8px', background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: 4, cursor: 'pointer', width: '100%' }}>Close</button>
                </div>
              )}

              <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', gap: 8, zIndex: 10 }}>
                 <button onClick={() => fgRef.current?.zoomToFit(400, 50)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Fit to Screen</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
