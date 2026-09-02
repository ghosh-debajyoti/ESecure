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
  const initialNodes = data.nodes.map((n, i) => ({
    ...n,
    position: { x: (i % 3) * 200, y: Math.floor(i / 3) * 150 },
    style: {
      background: n.type === "observable-email" ? "#1e293b" : "#0f172a",
      color: "#fff",
      border: "1px solid #334155",
      borderRadius: "8px",
      padding: "10px",
      width: 150,
      textAlign: "center",
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    }
  }));

  const initialEdges = data.edges.map((e) => ({
    ...e,
    animated: true,
    style: { stroke: "#ef4444" },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="h-[400px] w-full border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls className="bg-zinc-900 border-zinc-800 fill-zinc-400" />
        <MiniMap nodeColor="#334155" maskColor="rgba(0, 0, 0, 0.8)" />
        <Background gap={12} size={1} color="#334155" />
      </ReactFlow>
    </div>
  );
}
