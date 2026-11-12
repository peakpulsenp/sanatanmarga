import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import LiveHero from "../components/live/LiveHero";
import LivePlayer from "../components/live/LivePlayer";
import LiveCategoryBar from "../components/live/LiveCategoryBar";
import LiveNowRail from "../components/live/LiveNowRail";
import LiveIntelligence from "../components/live/LiveIntelligence";
import LiveAcrossNepal from "../components/live/LiveAcrossNepal";
import UpcomingLive from "../components/live/UpcomingLive";
import LiveAudioRail from "../components/live/LiveAudioRail";
import ReplayGrid from "../components/live/ReplayGrid";
import LivePolling from "../components/live/LivePolling";
import LiveQA from "../components/live/LiveQA";
import LiveFactCheck from "../components/live/LiveFactCheck";
import { LiveService } from "../services/liveService";
import { LiveVideo, LiveStreamSettings } from "../types/live";
import { Radio, RefreshCw, AlertCircle, Sparkles, ShieldCheck, Vote, MessageSquare, ShieldAlert, Cpu } from "lucide-react";
import { toast } from "sonner";

export default function LivePage() {
  const { videoId } = useParams<{ videoId?: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [liveNow, setLiveNow] = useState<LiveVideo[]>([]);
  const [scheduled, setScheduled] = useState<LiveVideo[]>([]);
  const [latestVideos, setLatestVideos] = useState<LiveVideo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [settings, setSettings] = useState<LiveStreamSettings | undefined>();
  const [activeVideo, setActiveVideo] = useState<LiveVideo | undefined>();
  const [activeInteractiveTab, setActiveInteractiveTab] = useState<"intel" | "poll" | "qa" | "factcheck">("intel");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const snap = await LiveService.getLiveSnapshot();
      setLiveNow(snap.liveNow || []);
      setScheduled(snap.scheduled || []);
      setLatestVideos(snap.latestVideos || []);
      setCategories(snap.categories || []);
      setSettings(snap.settings);

      // Determine active hero video
      const allVideos = [...(snap.liveNow || []), ...(snap.latestVideos || []), ...(snap.scheduled || [])];
      if (videoId) {
        const found = allVideos.find(v => v.id === videoId);
        if (found) {
          setActiveVideo(found);
        } else {
          setActiveVideo(snap.featured || snap.liveNow[0] || snap.latestVideos[0] || allVideos[0]);
        }
      } else {
        setActiveVideo(snap.featured || snap.liveNow[0] || snap.latestVideos[0] || allVideos[0]);
      }
    } catch (err) {
      console.error("LivePage load error:", err);
      toast.error("लाइभ डाटा लोड गर्न सकिएन");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sanatan-media-mutex", { detail: { source: "live-tv" } }));
    }
  }, [videoId]);

  // Filtered videos by category if selected
  const filteredLiveNow = selectedCategory 
    ? liveNow.filter(v => v.category === selectedCategory) 
    : liveNow;

  const filteredLatest = selectedCategory 
    ? latestVideos.filter(v => v.category === selectedCategory) 
    : latestVideos;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black pb-24 lg:pb-12">
      {/* HEADER */}
      <Header />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
        {isLoading ? (
          <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-3">
            <RefreshCw size={28} className="animate-spin text-amber-500" />
            <p className="text-xs text-zinc-400 font-medium">लाइभ मिडिया इन्टेलिजेन्स हब लोड हुँदैछ...</p>
          </div>
        ) : (
          <>
            {/* LIVE HUB BANNER / HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                  <span className="text-xs font-black tracking-widest text-red-500 uppercase">
                    LIVE MEDIA INTELLIGENCE HUB
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  नेपालमा अहिले के भइरहेको छ?
                </h1>
                <p className="text-xs text-zinc-400">
                  Watch. Listen. Understand. Follow. — Verified Real-time Coverage & 77 District Intelligence.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-zinc-300 text-xs font-mono flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Provenance-Secured OS</span>
                </div>
              </div>
            </div>

            {/* CATEGORY FILTER BAR */}
            <LiveCategoryBar
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* HERO SECTION: DOMINANT PLAYER + CHAT HUB */}
            <div className="w-full">
              <LiveHero video={activeVideo} settings={settings} />
            </div>

            {/* LIVE NOW RAIL (HORIZONTAL STREAM SWITCHER) */}
            {filteredLiveNow.length > 0 && (
              <div className="w-full">
                <LiveNowRail liveNow={filteredLiveNow} activeVideoId={activeVideo?.id} />
              </div>
            )}

            {/* BROADCAST CONTROL ROOM INTERACTIVE OS SUITE */}
            <div className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-black">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white">
                      प्रत्यक्ष प्रसारण कक्ष तथा जनसहभागिता (Live Newsroom Interactive OS)
                    </h2>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Real-time Polling • Moderated Q&A • Fact-Checking • Intelligence Graph
                    </span>
                  </div>
                </div>

                {/* TAB SWITCHERS */}
                <div className="flex items-center gap-1.5 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 overflow-x-auto">
                  {[
                    { id: "intel", label: "इन्टेलिजेन्स (Intel Graph)", icon: Cpu },
                    { id: "poll", label: "प्रत्यक्ष पोल (Live Poll)", icon: Vote },
                    { id: "qa", label: "प्रश्नोत्तर (Live Q&A)", icon: MessageSquare },
                    { id: "factcheck", label: "तथ्य जाँच (Fact Check)", icon: ShieldAlert },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeInteractiveTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveInteractiveTab(tab.id as any)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                          isActive 
                            ? "bg-amber-500 text-black font-black shadow-md" 
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <Icon size={13} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TAB CONTENT PANELS */}
              <div>
                {activeInteractiveTab === "intel" && activeVideo && (
                  <LiveIntelligence video={activeVideo} />
                )}
                {activeInteractiveTab === "poll" && (
                  <LivePolling videoId={activeVideo?.id} />
                )}
                {activeInteractiveTab === "qa" && (
                  <LiveQA videoId={activeVideo?.id} />
                )}
                {activeInteractiveTab === "factcheck" && (
                  <LiveFactCheck videoId={activeVideo?.id} />
                )}
              </div>
            </div>

            {/* LIVE ACROSS NEPAL (77 DISTRICTS EXPLORER) */}
            <LiveAcrossNepal videos={[...liveNow, ...latestVideos]} />

            {/* UPCOMING LIVE STREAMS */}
            <UpcomingLive scheduled={scheduled} />

            {/* LIVE AUDIO / RADIO */}
            <LiveAudioRail />

            {/* REPLAYS & ARCHIVE */}
            <ReplayGrid latestVideos={filteredLatest} />
          </>
        )}
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

