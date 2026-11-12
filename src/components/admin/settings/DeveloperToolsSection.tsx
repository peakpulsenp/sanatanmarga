import React from "react";
import { Link } from "react-router-dom";
import { Code, Building2, Zap, Sparkles, HelpCircle, Terminal, Cpu } from "lucide-react";

export default function DeveloperToolsSection() {
  const tools = [
    {
      title: "Feature Control OS",
      desc: "केन्द्रीकृत फिचर नियन्त्रण, रोलआउट र किल-स्विच",
      path: "/admin/feature-control",
      icon: Sparkles,
      badge: "Governance"
    },
    {
      title: "Tenant Federation V3",
      desc: "मल्टी-टेनान्ट फेडरेसन तथा डोमेन व्यवस्थापन",
      path: "/admin/tenants",
      icon: Building2,
      badge: "Federation"
    },
    {
      title: "Developer API Keys",
      desc: "सबै API कुञ्जीहरू तथा टोकन प्रमाणीकरण",
      path: "/admin/developer-api",
      icon: Code,
      badge: "Security"
    },
    {
      title: "AI Observability OS",
      desc: "Gemini 2.5 / 3.0 प्रोम्प्ट तथा टोकन मोनिटरिङ",
      path: "/admin/ai-observability",
      icon: Cpu,
      badge: "AI Ops"
    },
    {
      title: "Workflow Automation",
      desc: "स्वचालित समाचार प्रशोधन तथा घटना ट्रिगर",
      path: "/admin/workflows",
      icon: Zap,
      badge: "Automation"
    },
    {
      title: "Platform Setup Guide",
      desc: "प्रणाली स्थापना तथा वातावरण कन्फिगरेसन",
      path: "/admin/setup-guide",
      icon: HelpCircle,
      badge: "Docs"
    }
  ];

  return (
    <div className="bg-card p-6 lg:p-10 rounded-3xl lg:rounded-[2.5rem] border border-border-theme flex flex-col gap-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-border-theme pb-4">
        <div>
          <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight flex items-center gap-3">
            <Terminal size={24} className="text-primary" /> विकासकर्ता तथा उन्नत उपकरणहरू (Developer Tools)
          </h3>
          <p className="text-xs text-muted-text mt-1">
            मल्टी-टेनान्ट, API Keys, र AI Observability उपकरणहरू।
          </p>
        </div>
        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          v5.0 Ready
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((t, idx) => (
          <Link
            key={idx}
            to={t.path}
            className="p-4 rounded-2xl bg-muted-area/50 hover:bg-muted-area border border-border-theme transition-all group flex flex-col justify-between gap-3 shadow-sm hover:border-primary/40"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <t.icon size={16} />
              </div>
              <span className="text-[10px] font-bold text-muted-text font-mono uppercase bg-card px-2 py-0.5 rounded-md border border-border-theme">
                {t.badge}
              </span>
            </div>
            <div>
              <h4 className="text-xs font-black text-card-foreground group-hover:text-primary transition-colors">
                {t.title}
              </h4>
              <p className="text-[11px] text-muted-text line-clamp-2 mt-0.5">
                {t.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
