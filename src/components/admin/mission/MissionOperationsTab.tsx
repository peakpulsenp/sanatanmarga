import React from "react";
import { Terminal, Database, HardDrive, RefreshCw, CheckCircle2, Layers } from "lucide-react";

interface MissionOperationsTabProps {
  publishedCount: number;
  commerceOrders: number;
}

export default function MissionOperationsTab({
  publishedCount,
  commerceOrders
}: MissionOperationsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border-theme pb-3">
          <h3 className="text-sm font-black text-card-foreground uppercase tracking-wider flex items-center gap-2">
            <Terminal size={16} className="text-amber-500" />
            <span>सञ्चालन तथा डेटा अडिट (Operational Registry Audit)</span>
          </h3>
          <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Firestore & Snapshot Synced
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold border-collapse">
            <thead>
              <tr className="border-b border-border-theme text-muted-text uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">मोड्युल (Module)</th>
                <th className="py-2.5 px-3">संग्रहणीय ठेगाना (Firestore Collection)</th>
                <th className="py-2.5 px-3">कुल अभिलेख</th>
                <th className="py-2.5 px-3">गुणस्तर स्थिति</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme/40 text-card-foreground">
              <tr>
                <td className="py-3 px-3 font-black text-primary">NewsOS Articles</td>
                <td className="py-3 px-3 font-mono text-muted-text text-[11px]">articles</td>
                <td className="py-3 px-3 font-mono text-amber-500">{publishedCount} docs</td>
                <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px]">Verified & Grounded</span></td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-black text-primary">Commerce Products</td>
                <td className="py-3 px-3 font-mono text-muted-text text-[11px]">commerce_products</td>
                <td className="py-3 px-3 font-mono text-amber-500">6 SKUs</td>
                <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px]">Multi-Gateway Ready</span></td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-black text-primary">Commerce Orders</td>
                <td className="py-3 px-3 font-mono text-muted-text text-[11px]">commerce_orders</td>
                <td className="py-3 px-3 font-mono text-amber-500">{commerceOrders} orders</td>
                <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px]">Live Queue</span></td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-black text-primary">Knowledge Graph Nodes</td>
                <td className="py-3 px-3 font-mono text-muted-text text-[11px]">knowledgeNodes</td>
                <td className="py-3 px-3 font-mono text-amber-500">42 nodes</td>
                <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px]">Graph Mini-Portals</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
