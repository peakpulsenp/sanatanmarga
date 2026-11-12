import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Headphones, Play, Sparkles, Radio, Bookmark, MapPin, Layers,
  CheckCircle2, Music, Volume2, ShieldCheck, RefreshCw, ListMusic, Plus,
  Trash2, Save, Disc3
} from "lucide-react";
import { useMediaOS } from "@/src/context/MediaOSContext";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { LAST_VERIFIED_ARTICLES } from "@/src/constants/backupData";
import type { Article } from "@/src/types";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";

export default function ListenPage() {
  const {
    currentTrack,
    isPlaying,
    queue,
    playQueue,
    playArticle,
    enqueueArticle,
    voiceGender,
    setVoiceGender,
    savedPlaylists,
    playSavedPlaylist,
    deletePlaylist,
    savePlaylist,
  } = useMediaOS();

  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("काठमाडौँ");
  const [loading, setLoading] = useState<boolean>(true);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState<string>("");
  const [showSaveInput, setShowSaveInput] = useState<boolean>(false);

  useEffect(() => {
    const loadSnapshot = async () => {
      try {
        const snap = await snapshotEngine.getHomepageSnapshot();
        const all = [
          ...(snap.latestNews || []),
          ...(snap.trendingNews || []),
          ...(snap.featuredArticles || []),
        ];
        if (all.length > 0) {
          setArticles(all);
        } else {
          setArticles(LAST_VERIFIED_ARTICLES);
        }
      } catch (err) {
        console.warn("[ListenPage] Error loading news snapshot, using backup:", err);
        setArticles(LAST_VERIFIED_ARTICLES);
      } finally {
        setLoading(false);
      }
    };
    loadSnapshot();
  }, []);

  const getSourceArticles = () => (articles.length > 0 ? articles : LAST_VERIFIED_ARTICLES);

  const handlePlayDailyBriefing = () => {
    const pool = getSourceArticles();
    playQueue(pool.slice(0, 10), "🎧 आजको दैनिक बुलेटिन (Today's Daily Briefing)");
  };

  const handlePlayCategory = (categoryName: string, categoryLabel: string) => {
    const pool = getSourceArticles();
    const matched = pool.filter(a =>
      (a.categoryName || a.category || "").toLowerCase().includes(categoryName.toLowerCase())
    );
    const list = matched.length >= 3 ? matched : pool.slice(0, 6);
    playQueue(list, `🎧 ${categoryLabel} श्रव्य खबर`);
  };

  const handlePlayDistrict = (districtName: string) => {
    const pool = getSourceArticles();
    const matched = pool.filter(a => {
      const d = (a as any).district || (a.districts && a.districts[0]) || "";
      return d.toLowerCase().includes(districtName.toLowerCase());
    });
    const list = matched.length >= 2 ? matched : pool.slice(0, 5);
    playQueue(list, `🎧 ${districtName} जिल्ला विशेष श्रव्य समाचार`);
  };

  const handleSaveCurrentQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim() || queue.length === 0) return;
    savePlaylist(newPlaylistTitle.trim());
    setNewPlaylistTitle("");
    setShowSaveInput(false);
  };

  return (
    <div className="min-h-screen bg-background text-card-foreground flex flex-col">
      <Header />

      <main className="flex-1 container-custom py-8 px-4 space-y-10">
        {/* HERO SECTION */}
        <section className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900 text-white p-6 md:p-10 overflow-hidden shadow-2xl border border-amber-500/20">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Headphones size={280} className="text-amber-400" />
          </div>

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-widest">
              <Sparkles size={14} className="text-amber-400 animate-pulse" />
              <span>SanatanMarga Listen OS • श्रव्य ओएस</span>
            </div>

            <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
              तपाईंको व्यक्तिगत समाचार तथा ज्ञान वाचक (Personal News Briefing)
            </h1>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              ताजा समाचार, विश्लेषण, वेद-ग्रन्थ र नेपालका ७७ वटै जिल्लाका स्थानीय खबरहरू बिना रुकावट सुन्नुहोस्।
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={handlePlayDailyBriefing}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl font-black text-xs md:text-sm shadow-xl flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
              >
                <Play size={18} className="fill-current" />
                <span>आजको दैनिक बुलेटिन सुन्नुहोस् (Listen Daily Briefing)</span>
              </button>

              <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-amber-500/20 text-xs font-bold text-amber-300">
                <Volume2 size={16} />
                <span>वाचक स्वर:</span>
                <button
                  onClick={() => setVoiceGender("female")}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] transition-all ${
                    voiceGender === "female" ? "bg-amber-500 text-white" : "text-slate-300 hover:text-white"
                  }`}
                >
                  महिला
                </button>
                <button
                  onClick={() => setVoiceGender("male")}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] transition-all ${
                    voiceGender === "male" ? "bg-amber-500 text-white" : "text-slate-300 hover:text-white"
                  }`}
                >
                  पुरुष
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ONE-TAP STATIONS GRID */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-border-theme pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-card-foreground flex items-center gap-2">
                <Radio className="text-amber-500" size={20} />
                <span>विशेष श्रव्य स्टेशनहरू (One-Tap Audio Stations)</span>
              </h2>
              <p className="text-xs text-muted-text">विषयवस्तु अनुसार निर्मित स्वचालित श्रव्य प्रवाह।</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                id: "daily",
                title: "आजको दैनिक बुलेटिन",
                desc: "दिनभरका प्रमुख १० समाचारको सार-संक्षेप",
                icon: Radio,
                action: handlePlayDailyBriefing,
                color: "from-amber-500/10 to-amber-600/10 border-amber-500/30 text-amber-600",
              },
              {
                id: "desh",
                title: "देश तथा प्रदेश खबर",
                desc: "नेपालको राजनीति र प्रादेशिक गतिविधि",
                icon: Layers,
                action: () => handlePlayCategory("desh", "देश तथा प्रदेश"),
                color: "from-blue-500/10 to-blue-600/10 border-blue-500/30 text-blue-600",
              },
              {
                id: "economy",
                title: "अर्थ तथा सेयर बजार",
                desc: "नेप्से, व्यापार, बजेट र मौद्रिक नीति",
                icon: Sparkles,
                action: () => handlePlayCategory("economy", "अर्थ र बजार"),
                color: "from-emerald-500/10 to-emerald-600/10 border-emerald-500/30 text-emerald-600",
              },
              {
                id: "grantha",
                title: "धर्म, मन्त्र र ग्रन्थ",
                desc: "भगवद्गीता, वेद र धर्मशास्त्रको वाचन",
                icon: Music,
                action: () => handlePlayCategory("grantha", "धर्म र ग्रन्थ"),
                color: "from-purple-500/10 to-purple-600/10 border-purple-500/30 text-purple-600",
              },
            ].map((st) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.id}
                  onClick={st.action}
                  className={`bg-gradient-to-br ${st.color} border rounded-2xl p-5 space-y-3 shadow-sm hover:shadow-md transition-all cursor-pointer group`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="w-6 h-6" />
                    <span className="p-2 rounded-full bg-card shadow-sm group-hover:scale-110 transition-transform">
                      <Play size={14} className="fill-current text-card-foreground" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-card-foreground group-hover:text-amber-600 transition-colors">
                      {st.title}
                    </h3>
                    <p className="text-xs text-muted-text mt-1">{st.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* LISTEN BY DISTRICT (77 DISTRICTS) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-theme pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-card-foreground flex items-center gap-2">
                <MapPin className="text-amber-500" size={20} />
                <span>७७ जिल्ला श्रव्य खबर (District Briefings)</span>
              </h2>
              <p className="text-xs text-muted-text">नेपालको जुनसुकै जिल्ला चयन गरी स्थानीय खबर सुन्नुहोस्।</p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {["काठमाडौँ", "कास्की (पोखरा)", "झापा", "मोरङ", "चितवन", "बाँके (नेपालगञ्ज)", "सुर्खेत"].map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setSelectedDistrict(d);
                    handlePlayDistrict(d);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedDistrict === d
                      ? "bg-amber-600 text-white shadow-md"
                      : "bg-muted-area hover:bg-border-theme text-card-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* LATEST NEWS STORIES WITH DIRECT AUDIO LAUNCH */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-border-theme pb-3">
            <h2 className="text-base sm:text-lg font-black text-card-foreground flex items-center gap-2">
              <Headphones className="text-amber-500" size={20} />
              <span>ताजा समाचार सूची (Listen to Individual Stories)</span>
            </h2>
            <span className="text-xs text-muted-text font-bold">
              कुल {articles.length} समाचार उपलब्ध
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.slice(0, 9).map((art) => (
              <article
                key={art.id}
                className="bg-card border border-border-theme rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-sm hover:border-amber-500/40 transition-all group"
              >
                <div className="flex gap-3">
                  {art.featuredImage && (
                    <img
                      src={art.featuredImage}
                      alt={art.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-muted-area"
                    />
                  )}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      {art.categoryName || art.category || "समाचार"}
                    </span>
                    <h3 className="text-xs font-bold text-card-foreground line-clamp-2 leading-snug">
                      {art.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border-theme/60 text-xs">
                  <button
                    onClick={() => playArticle(art)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Play size={12} className="fill-current" />
                    <span>अहिले सुन्नुहोस्</span>
                  </button>

                  <button
                    onClick={() => enqueueArticle(art)}
                    className="p-1.5 rounded-xl bg-muted-area hover:bg-border-theme text-muted-text hover:text-card-foreground transition-all cursor-pointer"
                    title=" Add to Queue"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* SAVED PLAYLISTS SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base font-black text-card-foreground flex items-center gap-2">
              <ListMusic className="text-amber-500" size={18} />
              <span>तपाईंका सेभ गरिएका प्लेलिस्टहरू (My Saved Playlists)</span>
            </h2>

            {queue.length > 0 && (
              <button
                onClick={() => setShowSaveInput(!showSaveInput)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save size={14} />
                <span>अहिलेको क्यु सेभ गर्नुहोस् ({queue.length} समाचार)</span>
              </button>
            )}
          </div>

          {/* Form to save current queue as new playlist */}
          {showSaveInput && (
            <form onSubmit={handleSaveCurrentQueue} className="bg-card border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-md transition-all">
              <label className="text-xs font-bold text-card-foreground block">
                नयाँ प्लेलिस्टको नाम दिनुहोस् (Playlist Name):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  placeholder="उदा. मेरो बिहानीको मुख्य समाचार"
                  className="flex-1 bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground focus:outline-none focus:border-amber-500"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <Save size={14} />
                  <span>सेभ गर्नुहोस्</span>
                </button>
              </div>
            </form>
          )}

          {savedPlaylists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedPlaylists.map((pl) => (
                <div
                  key={pl.id}
                  className="bg-card border border-border-theme hover:border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-sm transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-600">
                      <span className="flex items-center gap-1">
                        <Disc3 size={13} className="text-amber-500 animate-spin-slow" />
                        {pl.itemCount} समाचारहरू
                      </span>
                      <span className="text-[10px] font-mono text-muted-text">
                        {new Date(pl.createdAt).toLocaleDateString("ne-NP")}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-card-foreground group-hover:text-amber-600 transition-colors line-clamp-2">
                      {pl.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-theme/60 gap-2">
                    <button
                      onClick={() => playSavedPlaylist(pl)}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-500 text-white hover:bg-amber-600 font-bold transition-all flex items-center justify-center gap-2 text-xs shadow-sm cursor-pointer"
                    >
                      <Play size={14} className="fill-current" />
                      <span>अहिले सुन्नुहोस् (Play All)</span>
                    </button>

                    <button
                      onClick={() => deletePlaylist(pl.id)}
                      className="p-2 rounded-xl bg-muted-area hover:bg-rose-500/10 text-muted-text hover:text-rose-500 transition-all cursor-pointer"
                      title="प्लेलिस्ट हटाउनुहोस् (Delete Playlist)"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border-theme rounded-2xl p-6 text-center space-y-2">
              <ListMusic className="mx-auto text-muted-text" size={32} />
              <p className="text-xs font-semibold text-muted-text">
                कुनै सेभ गरिएको प्लेलिस्ट भेटिएन। माथि दिइएको 'अहिलेको क्यु सेभ गर्नुहोस्' थिचेर आफ्नै प्लेलिस्ट बनाउनुहोस्।
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
