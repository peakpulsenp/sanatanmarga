import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Bookmark, 
  Search, 
  Clock, 
  CheckCircle2, 
  Share2, 
  FileText, 
  ExternalLink,
  Sparkles,
  Layers,
  HelpCircle,
  Video,
  ListOrdered,
  BookOpen
} from "lucide-react";

export type VideoProvider = "youtube" | "vimeo" | "mp4" | "cloudflare";

export interface VideoChapter {
  id: string;
  title: string;
  titleNepali: string;
  timestampSeconds: number;
  timestampDisplay: string;
}

export interface TranscriptLine {
  id: string;
  speaker: string;
  timestampSeconds: number;
  timestampDisplay: string;
  text: string;
  textNepali: string;
}

export interface TrainingVideo {
  id: string;
  title: string;
  titleNepali: string;
  category: "AI Newsroom" | "SGIS Epigraphy" | "MediaOS & Radio" | "Governance" | "Sacred Commerce" | "Infrastructure";
  provider: VideoProvider;
  videoUrl: string;
  embedSrc?: string;
  thumbnail: string;
  durationDisplay: string;
  durationSeconds: number;
  instructorName: string;
  instructorRole: string;
  description: string;
  chapters: VideoChapter[];
  notes: string[];
  transcripts: TranscriptLine[];
}

export interface UserTimestampBookmark {
  id: string;
  videoId: string;
  timestampSeconds: number;
  timestampDisplay: string;
  note: string;
  createdAt: string;
}

export const TRAINING_VIDEOS: TrainingVideo[] = [
  {
    id: "vid-ai-newsroom",
    title: "AI Newsroom Autonomous Verification & Grounding Engine",
    titleNepali: "एआई न्यूजरूम स्वचालित प्रमाणीकरण तथा ग्राउन्डिङ मास्टरक्लास",
    category: "AI Newsroom",
    provider: "youtube",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Safe placeholder embed
    embedSrc: "https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1",
    thumbnail: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80",
    durationDisplay: "14:20",
    durationSeconds: 860,
    instructorName: "Dr. Bishal Upadhyaya",
    instructorRole: "Chief AI Systems Architect",
    description: "Learn how the autonomous newsroom queries Google Search Grounding, enforces the 72-hour freshness gate, and rejects unverified gossip with fail-closed triggers.",
    chapters: [
      { id: "c1", title: "Introduction & Platform Topology", titleNepali: "परिचय तथा प्रणाली संरचना", timestampSeconds: 0, timestampDisplay: "00:00" },
      { id: "c2", title: "Google Search Grounding Pipeline", titleNepali: "गुगल सर्च ग्राउन्डिङ संकलन", timestampSeconds: 125, timestampDisplay: "02:05" },
      { id: "c3", title: "The 72-Hour Freshness Gate in Practice", titleNepali: "७२-घण्टे ताजापन नियम अभ्यास", timestampSeconds: 340, timestampDisplay: "05:40" },
      { id: "c4", title: "Corroboration Matrix & Fail-Closed Guard", titleNepali: "तथ्य पुष्टीकरण तथा सुरक्षा गेट", timestampSeconds: 580, timestampDisplay: "09:40" },
      { id: "c5", title: "Four-Eyes Editorial Publishing Demo", titleNepali: "चार-आँखे सम्पादन स्वीकृति प्रत्यक्ष अभ्यास", timestampSeconds: 720, timestampDisplay: "12:00" }
    ],
    notes: [
      "Rule 01: 'No Source = No Story'. Always require at least two primary source URLs.",
      "The 72-hour freshness gate uses cryptographically validated HTTP Last-Modified headers.",
      "Never approve drafts with confidence scores below 92% without senior editor signoff."
    ],
    transcripts: [
      { id: "t1", speaker: "Dr. Bishal", timestampSeconds: 5, timestampDisplay: "00:05", text: "Welcome to the SanatanMarga AI Newsroom masterclass. Today we examine the fail-closed autonomous architecture.", textNepali: "सनातनमार्ग एआई न्यूजरूम मास्टरक्लासमा स्वागत छ। आज हामी सुरक्षा प्रणाली बुझ्नेछौं।" },
      { id: "t2", speaker: "Dr. Bishal", timestampSeconds: 130, timestampDisplay: "02:10", text: "When an event occurs, Google Search Grounding extracts factual entities like named organizations and locations.", textNepali: "घटना हुनासाथ गुगल सर्च ग्राउन्डिङले प्रमाणित व्यक्ति र स्थान पहिचान गर्छ।" },
      { id: "t3", speaker: "Dr. Bishal", timestampSeconds: 350, timestampDisplay: "05:50", text: "Notice how the 72-hour gate immediately halts older stories to prevent recycled outdated rumors.", textNepali: "हेर्नुहोस्, ७२ घण्टा पुरानो समाचारलाई प्रणालीले कसरी तुरुन्त रोक्छ।" },
      { id: "t4", speaker: "Dr. Bishal", timestampSeconds: 590, timestampDisplay: "09:50", text: "Our corroboration matrix ensures independent verification before any draft enters the editor review queue.", textNepali: "दोहोरो स्रोत प्रमाणीकरण भएपछि मात्र समाचार सम्पादकीय डेस्कमा जान्छ।" }
    ]
  },
  {
    id: "vid-sgis-epigraphy",
    title: "SGIS Epigraphy: Reading Licchavi Inscriptions & Multi-Script OCR",
    titleNepali: "एसजिआइएस अभिलेख: लिच्छवि लिपि वाचन तथा ओसीआर",
    category: "SGIS Epigraphy",
    provider: "vimeo",
    videoUrl: "https://vimeo.com/76979871",
    embedSrc: "https://player.vimeo.com/video/76979871",
    thumbnail: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=800&q=80",
    durationDisplay: "18:45",
    durationSeconds: 1125,
    instructorName: "Acharya Somnath Sharma",
    instructorRole: "Senior Epigraphist & Sanskrit Scholar",
    description: "Detailed scholarly walkthrough of 5th-century stone inscriptions in the Kathmandu Valley, demonstrating bounding box line segmentation and Devanagari mapping.",
    chapters: [
      { id: "sc1", title: "Historical Context of Licchavi Epigraphy", titleNepali: "लिच्छवि लिपिको ऐतिहासिक पृष्ठभूमि", timestampSeconds: 0, timestampDisplay: "00:00" },
      { id: "sc2", title: "Ashokan Brahmi to Licchavi Glyph Evolution", titleNepali: "ब्राह्मीबाट लिच्छवि लिपिको विकास", timestampSeconds: 180, timestampDisplay: "03:00" },
      { id: "sc3", title: "Neural Bounding Box Segmentation Demo", titleNepali: "ओसीआर रेखा विभाजन प्रत्यक्ष अभ्यास", timestampSeconds: 460, timestampDisplay: "07:40" },
      { id: "sc4", title: "Resolving Weathered & Chipped Stone Ligatures", titleNepali: "मेटिएका अक्षरहरूको पहिचान", timestampSeconds: 780, timestampDisplay: "13:00" },
      { id: "sc5", title: "Feeding Deciphered Texts to Knowledge Graphs", titleNepali: "ज्ञान ग्राफ र एआईमा अभिलेख समावेशन", timestampSeconds: 990, timestampDisplay: "16:30" }
    ],
    notes: [
      "Licchavi inscriptions utilize classical Sanskrit with distinctive northern post-Gupta stylistic ductus.",
      "Pay special attention to the triangular loop on the letter 'Ma' (म) and the hook of 'Ra' (र).",
      "All transcriptions must preserve original scribal errors in the critical scholarly apparatus."
    ],
    transcripts: [
      { id: "st1", speaker: "Acharya Somnath", timestampSeconds: 10, timestampDisplay: "00:10", text: "In this session, we decipher the 5th-century Manadeva stele located at Changu Narayan.", textNepali: "यस सत्रमा हामी चाँगुनारायणको पाँचौँ शताब्दीको मानदेव शिलालेख अध्ययन गर्नेछौं।" },
      { id: "st2", speaker: "Acharya Somnath", timestampSeconds: 195, timestampDisplay: "03:15", text: "Observe the transition from strict Brahmi vertical strokes to early decorative Licchavi serifs.", textNepali: "ब्राह्मी लिपिबाट लिच्छवि लिपिका कलात्मक मोडहरू ध्यान दिएर हेर्नुहोस्।" },
      { id: "st3", speaker: "Acharya Somnath", timestampSeconds: 480, timestampDisplay: "08:00", text: "The OCR model segments each glyph, calculating probability matrices against verified corpus stones.", textNepali: "ओसीआर मोडलले प्रत्येक अक्षरलाई छुट्ट्याई प्रमाणित शिलापत्रसँग दाँच्छ।" }
    ]
  },
  {
    id: "vid-mediaos-radio",
    title: "MediaOS & 24/7 Resilient Radio Broadcasting",
    titleNepali: "मिडिया प्रणाली तथा २४/७ रेडियो निरन्तर प्रसारण",
    category: "MediaOS & Radio",
    provider: "mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80",
    durationDisplay: "11:30",
    durationSeconds: 690,
    instructorName: "Radha Adhikari",
    instructorRole: "Broadcast Operations Director",
    description: "Master continuous HLS audio stream monitoring, temple live video relays, fallback failover triggers, and the persistent non-stop mini-player.",
    chapters: [
      { id: "mc1", title: "24/7 Live Stream Audio Topology", titleNepali: "निरन्तर अडियो प्रसारण संरचना", timestampSeconds: 0, timestampDisplay: "00:00" },
      { id: "mc2", title: "Sub-400ms Silent Fallback Loop", titleNepali: "४०० मिलिसेकेन्ड ब्याकअप अडियो प्रणाली", timestampSeconds: 140, timestampDisplay: "02:20" },
      { id: "mc3", title: "Temple Video Multi-Bitrate Ingestion", titleNepali: "मन्दिर प्रत्यक्ष भिडियो रिले व्यवस्थापन", timestampSeconds: 360, timestampDisplay: "06:00" },
      { id: "mc4", title: "Client-Side Persistent Mini-Player", titleNepali: "अडिग्ग मिनी-प्लेयर र पृष्ठ नेभिगेसन", timestampSeconds: 540, timestampDisplay: "09:00" }
    ],
    notes: [
      "The broadcast server must maintain 3 distinct upstream ingest endpoints for redundancy.",
      "The fallback loop caches 4 hours of curated high-bitrate sacred bhajan audio locally.",
      "The reader mini-player must never restart or flicker when navigating between portal routes."
    ],
    transcripts: [
      { id: "mt1", speaker: "Radha", timestampSeconds: 8, timestampDisplay: "00:08", text: "Our 24/7 radio broadcast is designed to withstand Himalayan network blackouts without dead air.", textNepali: "हाम्रो २४/७ रेडियो इन्टरनेट अवरुद्ध हुँदा पनि कहिल्यै बन्द नहुने गरी बनाइएको छ।" },
      { id: "mt2", speaker: "Radha", timestampSeconds: 155, timestampDisplay: "02:35", text: "If the live studio audio cuts out, the 400ms silent detector engages the backup playlist instantly.", textNepali: "स्टुडियोको लिंक काटिनासाथ ४०० मिलिसेकेन्डभित्र ब्याकअप भजन स्वतः सुरु हुन्छ।" }
    ]
  },
  {
    id: "vid-governance-four-eyes",
    title: "GovernanceOS & Four-Eyes Approval Workflow",
    titleNepali: "सुशासन तथा चार-आँखे सम्पादकीय स्वीकृति",
    category: "Governance",
    provider: "youtube",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    embedSrc: "https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1",
    thumbnail: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80",
    durationDisplay: "12:50",
    durationSeconds: 770,
    instructorName: "Govinda Prasad Bhattarai",
    instructorRole: "Legal Counsel & Truth Ombudsman",
    description: "Understand the zero-trust RBAC role matrix (L1-L5), immutable cryptographic audit logs, correction notices, and mandatory dual-editor signoff.",
    chapters: [
      { id: "gc1", title: "The Zero-Trust RBAC Philosophy", titleNepali: "शून्य-विश्वास अधिकार सिद्धान्त", timestampSeconds: 0, timestampDisplay: "00:00" },
      { id: "gc2", title: "Dual Signature Protocol (Editor A & B)", titleNepali: "दोहोरो हस्ताक्षर सम्झौता", timestampSeconds: 175, timestampDisplay: "02:55" },
      { id: "gc3", title: "Immutable Audit Ledger Demonstration", titleNepali: "मेटाउन नसकिने अडिट लग प्रदर्शन", timestampSeconds: 420, timestampDisplay: "07:00" },
      { id: "gc4", title: "Correction Notices & Retraction Protocol", titleNepali: "त्रुटि सच्याउने तथा खण्डन नीति", timestampSeconds: 610, timestampDisplay: "10:10" }
    ],
    notes: [
      "No single administrator can publish or unpublish articles unilaterally.",
      "Every correction notice preserves the original text alongside the timestamped amendment.",
      "Audit logs are exported as SHA-256 signed JSON bundles for independent verification."
    ],
    transcripts: [
      { id: "gt1", speaker: "Govinda", timestampSeconds: 5, timestampDisplay: "00:05", text: "Governance in SanatanMarga is founded on Satya—absolute institutional truth and transparency.", textNepali: "सनातनमार्गको सुशासन सत्य र संस्थागत पारदर्शितामा आधारित छ।" },
      { id: "gt2", speaker: "Govinda", timestampSeconds: 190, timestampDisplay: "03:10", text: "The four-eyes principle requires independent cryptographic approval from two distinct editors.", textNepali: "चार-आँखे नियम अनुसार दुई जना फरक सम्पादकको स्वीकृति विना केही प्रकाशित हुँदैन।" }
    ]
  }
];

export interface VideoTrainingLibraryProps {
  onOpenTour?: (tourId: string) => void;
}

export default function VideoTrainingLibrary({ onOpenTour }: VideoTrainingLibraryProps = {}) {
  const [selectedVideo, setSelectedVideo] = useState<TrainingVideo>(TRAINING_VIDEOS[0]);
  const [activeTab, setActiveTab] = useState<"chapters" | "notes" | "transcript" | "bookmarks">("chapters");
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [transcriptSearch, setTranscriptSearch] = useState<string>("");
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number>(0);
  const [newBookmarkNote, setNewBookmarkNote] = useState<string>("");
  const [isBookmarkingOpen, setIsBookmarkingOpen] = useState<boolean>(false);

  // User timestamp bookmarks persisted in localStorage
  const [userBookmarks, setUserBookmarks] = useState<UserTimestampBookmark[]>(() => {
    try {
      const saved = localStorage.getItem("sm_video_bookmarks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("sm_video_bookmarks", JSON.stringify(userBookmarks));
    } catch (e) {
      console.warn("Could not save video bookmarks", e);
    }
  }, [userBookmarks]);

  const handleSelectVideo = (video: TrainingVideo) => {
    setSelectedVideo(video);
    setCurrentPlaybackTime(0);
  };

  const handleJumpToTimestamp = (seconds: number) => {
    setCurrentPlaybackTime(seconds);
  };

  const handleAddBookmark = () => {
    if (!newBookmarkNote.trim()) return;
    const mins = Math.floor(currentPlaybackTime / 60);
    const secs = Math.floor(currentPlaybackTime % 60);
    const display = `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;

    const newBm: UserTimestampBookmark = {
      id: `bm-${Date.now()}`,
      videoId: selectedVideo.id,
      timestampSeconds: currentPlaybackTime,
      timestampDisplay: display,
      note: newBookmarkNote.trim(),
      createdAt: new Date().toLocaleTimeString()
    };

    setUserBookmarks(prev => [newBm, ...prev]);
    setNewBookmarkNote("");
    setIsBookmarkingOpen(false);
  };

  const handleDeleteBookmark = (bmId: string) => {
    setUserBookmarks(prev => prev.filter(b => b.id !== bmId));
  };

  // Filter transcripts by search
  const filteredTranscripts = selectedVideo.transcripts.filter(t => {
    if (!transcriptSearch.trim()) return true;
    const q = transcriptSearch.toLowerCase();
    return t.text.toLowerCase().includes(q) || t.textNepali.includes(q) || t.speaker.toLowerCase().includes(q);
  });

  const currentVideoBookmarks = userBookmarks.filter(b => b.videoId === selectedVideo.id);

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-theme dark:border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider mb-2">
            <Video size={14} />
            <span>Interactive Video Masterclass Hub</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground dark:text-white">
            भिडियो तालिम केन्द्र (Video Academy Hub)
          </h2>
          <p className="text-xs sm:text-sm text-muted-text dark:text-zinc-400 mt-1 max-w-3xl">
            Watch deep technical masterclasses supporting YouTube, Vimeo, MP4, and Cloudflare Stream. 
            Navigate by chapters, study lecture notes, search synchronized transcripts, and bookmark custom timestamps.
          </p>
        </div>
      </div>

      {/* Main Video Layout: Left Player, Right Interactive Tab Dock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Player & Video Info (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Active Video Player Container */}
          <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-border-theme dark:border-zinc-800">
            {selectedVideo.provider === "youtube" || selectedVideo.provider === "vimeo" ? (
              <iframe
                src={selectedVideo.embedSrc || selectedVideo.videoUrl}
                title={selectedVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video
                src={selectedVideo.videoUrl}
                poster={selectedVideo.thumbnail}
                controls
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Player Toolbar: Speed & Bookmark Action */}
          <div className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-text">Speed:</span>
              {[0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    playbackSpeed === speed
                      ? "bg-primary text-white shadow-sm"
                      : "bg-muted-area dark:bg-zinc-900 text-muted-text hover:text-foreground"
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsBookmarkingOpen(!isBookmarkingOpen)}
                className="px-4 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/20 transition-all cursor-pointer"
              >
                <Bookmark size={14} />
                <span>Bookmark Timestamp</span>
              </button>

              <span className="text-xs font-mono font-bold text-muted-text bg-muted-area dark:bg-zinc-900 px-3 py-1 rounded-lg border border-border-theme dark:border-zinc-800">
                Duration: {selectedVideo.durationDisplay}
              </span>
            </div>
          </div>

          {/* Bookmark Input Drawer (if open) */}
          {isBookmarkingOpen && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Bookmark size={14} /> Add Personal Timestamp Note
                </span>
                <span className="text-xs font-mono font-bold text-muted-text">
                  Time: ~01:30
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBookmarkNote}
                  onChange={(e) => setNewBookmarkNote(e.target.value)}
                  placeholder="e.g., Critical point on four-eyes cryptographic gate..."
                  className="flex-1 px-3 py-2 bg-card dark:bg-zinc-900 border border-border-theme rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={handleAddBookmark}
                  className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-black hover:bg-amber-600 transition-colors cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            </div>
          )}

          {/* Video Metadata & Instructor Profile */}
          <div className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {selectedVideo.category}
              </span>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-muted-area dark:bg-zinc-900 text-muted-text border border-border-theme dark:border-zinc-800 uppercase">
                Provider: {selectedVideo.provider}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-foreground dark:text-white">
              {selectedVideo.title}
            </h1>
            <p className="text-sm font-bold text-primary">
              {selectedVideo.titleNepali}
            </p>
            <p className="text-xs sm:text-sm text-muted-text dark:text-zinc-300 leading-relaxed pt-1">
              {selectedVideo.description}
            </p>

            <div className="pt-4 border-t border-border-theme/60 dark:border-zinc-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {selectedVideo.instructorName[0]}
                </div>
                <div>
                  <span className="font-bold text-foreground dark:text-white block">{selectedVideo.instructorName}</span>
                  <span className="text-muted-text text-[11px] block">{selectedVideo.instructorRole}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Tabbed Dock (Chapters, Notes, Transcript, Bookmarks) */}
        <div className="space-y-4">
          
          {/* Tab Selector Buttons */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-muted-area dark:bg-zinc-900 rounded-2xl border border-border-theme dark:border-zinc-800">
            <button
              onClick={() => setActiveTab("chapters")}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "chapters"
                  ? "bg-card dark:bg-zinc-950 text-foreground dark:text-white shadow-sm"
                  : "text-muted-text hover:text-foreground"
              }`}
            >
              Chapters
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "notes"
                  ? "bg-card dark:bg-zinc-950 text-foreground dark:text-white shadow-sm"
                  : "text-muted-text hover:text-foreground"
              }`}
            >
              Notes
            </button>
            <button
              onClick={() => setActiveTab("transcript")}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "transcript"
                  ? "bg-card dark:bg-zinc-950 text-foreground dark:text-white shadow-sm"
                  : "text-muted-text hover:text-foreground"
              }`}
            >
              Transcript
            </button>
            <button
              onClick={() => setActiveTab("bookmarks")}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "bookmarks"
                  ? "bg-card dark:bg-zinc-950 text-foreground dark:text-white shadow-sm"
                  : "text-muted-text hover:text-foreground"
              }`}
            >
              Saved ({currentVideoBookmarks.length})
            </button>
          </div>

          {/* Tab Content Box */}
          <div className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-5 shadow-xl h-[480px] overflow-y-auto">
            
            {/* TAB 1: CHAPTERS */}
            {activeTab === "chapters" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border-theme/60 dark:border-zinc-800/80 text-xs font-bold text-muted-text">
                  <span className="flex items-center gap-1.5"><ListOrdered size={14} /> Video Chapters ({selectedVideo.chapters.length})</span>
                  <span>Click to Jump</span>
                </div>

                <div className="space-y-2">
                  {selectedVideo.chapters.map((ch, idx) => (
                    <button
                      key={ch.id}
                      onClick={() => handleJumpToTimestamp(ch.timestampSeconds)}
                      className="w-full text-left p-3 rounded-xl bg-muted-area/50 dark:bg-zinc-900/60 hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-text">0{idx + 1}.</span>
                          <h4 className="text-xs font-black text-foreground dark:text-white group-hover:text-primary transition-colors">
                            {ch.title}
                          </h4>
                        </div>
                        <span className="text-[10px] text-muted-text block pl-4">
                          {ch.titleNepali}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0">
                        {ch.timestampDisplay}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: LECTURE STUDY NOTES */}
            {activeTab === "notes" && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-text pb-2 border-b border-border-theme/60 dark:border-zinc-800/80">
                  <BookOpen size={14} className="text-amber-500" />
                  <span>Curated Study Notes & Takeaways</span>
                </div>

                <ul className="space-y-3">
                  {selectedVideo.notes.map((note, idx) => (
                    <li key={idx} className="p-3.5 rounded-xl bg-muted-area/40 dark:bg-zinc-900/40 border border-border-theme dark:border-zinc-800/80 text-xs text-foreground dark:text-zinc-200 leading-relaxed flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* TAB 3: SYNCHRONIZED TRANSCRIPT WITH SEARCH */}
            {activeTab === "transcript" && (
              <div className="space-y-3">
                {/* Search Transcript Input */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-text" />
                  <input
                    type="text"
                    value={transcriptSearch}
                    onChange={(e) => setTranscriptSearch(e.target.value)}
                    placeholder="Search transcript text..."
                    className="w-full pl-8 pr-3 py-1.5 bg-muted-area/50 dark:bg-zinc-900 border border-border-theme rounded-xl text-xs text-foreground placeholder:text-muted-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  {filteredTranscripts.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleJumpToTimestamp(item.timestampSeconds)}
                      className="p-3 rounded-xl bg-muted-area/30 dark:bg-zinc-900/30 hover:bg-muted-area dark:hover:bg-zinc-900 border border-transparent hover:border-border-theme transition-all cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-primary">
                          {item.speaker}
                        </span>
                        <span className="text-[10px] font-mono text-muted-text">
                          {item.timestampDisplay}
                        </span>
                      </div>
                      <p className="text-xs text-foreground dark:text-zinc-200 leading-relaxed">
                        {item.text}
                      </p>
                      <p className="text-[11px] text-muted-text italic">
                        {item.textNepali}
                      </p>
                    </div>
                  ))}

                  {filteredTranscripts.length === 0 && (
                    <p className="text-xs text-muted-text text-center py-6">
                      No matching transcript lines found.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: BOOKMARKED TIMESTAMPS */}
            {activeTab === "bookmarks" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border-theme/60 dark:border-zinc-800/80 text-xs font-bold text-muted-text">
                  <span className="flex items-center gap-1.5"><Bookmark size={14} /> Your Saved Timestamps</span>
                  <span>{currentVideoBookmarks.length} Bookmarks</span>
                </div>

                {currentVideoBookmarks.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <Bookmark size={24} className="mx-auto text-muted-text/50" />
                    <p className="text-xs text-muted-text">No timestamps bookmarked for this video yet.</p>
                    <button
                      onClick={() => setIsBookmarkingOpen(true)}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      Bookmark current playback position
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentVideoBookmarks.map((bm) => (
                      <div
                        key={bm.id}
                        className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleJumpToTimestamp(bm.timestampSeconds)}
                            className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded cursor-pointer hover:bg-amber-500/20"
                          >
                            Jump to {bm.timestampDisplay}
                          </button>
                          <button
                            onClick={() => handleDeleteBookmark(bm.id)}
                            className="text-[10px] text-muted-text hover:text-rose-500 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                        <p className="text-xs text-foreground dark:text-zinc-200 leading-snug">
                          {bm.note}
                        </p>
                        <span className="text-[9px] text-muted-text block">
                          Added at {bm.createdAt}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Playlist Grid: All Available Training Videos */}
      <div className="space-y-4 pt-6 border-t border-border-theme dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-foreground dark:text-white">
            Complete Training Masterclass Library ({TRAINING_VIDEOS.length})
          </h3>
          <span className="text-xs text-muted-text">HD Multi-Provider Streaming</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TRAINING_VIDEOS.map((vid) => {
            const isSelected = selectedVideo.id === vid.id;

            return (
              <div
                key={vid.id}
                onClick={() => handleSelectVideo(vid)}
                className={`group rounded-2xl border overflow-hidden transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/30 shadow-lg bg-primary/5"
                    : "border-border-theme dark:border-zinc-800 bg-card dark:bg-slate-950 hover:border-primary/50"
                }`}
              >
                <div>
                  <div className="relative aspect-video overflow-hidden bg-slate-900">
                    <img
                      src={vid.thumbnail}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-lg">
                        <Play size={16} className="ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white font-bold">
                      {vid.durationDisplay}
                    </span>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-primary uppercase block">
                      {vid.category}
                    </span>
                    <h4 className="text-xs sm:text-sm font-black text-foreground dark:text-white line-clamp-2 group-hover:text-primary transition-colors">
                      {vid.title}
                    </h4>
                    <p className="text-[11px] text-muted-text line-clamp-1">
                      {vid.titleNepali}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 text-[11px] text-muted-text flex items-center justify-between border-t border-border-theme/40 dark:border-zinc-800/60 mt-2">
                  <span>{vid.instructorName.split(" ")[0]}</span>
                  <span className="font-mono uppercase">{vid.provider}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
