import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Network, ZoomIn, ZoomOut, RefreshCw, BookOpen, ShoppingBag, MapPin, Sparkles, Compass } from "lucide-react";

interface NodeItem {
  id: string;
  label: string;
  type: "temple" | "scripture" | "event" | "person" | "product";
  x: number;
  y: number;
  connections: string[];
  description: string;
}

const INITIAL_NODES: NodeItem[] = [
  { id: "pashupati", label: "श्री पशुपतिनाथ मन्दिर", type: "temple", x: 220, y: 150, connections: ["gita", "malla_era", "rudraksha"], description: "पाशुपत क्षेत्र र काठमाडौँको मुख्य शिव मन्दिर" },
  { id: "gita", label: "श्रीमद्भगवद्गीता", type: "scripture", x: 420, y: 120, connections: ["pashupati", "krishna"], description: "वेद व्यास द्वारा रचित ७०० श्लोकको जीवन दर्शन" },
  { id: "rudraksha", label: "रुद्राक्ष माला", type: "product", x: 150, y: 300, connections: ["pashupati"], description: "संस्कृति र आध्यात्मिक जप साधनाका लागि ५ मुखी माला" },
  { id: "krishna", label: "श्री कृष्ण जन्माष्टमी", type: "event", x: 480, y: 310, connections: ["gita", "janakpur"], description: "भाद्र कृष्ण अष्टमी पर्व" },
  { id: "janakpur", label: "जानकी मन्दिर", type: "temple", x: 300, y: 380, connections: ["krishna"], description: "मिथिला संस्कृतिको केन्द्र" },
  { id: "malla_era", label: "मल्लकालीन कला तथा वास्तुकला", type: "person", x: 100, y: 180, connections: ["pashupati"], description: "काठमाडौँ उपत्यकाको स्वर्ण युग" }
];

export default function KnowledgeGraphVisualizer() {
  const [nodes, setNodes] = useState<NodeItem[]>(INITIAL_NODES);
  const [selectedNode, setSelectedNode] = useState<NodeItem | null>(INITIAL_NODES[0]);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "temple": return "fill-amber-500 stroke-amber-600 text-amber-500";
      case "scripture": return "fill-sky-500 stroke-sky-600 text-sky-500";
      case "product": return "fill-emerald-500 stroke-emerald-600 text-emerald-500";
      case "event": return "fill-rose-500 stroke-rose-600 text-rose-500";
      default: return "fill-indigo-500 stroke-indigo-600 text-indigo-500";
    }
  };

  return (
    <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div className="space-y-1">
          <span className="px-3 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
            <Network size={12} /> दृश्य ज्ञानकोष (Interactive Visual Graph)
          </span>
          <h3 className="text-lg font-black text-card-foreground">
            सनातन ज्ञानकोष सम्बन्धित नोड भिजुअलाइजर
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.5))}
            className="p-2 rounded-xl bg-muted-area hover:bg-muted-area/80 text-card-foreground border border-border-theme"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.7))}
            className="p-2 rounded-xl bg-muted-area hover:bg-muted-area/80 text-card-foreground border border-border-theme"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-2 rounded-xl bg-muted-area hover:bg-muted-area/80 text-card-foreground border border-border-theme"
            title="Reset Graph"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Canvas */}
        <div className="lg:col-span-2 relative aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border border-border-theme shadow-inner flex items-center justify-center">
          <svg
            className="w-full h-full transition-transform duration-300"
            viewBox="0 0 600 450"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Draw Edges */}
            {nodes.map(node => (
              node.connections.map(targetId => {
                const target = nodes.find(n => n.id === targetId);
                if (!target) return null;
                const isConnectedToSelected = selectedNode && (selectedNode.id === node.id || selectedNode.id === target.id);

                return (
                  <line
                    key={`${node.id}-${target.id}`}
                    x1={node.x}
                    y1={node.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isConnectedToSelected ? "#f59e0b" : "#334155"}
                    strokeWidth={isConnectedToSelected ? "2.5" : "1"}
                    strokeDasharray={isConnectedToSelected ? "none" : "4 4"}
                  />
                );
              })
            ))}

            {/* Draw Nodes */}
            {nodes.map(node => {
              const isSelected = selectedNode?.id === node.id;

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer group"
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 18 : 14}
                    className={`${getTypeColor(node.type)} transition-all duration-300`}
                    strokeWidth={isSelected ? "3" : "1.5"}
                  />
                  <text
                    x={node.x}
                    y={node.y + 28}
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize="10"
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Node Details Card */}
        <div className="space-y-4">
          {selectedNode ? (
            <div className="bg-muted-area/50 border border-border-theme rounded-2xl p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-500">
                  प्रकार: {selectedNode.type}
                </span>
                <h4 className="text-base font-black text-card-foreground">
                  {selectedNode.label}
                </h4>
              </div>

              <p className="text-xs text-muted-text leading-relaxed">
                {selectedNode.description}
              </p>

              <div className="pt-3 border-t border-border-theme space-y-2">
                <span className="text-[10px] font-black uppercase text-muted-text">सम्बन्धित नोडहरू ({selectedNode.connections.length}):</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.connections.map(cId => {
                    const conn = nodes.find(n => n.id === cId);
                    if (!conn) return null;
                    return (
                      <span
                        key={cId}
                        onClick={() => setSelectedNode(conn)}
                        className="px-2.5 py-1 rounded-lg bg-card border border-border-theme text-[10px] font-bold text-card-foreground hover:border-primary cursor-pointer"
                      >
                        {conn.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <Link
                to={`/search?q=${encodeURIComponent(selectedNode.label)}`}
                className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
              >
                <span>सबै जोडिएका सामाग्रीहरू खोज्नुहोस्</span>
              </Link>
            </div>
          ) : (
            <div className="text-center py-12 text-xs font-bold text-muted-text">
              नोड थिचेर सम्बन्धहरू हेर्नुहोस्
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
