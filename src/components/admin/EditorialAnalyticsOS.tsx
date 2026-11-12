import React, { useState } from "react";
import { BarChart3, TrendingUp, Eye, Clock, Share2, Bookmark, MessageSquare, Flame, Globe, ArrowUpRight } from "lucide-react";
import { Card, SectionHeader, Badge, SmartButton } from "@/src/components/ui/DesignSystem";
import { useLanguage } from "@/src/context/LanguageContext";

export default function EditorialAnalyticsOS() {
  const { language } = useLanguage();
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("today");

  const topArticles = [
    { id: "1", title: language === "en" ? "Prime Minister Addresses National Unity Council in Kathmandu" : "प्रधानमन्त्रीद्वारा काठमाडौंमा राष्ट्रिय एकता परिषदलाई सम्बोधन", category: language === "en" ? "Politics" : "राजनीति", views: "48,290", readTime: "4m 20s", completion: "88%", shares: "3.4k" },
    { id: "2", title: language === "en" ? "Dashain Festival Preparations Begin Across All 7 Provinces" : "सातै प्रदेशमा दशैं पर्वको तयारी सुरु, बजारमा चहलपहल", category: language === "en" ? "Culture" : "संस्कृति", views: "39,120", readTime: "3m 45s", completion: "92%", shares: "5.1k" },
    { id: "3", title: language === "en" ? "Nepal Rastra Bank Announces New Monetary Policy Reforms" : "नेपाल राष्ट्र बैंकद्वारा नयाँ मौद्रिक नीति सार्वजनिक", category: language === "en" ? "Economy" : "अर्थ", views: "31,840", readTime: "5m 10s", completion: "79%", shares: "1.8k" },
    { id: "4", title: language === "en" ? "Everest Base Camp Trek Sees Record International Tourist Influx" : "सगरमाथा बेसक्याम्प ट्रेकमा अन्तर्राष्ट्रिय पर्यटकको कीर्तिमानी आगमन", category: language === "en" ? "Tourism" : "पर्यटन", views: "27,550", readTime: "4m 05s", completion: "85%", shares: "2.9k" }
  ];

  const categoryPopularity = [
    { name: language === "en" ? "Politics & National" : "राजनीति तथा राष्ट्रिय", share: "34%", count: "124k views", color: "bg-primary" },
    { name: language === "en" ? "Culture & Festivals" : "संस्कृति तथा चाडपर्व", share: "28%", count: "98k views", color: "bg-amber-500" },
    { name: language === "en" ? "Economy & Markets" : "अर्थ तथा बजार", share: "18%", count: "64k views", color: "bg-emerald-500" },
    { name: language === "en" ? "Province & Local" : "प्रदेश तथा स्थानीय", share: "12%", count: "42k views", color: "bg-purple-500" },
    { name: language === "en" ? "Sports & Tourism" : "खेलकुद तथा पर्यटन", share: "8%", count: "29k views", color: "bg-blue-500" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-card-foreground tracking-tight flex items-center gap-2">
            <BarChart3 className="text-primary" size={24} />
            <span>{language === "en" ? "Editorial Analytics OS" : "सम्पादकीय एनालिटिक्स ओएस"}</span>
          </h2>
          <p className="text-xs text-muted-text mt-1">
            {language === "en" ? "Real-time content intelligence, reader engagement depth, and category velocity tracking." : "वास्तविक समयको सामग्री बौद्धिकता, पाठक संलग्नता गहिराई र श्रेणीगत गति अनुगमन।"}
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-muted-area p-1 rounded-2xl">
          {(["today", "week", "month"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all uppercase ${
                timeRange === range ? "bg-card text-card-foreground shadow-sm" : "text-muted-text hover:text-card-foreground"
              }`}
            >
              {range === "today" ? (language === "en" ? "Today" : "आज") : range === "week" ? (language === "en" ? "This Week" : "यो हप्ता") : (language === "en" ? "This Month" : "यो महिना")}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="space-y-2">
          <div className="flex items-center justify-between text-muted-text">
            <span className="text-xs font-black uppercase">{language === "en" ? "Total Page Views" : "कुल पृष्ठ हेराइ"}</span>
            <Eye size={18} className="text-primary" />
          </div>
          <div className="text-2xl font-black text-card-foreground">357,840</div>
          <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <TrendingUp size={12} /> +18.4% {language === "en" ? "vs yesterday" : "हिजोको तुलनामा"}
          </p>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center justify-between text-muted-text">
            <span className="text-xs font-black uppercase">{language === "en" ? "Avg. Read Time" : "औसत पठन समय"}</span>
            <Clock size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-card-foreground">3m 42s</div>
          <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <TrendingUp size={12} /> +12s {language === "en" ? "engagement" : "संलग्नता वृद्धि"}
          </p>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center justify-between text-muted-text">
            <span className="text-xs font-black uppercase">{language === "en" ? "Social Shares" : "सामाजिक सेयर"}</span>
            <Share2 size={18} className="text-purple-500" />
          </div>
          <div className="text-2xl font-black text-card-foreground">24,190</div>
          <p className="text-[11px] text-purple-600 font-bold flex items-center gap-1">
            <Flame size={12} /> {language === "en" ? "High viral velocity" : "उच्च भाइरल गति"}
          </p>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center justify-between text-muted-text">
            <span className="text-xs font-black uppercase">{language === "en" ? "Bookmarks & Saves" : "सुरक्षित ज्ञान"}</span>
            <Bookmark size={18} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-card-foreground">12,450</div>
          <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <TrendingUp size={12} /> +9.2% {language === "en" ? "library adds" : "सङ्ग्रह थप"}
          </p>
        </Card>
      </div>

      {/* Two Column Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Read Articles */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-card-foreground">
              {language === "en" ? "Most Read & Fastest Growing Stories" : "सर्वाधिक पठन तथा तीव्र गतिमा बढेका समाचारहरू"}
            </h3>
            <Badge variant="success">Live OS</Badge>
          </div>

          <div className="space-y-3">
            {topArticles.map((art, idx) => (
              <div key={art.id} className="bg-card border border-border-theme p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-primary/50 transition-all">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-xl bg-muted-area text-card-foreground font-black text-xs flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-primary">{art.category}</span>
                      <span className="text-[10px] text-muted-text">• Completion: {art.completion}</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-card-foreground line-clamp-1">{art.title}</h4>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-muted-text shrink-0">
                  <div className="text-right">
                    <div className="font-black text-card-foreground flex items-center gap-1"><Eye size={12} className="text-primary" /> {art.views}</div>
                    <div className="text-[10px]">Read: {art.readTime}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Popularity & Velocity */}
        <div className="space-y-4">
          <h3 className="text-base font-black text-card-foreground">
            {language === "en" ? "Category Popularity" : "श्रेणीगत लोकप्रियता"}
          </h3>

          <div className="bg-card border border-border-theme rounded-2xl p-5 space-y-4">
            {categoryPopularity.map((cat, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-card-foreground">
                  <span>{cat.name}</span>
                  <span className="font-mono text-muted-text">{cat.count} ({cat.share})</span>
                </div>
                <div className="w-full h-2.5 bg-muted-area rounded-full overflow-hidden">
                  <div className={`h-full ${cat.color} rounded-full`} style={{ width: cat.share }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
