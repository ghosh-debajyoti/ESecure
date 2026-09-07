"use client";

import React, { useCallback } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface GraphData {
  nodes: any[];
  edges: any[];
}

export default function StixGraph({ data }: { data: GraphData }) {
  const initialNodes = (data?.nodes || []).map((n, i) => ({
    ...n,
    position: { x: (i % 3) * 200, y: Math.floor(i / 3) * 150 },
    style: {
      background: "rgba(15, 23, 42, 0.6)",
      color: "#f8fafc",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "12px",
      padding: "12px",
      width: 160,
      textAlign: "center",
      boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(59, 130, 246, 0.1)",
      backdropFilter: "blur(12px)",
      fontSize: "12px",
      fontFamily: "monospace",
    }
  }));

  const initialEdges = (data?.edges || []).map((e) => ({
    ...e,
    animated: true,
    style: { stroke: "rgba(59, 130, 246, 0.6)", strokeWidth: 2 },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="h-[400px] w-full glass-panel rounded-2xl overflow-hidden relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls className="bg-background/80 border-white/10 fill-white/60 backdrop-blur-md" />
        <MiniMap nodeColor="rgba(59, 130, 246, 0.5)" maskColor="rgba(0, 0, 0, 0.6)" style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)' }} />
        <Background gap={16} size={1} color="rgba(255, 255, 255, 0.05)" />
      </ReactFlow>
    </div>
  );
}
