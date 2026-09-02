"use client";

import { AlertOctagon, ShieldCheck, MailWarning, Link as LinkIcon, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SafeUserMode({ assertion }: { assertion: any }) {
  const isCritical = assertion.threat_score >= 80;
  const isWarning = assertion.threat_score >= 40 && assertion.threat_score < 80;
  
  let statusColor = "bg-green-500/10 text-green-500 border-green-500/20";
  let Icon = ShieldCheck;
  let title = "Safe Email";
  let message = "This email appears safe. However, always remain cautious.";
  
  if (isCritical) {
    statusColor = "bg-red-500/10 text-red-500 border-red-500/20";
    Icon = AlertOctagon;
    title = "CRITICAL THREAT DETECTED";
    message = "Do not interact with this email. It has been flagged as highly malicious.";
  } else if (isWarning) {
    statusColor = "bg-orange-500/10 text-orange-500 border-orange-500/20";
    Icon = MailWarning;
    title = "Suspicious Email";
    message = "Proceed with extreme caution. Verify the sender before clicking anything.";
  }

  return (
    <div className="space-y-6">
      <Card className={`border-2 ${statusColor}`}>
        <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
          <Icon className="w-24 h-24" />
          <h2 className="text-3xl font-black tracking-tight uppercase">{title}</h2>
          <p className="text-xl font-medium opacity-90">{message}</p>
        </CardContent>
      </Card>
      
      {isCritical && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-red-500/5 border-red-500/20">
            <CardContent className="pt-6 flex items-center space-x-4">
              <div className="p-4 bg-red-500/10 rounded-full">
                <LinkIcon className="w-8 h-8 text-red-500" />
              </div>
              <div className="text-lg font-bold text-red-500">DO NOT CLICK LINKS</div>
            </CardContent>
          </Card>
          
          <Card className="bg-red-500/5 border-red-500/20">
            <CardContent className="pt-6 flex items-center space-x-4">
              <div className="p-4 bg-red-500/10 rounded-full">
                <DollarSign className="w-8 h-8 text-red-500" />
              </div>
              <div className="text-lg font-bold text-red-500">DO NOT SEND MONEY</div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {assertion.is_coordinated_campaign && (
        <Card className="bg-purple-500/10 border-purple-500/20">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-2">
            <Badge variant="outline" className="text-purple-400 border-purple-400">Campaign Detected</Badge>
            <p className="text-purple-300 font-medium">This email is part of a known coordinated attack campaign.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
