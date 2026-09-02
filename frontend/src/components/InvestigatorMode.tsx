"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function InvestigatorMode({ data }: { data: any }) {
  const score = data.assertion.threat_score;
  const pieData = [
    { name: "Threat", value: score },
    { name: "Safe", value: 100 - score }
  ];
  const COLORS = ["#ef4444", "#334155"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1 bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-400 text-sm uppercase tracking-wider">AI Threat Score</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  startAngle={180}
                  endAngle={0}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-5xl font-black -mt-12 text-red-500">{score.toFixed(1)}</div>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2 bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-400 text-sm uppercase tracking-wider">Forensics & Custody</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-xs text-zinc-500 uppercase mb-1">SHA-256 Evidence Hash</div>
            <code className="text-xs text-zinc-300 break-all bg-zinc-900 p-2 rounded block border border-zinc-800">
              {data.evidence_custody.sha256_hash}
            </code>
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase mb-1">TLSH Fuzzy Hash (Attack DNA)</div>
            <code className="text-xs text-zinc-300 break-all bg-zinc-900 p-2 rounded block border border-zinc-800">
              {data.property.tlsh_hash || "N/A (Payload too small)"}
            </code>
          </div>
          <div className="flex space-x-2">
            {data.assertion.technical_flags.spf_pass === false && <Badge variant="destructive">SPF Fail</Badge>}
            {data.assertion.technical_flags.dkim_pass === false && <Badge variant="destructive">DKIM Fail</Badge>}
            {data.assertion.technical_flags.dmarc_pass === false && <Badge variant="destructive">DMARC Fail</Badge>}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-3 bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-400 text-sm uppercase tracking-wider">Relay Route (Hop-by-Hop)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.trace.relay_route.map((hop: any, idx: number) => (
              <div key={idx} className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between text-sm text-zinc-300">
                <div className="flex items-center space-x-3">
                  <span className="text-zinc-500 font-mono">Hop {hop.hop_number}</span>
                  <span className="font-semibold text-zinc-100">{hop.ip || "Unknown IP"}</span>
                </div>
                <div className="text-zinc-500 text-xs mt-2 md:mt-0">{hop.timestamp}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
