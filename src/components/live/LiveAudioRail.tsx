import { useState } from "react";
import { Radio, Volume2, Play, Square, Headphones, Sparkles } from "lucide-react";
import { audioPlaybackManager } from "../../services/audioPlaybackManager";
import { toast } from "sonner";

const LIVE_AUDIO_STREAMS = [
  { id: "radio-nepal-1", title: "सनातन मार्ग लाइव रेडियो (SanatanMarga Live Radio)", sourceUrl: "https://stream.zeno.fm/f32r4hbf684uv", category: "Live Audio", duration: "24/7 Live", isLive: true },
  { id: "news-bulletin-1", title: "आजको प्रमुख बुलेटिन (Today's 8-Min Intelligence Briefing)", sourceUrl: "https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg", category: "Bulletin", duration: "8 मिनेट", isLive: false },
  { id: "vedic-chant-1", title: "वेद वाणी तथा प्रातःकालीन मन्त्र (Vedic Audio Edition)", sourceUrl: "https://actions.google.com/sounds/v1/ambiences/morning_birds.ogg", category: "Sanatan Audio", duration: "15 मिनेट", isLive: false }
];

export default function LiveAudioRail() {
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handlePlayAudio = async (stream: typeof LIVE_AUDIO_STREAMS[0]) => {
    try {
      if (playingId === stream.id) {
        audioPlaybackManager.stop();
        setPlayingId(null);
        toast.success("अडियो बन्द गरियो");
      } else {
        audioPlaybackManager.stop();
        await audioPlaybackManager.playTrack({
          id: stream.id,
          title: stream.title,
          sourceUrl: stream.sourceUrl,
          sourceType: stream.isLive ? "RADIO_STREAM" : "REMOTE_CDN",
          isLiveStream: stream.isLive
        });
        setPlayingId(stream.id);
        toast.success(`प्ले हुँदैछ: ${stream.title}`);
      }
    } catch (e: any) {
      console.error("Audio playback error:", e);
      if (e?.name === "NotAllowedError") {
        toast.error("अटोप्ले प्रतिबन्धित छ। कृपया प्ले बटन फेरि थिच्नुहोस्।");
      } else {
        toast.error("लाइभ स्ट्रिम जडान असफल (Stream Unavailable)");
      }
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Radio size={18} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wide">
              🎧 LIVE AUDIO / RADIO (श्रव्य समाचार तथा रेडियो)
            </h3>
            <p className="text-[11px] text-zinc-400">Integrated with single audio playback manager (ListenOS)</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold text-[10px] flex items-center gap-1">
          <Headphones size={12} />
          Single Audio Invariant
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {LIVE_AUDIO_STREAMS.map((stream) => {
          const isPlaying = playingId === stream.id;
          return (
            <div
              key={stream.id}
              onClick={() => handlePlayAudio(stream)}
              className={`group p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                isPlaying
                  ? "bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                  : "bg-zinc-950/80 hover:bg-zinc-800/80 border-zinc-800"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase">
                    {stream.category}
                  </span>
                  <span className="text-zinc-400 font-mono">{stream.duration}</span>
                </div>
                <h4 className="text-xs font-bold text-zinc-100 group-hover:text-cyan-400 transition-colors line-clamp-2">
                  {stream.title}
                </h4>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                <span className="text-[11px] text-zinc-400">
                  {isPlaying ? "LIVE PLAYING..." : "सुन्नुहोस्"}
                </span>
                <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isPlaying ? "bg-cyan-500 text-black shadow" : "bg-zinc-800 text-zinc-200 group-hover:bg-cyan-500 group-hover:text-black"
                }`}>
                  {isPlaying ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
