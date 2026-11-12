import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, serverTimestamp } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { setDocWithQueue } from "@/src/lib/offlineQueue";
import { Save, ArrowLeft, Plus, Trash2, Globe, Network, Radio, Sparkles, MapPin, Tag, Image as ImageIcon } from "lucide-react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { toast } from "sonner";
import MediaAssetPickerModal from "@/src/components/media/MediaAssetPickerModal";

const NEPAL_DISTRICTS = [
  "काठमाडौँ", "ललितपुर", "भक्तपुर", "कास्की", "धनुषा", "चितवन", "गोरखा", "रूपन्देही", "मोरङ", "सुनसरी", "सोलुखुम्बु", "मुस्ताङ", "बाँके", "कैलाली", "सुर्र्खेत", "इलाम", "पाँचथर", "सिन्धुपाल्चोक", "काभ्रेपलाञ्चोक"
];

const NEPAL_PROVINCES = [
  "कोशी प्रदेश", "मधेश प्रदेश", "बागमती प्रदेश", "गण्डकी प्रदेश", "लुम्बिनी प्रदेश", "कर्णाली प्रदेश", "सुदूरपश्चिम प्रदेश"
];

const SUGGESTED_KNOWLEDGE_ENTITIES = [
  { id: "pashupatinath", name: "श्री पशुपतिनाथ मन्दिर", category: "मन्दिर / सम्पदा" },
  { id: "janaki-mandir", name: "जानकी मन्दिर (जनकपुरधाम)", category: "मन्दिर / सम्पदा" },
  { id: "rigveda", name: "ऋग्वेद संहिता", category: "वेद / ग्रन्थ" },
  { id: "lumbini", name: "लुम्बिनी पावन तीर्थ", category: "विश्व सम्पदा" },
  { id: "dashain", name: "बडा दशैँ (विजया दशमी)", category: "सांस्कृतिक पर्व" },
  { id: "swayambhunath", name: "स्वयम्भूनाथ महाचैत्य", category: "विश्व सम्पदा" },
  { id: "muktinath", name: "श्री मुक्तिनाथ क्षेत्र", category: "पावन तीर्थ" }
];

export default function AdminEventEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  
  const [event, setEvent] = useState({
    title: "",
    tagline: "",
    date: new Date().toISOString().split("T")[0],
    location: "",
    district: "काठमाडौँ",
    province: "बागमती प्रदेश",
    featuredImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2070&auto=format&fit=crop",
    status: "published",
    isFeatured: false,
    timeline: [] as { time: string; title: string; description: string }[],
    // Nepal Hub Connection
    nepalHubCategory: "festivals" as "festivals" | "disaster" | "elections" | "national",
    isLiveOnNepalHub: true,
    // Saraswati Knowledge Graph Connection
    knowledgeEntities: ["pashupatinath"] as string[],
    knowledgeTags: ["सनातन धर्म", "सांस्कृतिक उत्सव"] as string[]
  });

  const [customEntityInput, setCustomEntityInput] = useState("");
  const [customTagInput, setCustomTagInput] = useState("");

  useEffect(() => {
    if (id) {
      getDoc(doc(db, "events", id)).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          setEvent({
            title: data.title || "",
            tagline: data.tagline || "",
            date: data.date || new Date().toISOString().split("T")[0],
            location: data.location || "",
            district: data.district || "काठमाडौँ",
            province: data.province || "बागमती प्रदेश",
            featuredImage: data.featuredImage || "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2070&auto=format&fit=crop",
            status: data.status || "published",
            isFeatured: data.isFeatured || false,
            timeline: data.timeline || [],
            nepalHubCategory: data.nepalHubCategory || "festivals",
            isLiveOnNepalHub: data.isLiveOnNepalHub !== undefined ? data.isLiveOnNepalHub : true,
            knowledgeEntities: data.knowledgeEntities || [],
            knowledgeTags: data.knowledgeTags || []
          });
        }
      });
    }
  }, [id]);

  const toggleKnowledgeEntity = (entityNameOrId: string) => {
    const exists = event.knowledgeEntities.includes(entityNameOrId);
    if (exists) {
      setEvent({ ...event, knowledgeEntities: event.knowledgeEntities.filter(e => e !== entityNameOrId) });
    } else {
      setEvent({ ...event, knowledgeEntities: [...event.knowledgeEntities, entityNameOrId] });
    }
  };

  const addCustomEntity = () => {
    if (!customEntityInput.trim()) return;
    if (!event.knowledgeEntities.includes(customEntityInput.trim())) {
      setEvent({ ...event, knowledgeEntities: [...event.knowledgeEntities, customEntityInput.trim()] });
    }
    setCustomEntityInput("");
  };

  const addCustomTag = () => {
    if (!customTagInput.trim()) return;
    if (!event.knowledgeTags.includes(customTagInput.trim())) {
      setEvent({ ...event, knowledgeTags: [...event.knowledgeTags, customTagInput.trim()] });
    }
    setCustomTagInput("");
  };

  const removeTag = (tag: string) => {
    setEvent({ ...event, knowledgeTags: event.knowledgeTags.filter(t => t !== tag) });
  };

  const save = async () => {
    if (!event.title.trim()) {
      toast.error("कृपया घटनाको शीर्षक प्रविष्ट गर्नुहोस्");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...event,
        updatedAt: serverTimestamp()
      };

      let eventDocId = id || Math.random().toString(36).substring(2, 15);
      
      await setDocWithQueue(doc(db, 'events', eventDocId), id ? payload : { ...payload, createdAt: serverTimestamp() }, { merge: true });

      // Sync to Nepal Hub Live Updates collection if isLiveOnNepalHub is checked and status is published
      if (event.isLiveOnNepalHub && event.status === "published") {
        const updateDocRef = doc(collection(db, 'nepal_hub_live_updates'));
        await setDocWithQueue(updateDocRef, {
          title: `[घटना] ${event.title}`,
          content: `${event.tagline || event.title} — स्थान: ${event.location} (${event.district})। सरस्वती ज्ञान सञ्जाल तथा नेपाल हबमा प्रत्यक्ष दर्ता।`,
          category: event.nepalHubCategory,
          badge: "नेपाल हब घटना (Connected Event)",
          urgency: "high",
          time: "भर्खरै (लाइभ घटना)",
          pinned: true,
          eventId: eventDocId,
          district: event.district,
          province: event.province,
          knowledgeEntities: event.knowledgeEntities,
          createdAt: serverTimestamp(),
          viewsCount: 105,
          sharesCount: 12,
          likesCount: 34
        });
        toast.success("नेपाल हब लाइभ फिडमा पनि सफलतापुर्वक अपडेट सम्प्रेषण गरियो!");
      }

      toast.success("घटना र सरस्वती ज्ञान सञ्जाल सम्बन्ध सफलतापूर्वक सुरक्षित भयो!");
      navigate("/admin/events");
    } catch (err: any) {
      toast.error("सुरक्षित गर्दा त्रुटि भयो: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTimelineItem = () => setEvent({ ...event, timeline: [...event.timeline, { time: "", title: "", description: "" }] });
  const updateTimelineItem = (index: number, field: string, value: string) => {
    const newTimeline = [...event.timeline];
    (newTimeline[index] as any)[field] = value;
    setEvent({ ...event, timeline: newTimeline });
  };
  const removeTimelineItem = (index: number) => setEvent({ ...event, timeline: event.timeline.filter((_, i) => i !== index) });

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-text hover:text-card-foreground transition-colors font-bold">
            <ArrowLeft size={20} /> पछाडि फर्कनुहोस्
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs font-black px-3 py-1 bg-primary/10 text-primary rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Globe size={14} /> Nepal Hub & Knowledge Network
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-card-foreground tracking-tight">
              {id ? "घटना तथा ज्ञान सञ्जाल सम्पादन" : "नयाँ राष्ट्रिय/सांस्कृतिक घटना दर्ता"}
            </h1>
            <p className="text-muted-text text-sm font-medium mt-1">
              घटनालाई नेपाल हब लाइभ अपडेट र सरस्वती ज्ञान सञ्जालसँग त्रि-आयामिक रूपमा जोड्नुहोस्।
            </p>
          </div>
          <button 
            onClick={save} 
            disabled={loading}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 disabled:opacity-50 shrink-0"
          >
            <Save size={20} /> {loading ? "सुरक्षित हुँदैछ..." : "सुरक्षित गर्नुहोस्"}
          </button>
        </div>

        <div className="grid gap-8">
          {/* Main Info Card */}
          <div className="bg-card p-6 sm:p-8 rounded-3xl shadow-sm border border-border-theme space-y-6">
            <h3 className="text-xl font-bold text-card-foreground flex items-center gap-2">
              <Sparkles className="text-primary" size={20} /> १. घटनाको आधारभूत विवरण
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider">घटनाको मुख्य शीर्षक *</label>
                <input 
                  value={event.title} 
                  onChange={e => setEvent({ ...event, title: e.target.value })} 
                  placeholder="उदा: महाशिवरात्रि तथा पशुपतिनाथ विशेष महामहोत्सव २०८३" 
                  className="w-full p-4 rounded-2xl border border-border-theme bg-muted-area text-card-foreground font-bold outline-none focus:ring-2 focus:ring-primary/20" 
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider">ट्यागलाइन / सारंश</label>
                <input 
                  value={event.tagline} 
                  onChange={e => setEvent({ ...event, tagline: e.target.value })} 
                  placeholder="विश्वभरका वैदिक सनातन धर्मावलम्बीहरूको महान् पावन उत्सव..." 
                  className="w-full p-4 rounded-2xl border border-border-theme bg-muted-area text-card-foreground outline-none focus:ring-2 focus:ring-primary/20" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider">मिति (Date)</label>
                <input 
                  type="date" 
                  value={event.date} 
                  onChange={e => setEvent({ ...event, date: e.target.value })} 
                  className="w-full p-4 rounded-2xl border border-border-theme bg-muted-area text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 font-bold" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider">विशेष स्थान (Exact Location)</label>
                <input 
                  value={event.location} 
                  onChange={e => setEvent({ ...event, location: e.target.value })} 
                  placeholder="उदा: पशुपतिनाथ मन्दिर परिसर, गौशाला" 
                  className="w-full p-4 rounded-2xl border border-border-theme bg-muted-area text-card-foreground outline-none focus:ring-2 focus:ring-primary/20" 
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider flex items-center justify-between">
                  <span>मुख्य तस्बिर / ब्यानर (Featured Image) *</span>
                  <span className="text-[10px] font-bold text-primary">Cloudflare R2 Storage</span>
                </label>
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="w-full md:w-48 h-28 bg-muted-area rounded-2xl overflow-hidden border border-border-theme flex items-center justify-center relative group shrink-0 shadow-sm">
                    {event.featuredImage?.trim() ? (
                      <img src={event.featuredImage || null} alt="Event Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <ImageIcon size={32} className="text-muted-text/30" />
                    )}
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex gap-2">
                      <input 
                        value={event.featuredImage} 
                        onChange={e => setEvent({ ...event, featuredImage: e.target.value })} 
                        placeholder="https://..." 
                        className="flex-1 p-4 rounded-2xl border border-border-theme bg-muted-area text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 text-xs font-mono" 
                      />
                      <button
                        type="button"
                        onClick={() => setIsMediaPickerOpen(true)}
                        className="px-5 bg-primary hover:bg-primary/95 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-md transition-all whitespace-nowrap"
                      >
                        <ImageIcon size={16} /> तस्बिर अपलोड / छनोट
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-text">
                      तपाईंले सिधै मिडिया युआरएल हाल्न सक्नुहुन्छ वा <b>तस्बिर अपलोड / छनोट</b> थिचेर नयाँ फाइल सिधै R2 स्टोरेजमा अपलोड गर्न सक्नुहुन्छ।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* NEPAL HUB CONNECTIVITY CARD */}
          <div className="bg-card p-6 sm:p-8 rounded-3xl shadow-sm border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-amber-500/5 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-card-foreground flex items-center gap-2">
                <Globe className="text-primary" size={22} /> २. नेपाल हब (Nepal Hub OS) प्रत्यक्ष आवद्धता
              </h3>
              <span className="text-xxs font-black px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg uppercase">
                Live Geo-Sync
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider flex items-center gap-1">
                  <MapPin size={12} className="text-primary" /> जिल्ला (District)
                </label>
                <select 
                  value={event.district} 
                  onChange={e => setEvent({ ...event, district: e.target.value })} 
                  className="w-full p-4 rounded-2xl border border-border-theme bg-muted-area text-card-foreground font-bold outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {NEPAL_DISTRICTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider">प्रदेश (Province)</label>
                <select 
                  value={event.province} 
                  onChange={e => setEvent({ ...event, province: e.target.value })} 
                  className="w-full p-4 rounded-2xl border border-border-theme bg-muted-area text-card-foreground font-bold outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {NEPAL_PROVINCES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider">नेपाल हब वर्ग (Category)</label>
                <select 
                  value={event.nepalHubCategory} 
                  onChange={e => setEvent({ ...event, nepalHubCategory: e.target.value as any })} 
                  className="w-full p-4 rounded-2xl border border-border-theme bg-muted-area text-card-foreground font-bold outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="festivals">पर्व तथा संस्कृति (Festivals & Heritage)</option>
                  <option value="national">राष्ट्रिय महोत्सव / सभा (National Events)</option>
                  <option value="disaster">विपद् तथा मौसम सतर्कता (Alerts)</option>
                  <option value="elections">निर्वाचन तथा नागरिक गतिविधि (Civic / Election)</option>
                </select>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted-area/60 border border-border-theme">
                <input 
                  type="checkbox" 
                  id="liveNepalHubCheck"
                  checked={event.isLiveOnNepalHub} 
                  onChange={e => setEvent({ ...event, isLiveOnNepalHub: e.target.checked })} 
                  className="w-5 h-5 text-primary rounded focus:ring-primary accent-primary cursor-pointer"
                />
                <label htmlFor="liveNepalHubCheck" className="cursor-pointer select-none">
                  <div className="font-bold text-sm text-card-foreground flex items-center gap-2">
                    <Radio size={16} className="text-red-500 animate-pulse" /> नेपाल हब लाइभमा तुरुन्त प्रसारण गर्ने
                  </div>
                  <p className="text-xs text-muted-text">नेपाल हबको टिकर र प्रत्यक्ष बुलेटिनमा यो घटना स्वचालित प्रसारण हुनेछ।</p>
                </label>
              </div>
            </div>
          </div>

          {/* SARASWATI KNOWLEDGE GRAPH CARD */}
          <div className="bg-card p-6 sm:p-8 rounded-3xl shadow-sm border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-card to-indigo-500/5 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-card-foreground flex items-center gap-2">
                <Network className="text-purple-600 dark:text-purple-400" size={22} /> ३. सरस्वती ज्ञान सञ्जाल (Knowledge Graph) जोडौँ
              </h3>
              <span className="text-xxs font-black px-2.5 py-1 bg-purple-500/10 text-purple-600 rounded-lg uppercase">
                Knowledge Nodes
              </span>
            </div>

            <p className="text-xs text-muted-text font-medium">
              यस घटनालाई सरस्वती ज्ञान सञ्जालका पौराणिक, ऐतिहासिक वा सम्पदा नोडहरूसँग आवद्ध गर्नुहोस्। यसो गर्दा पाठकहरूले ज्ञान बेसबाट पनि यो घटना सिधै अवलोकन गर्न सक्नेछन्।
            </p>

            <div className="space-y-4">
              <label className="text-xs font-bold text-muted-text uppercase tracking-wider">प्रस्तावित सरस्वती ज्ञान नोडहरू छान्नुहोस्:</label>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_KNOWLEDGE_ENTITIES.map(node => {
                  const isSelected = event.knowledgeEntities.includes(node.id) || event.knowledgeEntities.includes(node.name);
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => toggleKnowledgeEntity(node.id)}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                        isSelected 
                          ? "bg-purple-600 text-white shadow-md shadow-purple-500/30 ring-2 ring-purple-400" 
                          : "bg-muted-area hover:bg-muted-area/80 text-card-foreground border border-border-theme"
                      }`}
                    >
                      <Sparkles size={12} /> {node.name}
                      <span className="text-[10px] opacity-75">({node.category})</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Knowledge Entity Input */}
              <div className="pt-2 flex gap-2">
                <input 
                  value={customEntityInput}
                  onChange={e => setCustomEntityInput(e.target.value)}
                  placeholder="अन्य ज्ञान सञ्जाल नोड नाम (उदा: गोसाइँकुण्ड, जनकपुरधाम...)"
                  className="flex-1 p-3.5 rounded-2xl border border-border-theme bg-muted-area text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <button 
                  type="button"
                  onClick={addCustomEntity}
                  className="px-5 py-3.5 bg-purple-600 text-white rounded-2xl text-xs font-bold hover:bg-purple-700 transition-colors shrink-0"
                >
                  नोड थप्नुहोस्
                </button>
              </div>

              {/* Selected Nodes Display */}
              {event.knowledgeEntities.length > 0 && (
                <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-2">
                  <span className="text-xxs font-black text-purple-600 dark:text-purple-300 uppercase tracking-wider block">आवद्ध ज्ञान सञ्जाल नोडहरू:</span>
                  <div className="flex flex-wrap gap-2">
                    {event.knowledgeEntities.map(entityId => (
                      <span key={entityId} className="px-3 py-1.5 bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold flex items-center gap-2">
                        {entityId}
                        <button type="button" onClick={() => toggleKnowledgeEntity(entityId)} className="hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cultural Tags */}
              <div className="pt-4 space-y-2">
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider flex items-center gap-1">
                  <Tag size={12} /> सांस्कृतिक ट्यागहरू (Tags)
                </label>
                <div className="flex gap-2">
                  <input 
                    value={customTagInput}
                    onChange={e => setCustomTagInput(e.target.value)}
                    placeholder="ट्याग थप्नुहोस् (उदा: वैदिक, शिवरात्री...)"
                    className="flex-1 p-3.5 rounded-2xl border border-border-theme bg-muted-area text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button type="button" onClick={addCustomTag} className="px-5 py-3.5 bg-muted-area hover:bg-border-theme border border-border-theme text-card-foreground font-bold rounded-2xl text-xs">
                    थप्नुहोस्
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {event.knowledgeTags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-muted-area border border-border-theme text-card-foreground rounded-lg text-xs font-medium flex items-center gap-2">
                      #{tag}
                      <button type="button" onClick={() => removeTag(tag)} className="text-red-500">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* TIMELINE BUILDER */}
          <div className="bg-card p-6 sm:p-8 rounded-3xl shadow-sm border border-border-theme space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-card-foreground">४. घटनाक्रम तालिका (Timeline)</h3>
              <button onClick={addTimelineItem} type="button" className="text-primary flex items-center gap-1 font-bold text-sm bg-primary/10 px-4 py-2 rounded-xl hover:bg-primary/20 transition-colors">
                <Plus size={16} /> चरण थप्नुहोस्
              </button>
            </div>

            {event.timeline.length === 0 ? (
              <p className="text-xs text-muted-text italic">कुनै तालिका चरण जोडिएको छैन। समयबद्ध तालिका थप्न 'चरण थप्नुहोस्' बटन थिच्नुहोस्।</p>
            ) : (
              <div className="space-y-3">
                {event.timeline.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 p-3 bg-muted-area/50 rounded-2xl border border-border-theme items-start sm:items-center">
                    <input 
                      value={item.time} 
                      onChange={e => updateTimelineItem(index, 'time', e.target.value)} 
                      placeholder="समय (उदा: बिहान ६:००)" 
                      className="w-full sm:w-1/4 p-2.5 rounded-xl border border-border-theme bg-card text-card-foreground text-xs font-bold outline-none" 
                    />
                    <input 
                      value={item.title} 
                      onChange={e => updateTimelineItem(index, 'title', e.target.value)} 
                      placeholder="शीर्षक (उदा: संकल्प तथा विशेष पूजा)" 
                      className="w-full sm:w-2/4 p-2.5 rounded-xl border border-border-theme bg-card text-card-foreground text-xs font-bold outline-none" 
                    />
                    <input 
                      value={item.description} 
                      onChange={e => updateTimelineItem(index, 'description', e.target.value)} 
                      placeholder="विवरण..." 
                      className="w-full sm:w-2/4 p-2.5 rounded-xl border border-border-theme bg-card text-card-foreground text-xs outline-none" 
                    />
                    <button onClick={() => removeTimelineItem(index)} type="button" className="text-red-500 p-2.5 hover:bg-red-500/10 rounded-xl transition-colors shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* STATUS & ACTIONS */}
          <div className="bg-card p-6 sm:p-8 rounded-3xl shadow-sm border border-border-theme flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-1/3">
              <label className="text-xs font-bold text-muted-text uppercase tracking-wider block mb-1.5">प्रकाशन स्थिति (Status)</label>
              <select 
                value={event.status} 
                onChange={e => setEvent({ ...event, status: e.target.value as any })} 
                className="w-full p-4 rounded-2xl border border-border-theme bg-muted-area text-card-foreground font-black outline-none"
              >
                <option value="published">प्रकाशित (Published)</option>
                <option value="draft">ड्राफ्ट (Draft)</option>
              </select>
            </div>

            <button 
              onClick={save} 
              disabled={loading}
              className="w-full sm:w-auto bg-primary text-white px-10 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 disabled:opacity-50"
            >
              <Save size={20} /> {loading ? "सुरक्षित हुँदैछ..." : "सबै सुरक्षित गर्नुहोस्"}
            </button>
          </div>
        </div>
      </div>
      <MediaAssetPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        title="उत्सव तथा घटनाका लागि मुख्य तस्बिर छनोट गर्नुहोस्"
        category="articles"
        onSelect={(asset) => {
          setEvent(prev => ({ ...prev, featuredImage: asset.url }));
          toast.success("घटनाको मुख्य फोटो सफलतापुर्वक अपडेट भयो!");
        }}
      />
    </AdminLayout>
  );
}
