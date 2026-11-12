import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, ArrowRight, MessageCircle, BookOpen, Sparkles, Check } from "lucide-react";
import { SAMPLE_PRODUCTS } from "@/src/pages/StorePage";
import type { StoreProduct } from "@/src/types";

interface StoreKnowledgeConnectorProps {
  tags?: string[];
  keywords?: string[];
  category?: string;
  title?: string;
  className?: string;
}

export default function StoreKnowledgeConnector({ tags = [], keywords = [], category = "", title = "", className = "" }: StoreKnowledgeConnectorProps) {
  // Find related products based on matching tags, keywords, or title
  const searchCorpus = [...tags, ...keywords, category, title].join(" ").toLowerCase();

  const matchedProducts = SAMPLE_PRODUCTS.filter(p => {
    const pCorpus = [p.name, p.nameNepali, p.description, p.descriptionNepali, p.category, ...(p.tags || [])].join(" ").toLowerCase();
    
    // Check key matches
    if (searchCorpus.includes("gita") || searchCorpus.includes("गीता") || searchCorpus.includes("श्रीमद्भगवद्गीता")) {
      return p.id.includes("gita");
    }
    if (searchCorpus.includes("dhaka") || searchCorpus.includes("ढाका") || searchCorpus.includes("टोपी") || searchCorpus.includes("संस्कृति")) {
      return p.id.includes("dhaka");
    }
    if (searchCorpus.includes("pashupati") || searchCorpus.includes("पशुपति") || searchCorpus.includes("मन्दिर") || searchCorpus.includes("heritage")) {
      return p.id.includes("pashupati");
    }
    if (searchCorpus.includes("audio") || searchCorpus.includes("मन्त्र") || searchCorpus.includes("वेद") || searchCorpus.includes("डिजिटल")) {
      return p.id.includes("audio");
    }

    // Generic match
    return tags.some(t => pCorpus.includes(t.toLowerCase())) || keywords.some(k => pCorpus.includes(k.toLowerCase()));
  });

  // Default to 1-2 featured products if no specific match
  const displayProducts = matchedProducts.length > 0 ? matchedProducts.slice(0, 2) : SAMPLE_PRODUCTS.slice(0, 2);

  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-br from-amber-500/5 via-card to-amber-500/10 border border-amber-500/20 shadow-sm space-y-4 my-6 ${className}`}>
      <div className="flex items-center justify-between border-b border-amber-500/15 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary text-white">
            <ShoppingBag size={16} />
          </div>
          <div>
            <h4 className="text-xs font-black text-card-foreground uppercase tracking-wider">
              सनातन ज्ञान भण्डार तथा सामग्री (Available in Store)
            </h4>
            <p className="text-[10px] text-muted-text">
              यस विषयसँग सम्बन्धित प्रामाणिक ग्रन्थ, हस्तकला र मन्दिर फ्रेमहरू
            </p>
          </div>
        </div>

        <Link 
          to="/store"
          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
        >
          सबै हेर्नुहोस् <ArrowRight size={12} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayProducts.map(product => (
          <div key={product.id} className="p-3 bg-card rounded-xl border border-border-theme flex items-center gap-3 hover:border-primary/40 transition-all group">
            <img 
              src={product.images?.[0] || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200"} 
              alt={product.nameNepali} 
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0 group-hover:scale-105 transition-transform" 
            />
            <div className="flex-1 min-w-0 space-y-1">
              <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-black uppercase">
                {product.category}
              </span>
              <h5 className="text-xs font-bold text-card-foreground truncate">{product.nameNepali}</h5>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-primary">रु. {product.salePrice || product.price}</span>
                <a
                  href={`https://wa.me/9779800000000?text=${encodeURIComponent(`नमस्ते! म ${product.nameNepali} खरिद गर्न चाहन्छु।`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-700 transition-colors"
                >
                  <MessageCircle size={10} />
                  <span>अर्डर</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
