import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play, Pause, SkipBack, SkipForward, ChevronUp, ChevronDown, X,
  Volume2, VolumeX, ListMusic, Shuffle, Repeat, Repeat1, RotateCcw, RotateCw,
  Sparkles, Trash2, BookmarkPlus, Disc3, Radio, ArrowUpRight, Activity, AlertCircle
} from "lucide-react";
import { useMediaOS } from "@/src/context/MediaOSContext";
import { formatAudioTime } from "@/src/services/ttsClient";
import { Link } from "react-router-dom";

export const PersistentPlayer: React.FC = () => {
  const {
    currentTrack,
    queue,
    currentIndex,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    playbackRate,
    isMuted,
    shuffle,
    repeatMode,
    playerState,
    queueTitle,
    voiceGender,
    diagnostics,
    togglePlay,
    playNext,
    playPrev,
    seek,
    skipSeconds,
    setRate,
    toggleMute,
    toggleShuffle,
    setRepeat,
    setPlayerState,
    closePlayer,
    setVoiceGender,
    removeFromQueue,
    clearQueue,
    savePlaylist,
  } = useMediaOS();

  const [showQueueDrawer, setShowQueueDrawer] = useState<boolean>(false);
  const [playlistTitleInput, setPlaylistTitleInput] = useState<string>("");
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState<boolean>(false);

  if (playerState === "hidden" || !currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSavePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistTitleInput.trim()) return;
    savePlaylist(playlistTitleInput.trim());
    setPlaylistTitleInput("");
    setShowSaveModal(false);
  };

  return (
    <AnimatePresence>
      {/* 1. EXPANDED PLAYER MODAL (State: expanded) */}
      {playerState === "expanded" && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-2xl flex flex-col justify-between overflow-y-auto p-4 md:p-8"
        >
          {/* Top Header Controls */}
          <div className="flex items-center justify-between border-b border-border-theme/60 pb-4">
            <button
              onClick={() => setPlayerState("minimized")}
              className="p-2.5 rounded-full bg-muted-area hover:bg-border-theme text-card-foreground transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <ChevronDown size={18} />
              <span>Minimize</span>
            </button>

            <div className="text-center px-4">
              <span className="text-xxs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest block">
                SanatanMarga Listen OS
              </span>
              <span className="text-xs font-bold text-card-foreground truncate max-w-xs block">
                {queueTitle}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQueueDrawer(!showQueueDrawer)}
                className={`p-2.5 rounded-full transition-colors cursor-pointer relative ${
                  showQueueDrawer ? "bg-amber-500 text-white" : "bg-muted-area hover:bg-border-theme text-card-foreground"
                }`}
                title="प्लेलिस्ट क्यु (Queue)"
              >
                <ListMusic size={18} />
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-mono font-black bg-amber-600 text-white rounded-full">
                  {queue.length}
                </span>
              </button>

              <button
                onClick={closePlayer}
                className="p-2.5 rounded-full bg-muted-area hover:bg-red-500/20 hover:text-red-500 text-muted-text transition-colors cursor-pointer"
                title="अडियो बन्द गर्नुहोस् (Close Audio)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Main Content Body */}
          <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 my-6 max-w-5xl mx-auto w-full">
            {/* Left/Top: Artwork & Title */}
            <div className="w-full lg:w-1/2 flex flex-col items-center text-center space-y-4">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/20 group">
                <img
                  src={currentTrack.imageUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800"}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {isBuffering && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <Disc3 size={48} className="text-amber-400 animate-spin" />
                  </div>
                )}
                <div className="absolute top-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-xxs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5 border border-amber-500/30">
                  <Radio size={12} className="text-amber-400 animate-pulse" />
                  <span>{currentTrack.district || currentTrack.category || "Sanatan Audio"}</span>
                </div>
              </div>

              <div className="space-y-1.5 max-w-md">
                <div className="flex items-center justify-center gap-2 flex-wrap pb-1">
                  <span className="px-2.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={10} className="text-amber-500" />
                    <span>अडियो साझेदार: नेपाल टेलिकम (NTC)</span>
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-card-foreground line-clamp-2 leading-snug">
                  {currentTrack.title}
                </h2>
                <p className="text-xs text-muted-text line-clamp-2 leading-relaxed">
                  {currentTrack.contentSummary}
                </p>
              </div>
            </div>

            {/* Right/Bottom: Up Next Queue Drawer OR Controls */}
            {showQueueDrawer ? (
              <div className="w-full lg:w-1/2 bg-card border border-border-theme rounded-3xl p-5 space-y-4 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-border-theme pb-2">
                  <h3 className="text-xs font-black uppercase text-card-foreground tracking-wider flex items-center gap-1.5">
                    <ListMusic size={14} className="text-amber-500" />
                    <span>Up Next ({queue.length})</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSaveModal(true)}
                      className="text-xxs font-bold text-amber-600 hover:underline flex items-center gap-1"
                    >
                      <BookmarkPlus size={12} />
                      <span>Save Playlist</span>
                    </button>
                    <button
                      onClick={clearQueue}
                      className="text-xxs font-bold text-red-500 hover:underline flex items-center gap-1"
                    >
                      <Trash2 size={12} />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {/* ListenOS Queue Sponsor Card */}
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center justify-between gap-3 text-xs shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-amber-500 text-white font-black flex items-center justify-center text-[10px] shrink-0">
                        SP
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400">
                            Queue Sponsor
                          </span>
                          <span className="text-[10px] text-muted-text">• नेपाल टेलिकम 5G</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">
                          निर्बाध डिजिटल अडियो स्ट्रिमिङको भरपर्दो साझेदार
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-md shrink-0">
                      प्रायोजित
                    </span>
                  </div>

                  {queue.map((item, idx) => (
                    <div
                      key={`${item.id || 'queue'}-${idx}`}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                        idx === currentIndex
                          ? "bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold"
                          : "bg-muted-area/30 border-border-theme/40 text-card-foreground hover:bg-muted-area"
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="font-mono text-xxs text-muted-text w-4 text-center">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <p className="truncate font-semibold">{item.title}</p>
                          <span className="text-[10px] text-muted-text">{item.category || "Audio"}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromQueue(item.id)}
                        className="p-1 hover:text-red-500 transition-colors text-muted-text"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full lg:w-1/2 flex flex-col items-center space-y-6">
                {/* Scrub Bar */}
                <div className="w-full space-y-2 max-w-md">
                  <div
                    className="relative w-full h-2.5 bg-muted-area rounded-full overflow-hidden cursor-pointer group"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const newTime = (clickX / rect.width) * duration;
                      seek(newTime);
                    }}
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-mono text-muted-text">
                    <span>{formatAudioTime(currentTime)}</span>
                    <span>{formatAudioTime(duration)}</span>
                  </div>
                </div>

                {/* Primary Playback Controls */}
                <div className="flex items-center gap-4 sm:gap-6">
                  <button
                    onClick={toggleShuffle}
                    className={`p-2.5 rounded-full transition-colors ${
                      shuffle ? "text-amber-500 bg-amber-500/10" : "text-muted-text hover:text-card-foreground"
                    }`}
                  >
                    <Shuffle size={18} />
                  </button>

                  <button
                    onClick={playPrev}
                    className="p-3 rounded-full hover:bg-muted-area text-card-foreground transition-colors cursor-pointer"
                  >
                    <SkipBack size={22} />
                  </button>

                  <button
                    onClick={() => skipSeconds(-10)}
                    className="p-2.5 rounded-full hover:bg-muted-area text-muted-text hover:text-card-foreground transition-colors cursor-pointer"
                    title="Skip 10s back"
                  >
                    <RotateCcw size={20} />
                  </button>

                  <button
                    onClick={togglePlay}
                    disabled={isBuffering}
                    className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    {isBuffering ? (
                      <Disc3 size={28} className="animate-spin" />
                    ) : isPlaying ? (
                      <Pause size={28} />
                    ) : (
                      <Play size={28} className="ml-1" />
                    )}
                  </button>

                  <button
                    onClick={() => skipSeconds(10)}
                    className="p-2.5 rounded-full hover:bg-muted-area text-muted-text hover:text-card-foreground transition-colors cursor-pointer"
                    title="Skip 10s forward"
                  >
                    <RotateCw size={20} />
                  </button>

                  <button
                    onClick={playNext}
                    className="p-3 rounded-full hover:bg-muted-area text-card-foreground transition-colors cursor-pointer"
                  >
                    <SkipForward size={22} />
                  </button>

                  <button
                    onClick={() => setRepeat(repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off")}
                    className={`p-2.5 rounded-full transition-colors ${
                      repeatMode !== "off" ? "text-amber-500 bg-amber-500/10" : "text-muted-text hover:text-card-foreground"
                    }`}
                  >
                    {repeatMode === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
                  </button>
                </div>

                {/* Speed & Voice Options */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
                  {/* Speed Selector */}
                  <div className="flex items-center bg-muted-area/50 p-1 rounded-full border border-border-theme">
                    {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setRate(rate)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                          playbackRate === rate
                            ? "bg-amber-500 text-white shadow-sm"
                            : "text-muted-text hover:text-card-foreground"
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>

                  {/* Voice Gender Switch */}
                  <div className="flex items-center bg-muted-area/50 p-1 rounded-full border border-border-theme">
                    <button
                      onClick={() => setVoiceGender("female")}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                        voiceGender === "female" ? "bg-amber-600 text-white" : "text-muted-text"
                      }`}
                    >
                      महिला स्वर
                    </button>
                    <button
                      onClick={() => setVoiceGender("male")}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                        voiceGender === "male" ? "bg-amber-600 text-white" : "text-muted-text"
                      }`}
                    >
                      पुरुष स्वर
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Footer Actions */}
          <div className="flex items-center justify-between border-t border-border-theme/60 pt-4">
            <Link
              to="/listen"
              onClick={() => setPlayerState("minimized")}
              className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
            >
              <span>Full SanatanMarga Listen Hub</span>
              <ArrowUpRight size={14} />
            </Link>

            <button
              onClick={toggleMute}
              className="p-2 rounded-full hover:bg-muted-area text-muted-text hover:text-card-foreground transition-colors"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </motion.div>
      )}

      {/* 2. MINIMIZED PERSISTENT BAR (State: minimized) */}
      {playerState === "minimized" && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+54px)] left-0 right-0 w-full z-[45] md:bottom-0 rounded-none bg-card/95 backdrop-blur-xl border-t border-amber-500/30 shadow-lg px-4 py-2 sm:px-6"
        >
          {/* Progress Bar Top Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted-area">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Left: Thumbnail & Track Title */}
            <div
              onClick={() => setPlayerState("expanded")}
              className="flex items-center gap-3 cursor-pointer overflow-hidden flex-1 min-w-0 group"
            >
              <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-muted-area border border-border-theme">
                <img
                  src={currentTrack.imageUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200"}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Sparkles size={16} className="text-amber-400 animate-pulse" />
                  </div>
                )}
              </div>

              <div className="truncate">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                    {currentTrack.category || "Audio"}
                  </span>
                  <span className="text-[10px] font-mono text-muted-text">
                    ({currentIndex + 1}/{queue.length})
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-card-foreground truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {currentTrack.title}
                </p>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => setRate(playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : playbackRate === 1.5 ? 2 : 1)}
                className="hidden sm:inline-flex px-2 py-1 rounded-full bg-muted-area border border-border-theme text-[10px] font-mono font-bold text-card-foreground hover:bg-amber-500 hover:text-white transition-colors"
                title="Change speed"
              >
                {playbackRate}x
              </button>

              <button
                onClick={playPrev}
                className="p-2 rounded-full hover:bg-muted-area text-card-foreground transition-colors cursor-pointer hidden sm:block"
              >
                <SkipBack size={18} />
              </button>

              <button
                onClick={togglePlay}
                disabled={isBuffering}
                className="p-2.5 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-md hover:scale-105 transition-all cursor-pointer"
              >
                {isBuffering ? (
                  <Disc3 size={18} className="animate-spin" />
                ) : isPlaying ? (
                  <Pause size={18} />
                ) : (
                  <Play size={18} className="ml-0.5" />
                )}
              </button>

              <button
                onClick={playNext}
                className="p-2 rounded-full hover:bg-muted-area text-card-foreground transition-colors cursor-pointer"
              >
                <SkipForward size={18} />
              </button>

              <button
                onClick={() => setShowDiagnosticsModal(true)}
                className="p-2 rounded-full hover:bg-muted-area text-amber-500 hover:text-amber-600 transition-colors cursor-pointer"
                title="ListenOS Diagnostics"
              >
                <Activity size={18} />
              </button>

              <button
                onClick={() => setPlayerState("expanded")}
                className="p-2 rounded-full hover:bg-muted-area text-muted-text hover:text-card-foreground transition-colors cursor-pointer"
                title="Expand Player"
              >
                <ChevronUp size={20} />
              </button>

              <button
                onClick={closePlayer}
                className="p-1.5 rounded-full hover:bg-muted-area text-muted-text hover:text-red-500 transition-colors cursor-pointer"
                title="अडियो बन्द गर्नुहोस् (Close Player)"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Save Playlist Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border-theme rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-black text-card-foreground">प्लेलिस्ट सेभ गर्नुहोस् (Save Playlist)</h3>
            <form onSubmit={handleSavePlaylistSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="प्लेलिस्टको नाम (e.g. आजका प्रमुख खबरहरू)"
                value={playlistTitleInput}
                onChange={(e) => setPlaylistTitleInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-xs text-card-foreground focus:outline-none focus:border-amber-500"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-text hover:bg-muted-area"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-md hover:bg-amber-700"
                >
                  सेभ गर्नुहोस्
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ListenOS Queue Diagnostic Panel Modal */}
      {showDiagnosticsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border border-border-theme rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-theme pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500 animate-pulse" />
                <h3 className="text-base font-bold text-card-foreground">ListenOS Queue Diagnostics</h3>
              </div>
              <button
                onClick={() => setShowDiagnosticsModal(false)}
                className="p-1.5 rounded-full hover:bg-muted-area text-muted-text"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-muted-area/50 p-2.5 rounded-xl border border-border-theme">
                <span className="text-muted-text block text-[10px]">Nepal Date</span>
                <span className="font-bold text-amber-500">{diagnostics?.nepalDate || "2026-08-28"}</span>
              </div>
              <div className="bg-muted-area/50 p-2.5 rounded-xl border border-border-theme">
                <span className="text-muted-text block text-[10px]">Published Articles</span>
                <span className="font-bold text-emerald-500">{diagnostics?.todayPublishedCount || 0}</span>
              </div>
              <div className="bg-muted-area/50 p-2.5 rounded-xl border border-border-theme">
                <span className="text-muted-text block text-[10px]">Verified Articles</span>
                <span className="font-bold text-sky-500">{diagnostics?.verifiedCount || 0}</span>
              </div>
              <div className="bg-muted-area/50 p-2.5 rounded-xl border border-border-theme">
                <span className="text-muted-text block text-[10px]">Eligible Audio</span>
                <span className="font-bold text-indigo-500">{diagnostics?.eligibleAudioCount || 0}</span>
              </div>
              <div className="bg-muted-area/50 p-2.5 rounded-xl border border-border-theme">
                <span className="text-muted-text block text-[10px]">Cached Audio</span>
                <span className="font-bold text-teal-500">{diagnostics?.cachedAudioCount || 0}</span>
              </div>
              <div className="bg-muted-area/50 p-2.5 rounded-xl border border-border-theme">
                <span className="text-muted-text block text-[10px]">Excluded Count</span>
                <span className="font-bold text-rose-500">{diagnostics?.excludedArticles?.length || 0}</span>
              </div>
            </div>

            {/* Queue List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-card-foreground flex items-center justify-between">
                <span>Active Queue Tracks ({queue.length})</span>
                <span className="text-[10px] text-amber-500 font-semibold uppercase">
                  Sponsor Tracks: {diagnostics?.sponsorTracksCount || 0}
                </span>
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {queue.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-2 rounded-lg text-xs flex items-center justify-between border ${
                      idx === currentIndex
                        ? "bg-amber-500/15 border-amber-500/40 font-bold text-amber-600 dark:text-amber-400"
                        : item.isSponsor
                        ? "bg-indigo-500/10 border-indigo-500/20"
                        : "bg-muted-area/30 border-border-theme"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] text-muted-text w-4">{idx + 1}.</span>
                      {item.isSponsor ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500 text-white font-bold uppercase">
                          SPONSOR
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                          NEWS
                        </span>
                      )}
                      <span className="truncate">{item.title}</span>
                    </div>
                    {item.isSponsor && (
                      <span className="text-[10px] text-amber-500 font-medium shrink-0 ml-2">
                        {item.sponsorName}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Excluded Articles Section */}
            <div className="space-y-2 pt-2 border-t border-border-theme">
              <h4 className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Excluded Articles Diagnostics ({diagnostics?.excludedArticles?.length || 0})
              </h4>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {diagnostics?.excludedArticles?.map((ex, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs">
                    <div className="font-semibold text-rose-600 dark:text-rose-400 truncate">{ex.title}</div>
                    <div className="text-[10px] text-muted-text mt-0.5">
                      <span className="font-bold text-rose-500 uppercase">Reason:</span> {ex.reason}
                    </div>
                  </div>
                ))}
                {(!diagnostics?.excludedArticles || diagnostics.excludedArticles.length === 0) && (
                  <div className="text-xs text-muted-text italic text-center py-2">
                    कुनै पनि समाचार अस्वीकृत/हटाइएको छैन।
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PersistentPlayer;
