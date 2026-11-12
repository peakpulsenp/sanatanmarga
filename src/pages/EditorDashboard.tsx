import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, FileText, Plus, Eye, Clock, TrendingUp, Search, Bell, 
  CheckCircle, AlertCircle, Send, Image, BookOpen, MessageSquare, ShieldCheck, Upload, Sparkles, Check
} from "lucide-react";
import { collection, query, where, orderBy, limit, getDocs, addDoc } from "@/src/lib/firebase";
import { db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";
import { motion } from "motion/react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import NotificationBell from "@/src/components/notifications/NotificationBell";
import { AdminSkeleton } from "@/src/components/ui/PageLoaders";
import { useLimitedMode } from "@/src/hooks/useFirestoreQuota";
import { getDocsWithCacheFallback } from "@/src/lib/firebase";
import { toast } from "sonner";

export default function EditorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const limitedMode = useLimitedMode();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'workspace' | 'assignments' | 'drafts' | 'research' | 'media' | 'comments' | 'metrics'>('workspace');

  const [assignments, setAssignments] = useState([
    { id: '1', title: 'पशुपति क्षेत्र विकास कोषको नयाँ गुरुयोजना', priority: 'उच्च (High)', deadline: 'आज, अपराह्न ३:००', status: 'लेख्दै (Drafting)', editor: 'रमेश (Chief Editor)' },
    { id: '2', title: 'काठमाडौंसम्म मेट्रो रेल सम्भाव्यता अध्ययन', priority: 'मध्यम (Normal)', deadline: 'भोली, बिहान १०:००', status: 'असाइन गरिएको', editor: 'सुनिता (Editor)' },
    { id: '3', title: 'राष्ट्रिय अर्थतन्त्र र रेमिट्यान्स आप्रवाह विश्लेषण', priority: 'जरुरी (Urgent)', deadline: 'आज, साँझ ५:००', status: 'तथ्य जाँच (Fact Check)', editor: 'रमेश (Chief Editor)' }
  ]);

  const [workspaceTab, setWorkspaceTab] = useState<'article' | 'media' | 'research' | 'sources' | 'fact_check' | 'versions' | 'comments'>('article');
  const [articleForm, setArticleForm] = useState({
    title: 'पशुपति क्षेत्र विकास कोषको नयाँ गुरुयोजना सार्वजनिक',
    category: 'संस्कृति र समाज',
    content: 'पशुपति क्षेत्र विकास कोषले आज एक विशेष कार्यक्रमकाबीच आगामी १० वर्षको गुरुयोजना सार्वजनिक गरेको छ। यस गुरुयोजनाअनुसार...\n\n१. मन्दिर परिसरको सौन्दर्यकरण\n२. भक्तजनहरूको लागि व्यवस्थित लाम व्यवस्थापन\n३. सांस्कृतिक सम्पदाहरूको संरक्षण तथा प्रवर्द्धन',
    tags: 'पशुपतिनाथ, संस्कृति, सनातन'
  });

  const [commentsThread, setCommentsThread] = useState([
    { sender: 'Chief Editor (रमेश)', text: 'शीर्षक अझै आकर्षक बनाउनुस् र तेस्रो बुँदामा स्थानीय जनताको प्रतिक्रिया थप्नुहोस्।', time: '१०:३० बजे' },
    { sender: 'Journalist (सागर)', text: 'हस् सर, स्थानीय जनताको प्रतिक्रिया जोडेर अपडेट गरेको छु।', time: '११:१५ बजे' },
    { sender: 'Chief Editor (रमेश)', text: 'Approved! अब प्रकाशनको लागि तयार छ।', time: '११:३० बजे' }
  ]);
  const [newComment, setNewComment] = useState("");

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommentsThread(prev => [...prev, { sender: user?.displayName || 'पत्रकार', text: newComment.trim(), time: 'भर्खरै' }]);
    setNewComment("");
    toast.success("टिप्पणी पठाइयो!");
  };

  if (authLoading) return <AdminSkeleton />;

  return (
    <AdminLayout>
      <div className="space-y-8 p-2 md:p-6">
        
        {/* WELCOME AREA */}
        <div className="bg-card border border-border-theme rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-black uppercase tracking-wider">
                JOURNALIST & EDITOR WORKSPACE
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> सक्रिय
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-card-foreground tracking-tight">
              शुभ प्रभात, {user?.displayName || 'पत्रकार साथी'}!
            </h1>
            <p className="text-xs md:text-sm font-medium text-muted-text">
              ✨ तपाईंलाई ३ वटा समाचार असाइन गरिएको छ • २ वटा ड्राफ्ट समीक्षामा छन् • १ वटा डेडलाइन आज छ।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setActiveTab('workspace')}
              className="px-5 py-3 bg-primary text-white rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              <Plus size={16} /> नयाँ ड्राफ्ट लेख्नुहोस्
            </button>
            <NotificationBell />
          </div>
        </div>

        {/* NAVIGATION TABS FOR JOURNALIST */}
        <div className="flex overflow-x-auto gap-2 border-b border-border-theme pb-2 scrollbar-none">
          {[
            { id: 'workspace', label: 'स्टोरी वर्कस्पेस (Workspace)' },
            { id: 'assignments', label: 'मेरा असाइनमेन्टहरू (Assignments)' },
            { id: 'research', label: 'अनुसन्धान सहायक (Research)' },
            { id: 'media', label: 'मिडिया सेन्टर (Media)' },
            { id: 'comments', label: 'सम्पादकीय संवाद (Feedback)' },
            { id: 'metrics', label: 'मेरो कार्यसम्पादन (Metrics)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-muted/50 text-muted-text hover:bg-muted hover:text-card-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: STORY WORKSPACE */}
        {activeTab === 'workspace' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-card border border-border-theme rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-theme pb-4">
                <div className="flex overflow-x-auto gap-2">
                  {['article', 'media', 'research', 'sources', 'fact_check', 'versions', 'comments'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setWorkspaceTab(t as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                        workspaceTab === t ? 'bg-primary text-white' : 'bg-muted/40 text-muted-text hover:text-card-foreground'
                      }`}
                    >
                      {t.replace('_', ' ')}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => toast.success("सफलतापूर्वक समीक्षाको लागि पेस गरियो!")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                >
                  <Send size={14} /> समीक्षामा पठाउनुहोस्
                </button>
              </div>

              {workspaceTab === 'article' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-muted-text">समाचार शीर्षक (Headline)</label>
                    <input 
                      type="text" 
                      value={articleForm.title}
                      onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                      className="w-full bg-muted-area/50 border border-border-theme rounded-2xl px-4 py-3 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-muted-text">विधा (Category)</label>
                      <input 
                        type="text" 
                        value={articleForm.category}
                        onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                        className="w-full bg-muted-area/50 border border-border-theme rounded-2xl px-4 py-3 text-xs font-bold text-card-foreground outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-muted-text">ट्यागहरू (Tags)</label>
                      <input 
                        type="text" 
                        value={articleForm.tags}
                        onChange={(e) => setArticleForm({ ...articleForm, tags: e.target.value })}
                        className="w-full bg-muted-area/50 border border-border-theme rounded-2xl px-4 py-3 text-xs font-bold text-card-foreground outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-muted-text">मुख्य सामग्री (Content Editor)</label>
                    <textarea 
                      rows={10}
                      value={articleForm.content}
                      onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                      className="w-full bg-muted-area/50 border border-border-theme rounded-2xl p-4 text-sm font-medium text-card-foreground outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {workspaceTab === 'media' && (
                <div className="p-8 border-2 border-dashed border-border-theme rounded-3xl flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Upload size={32} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-card-foreground">फोटो, भिडियो वा अडियो अपलोड गर्नुहोस्</h4>
                    <p className="text-xs text-muted-text mt-1">तपाईं ड्र्याग एन्ड ड्रप पनि गर्न सक्नुहुन्छ</p>
                  </div>
                  <button onClick={() => toast.success("मिडिया फाइल चयन भयो")} className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold">
                    फाइलहरू छान्नुहोस्
                  </button>
                </div>
              )}

              {workspaceTab === 'research' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase text-card-foreground">अनुसन्धान सामग्री र सन्दर्भ रिपोर्टहरू</h4>
                  <div className="space-y-2">
                    {[
                      'पुरातत्व विभागको २०८० को वार्षिक प्रतिवेदन.pdf',
                      'पशुपति क्षेत्र विकास गुरुयोजना मस्यौदा v2.docx',
                      'सांस्कृतिक सम्पदा संरक्षणसम्बन्धी सर्वोच्च अदालतको आदेश'
                    ].map((doc, i) => (
                      <div key={i} className="p-3.5 bg-muted-area/50 rounded-2xl flex items-center justify-between text-xs font-bold">
                        <span className="text-card-foreground">{doc}</span>
                        <span className="text-primary hover:underline cursor-pointer">डाउनलोड / हेर्नुहोस्</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {workspaceTab === 'fact_check' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase text-card-foreground">तथ्य जाँच (Fact Check Checklist)</h4>
                  <div className="space-y-2 text-xs font-medium">
                    {[
                      { item: 'तथ्याङ्कहरू आधिकारिक स्रोतबाट प्रमाणित गरिएको छ', checked: true },
                      { item: 'व्यक्तिगत नाम र पद सहि रूपमा लेखिएको छ', checked: true },
                      { item: 'तस्बिरहरूको प्रतिलिपि अधिकार (Copyright) सुनिश्चित गरिएको छ', checked: false }
                    ].map((chk, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 bg-muted-area/50 rounded-2xl cursor-pointer">
                        <input type="checkbox" defaultChecked={chk.checked} className="w-4 h-4 text-primary rounded" />
                        <span className="text-card-foreground font-bold">{chk.item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {workspaceTab !== 'article' && workspaceTab !== 'media' && workspaceTab !== 'research' && workspaceTab !== 'fact_check' && (
                <div className="p-12 text-center text-muted-text text-xs">
                  यो ट्याबमा सम्बन्धित सामग्री उपलब्ध छ।
                </div>
              )}
            </div>

            {/* Quick Research Assistant & Notes Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-wider text-muted-text flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" /> रिसर्च सहायक (AI Assistant)
                </h4>
                <div className="space-y-2 text-xs font-medium text-muted-text">
                  <div className="p-3 bg-muted-area/50 rounded-2xl">
                    💡 <span className="font-bold text-card-foreground">सुझाव:</span> पशुपति क्षेत्रको विकाससम्बन्धी पछिल्लो १० वर्षको तथ्याङ्क समावेश गर्दा लेख अझ प्रभावकारी हुन्छ।
                  </div>
                  <div className="p-3 bg-muted-area/50 rounded-2xl">
                    🔑 <span className="font-bold text-card-foreground">मुख्यकिवर्ड्स:</span> पशुपतिनाथ, सनातन संस्कृति, गुरुयोजना २०८३।
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-wider text-muted-text flex items-center gap-2">
                  <MessageSquare size={16} className="text-emerald-600" /> सम्पादकीय संवाद (Thread)
                </h4>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {commentsThread.map((c, i) => (
                    <div key={i} className="p-3 bg-muted-area/50 rounded-2xl space-y-1">
                      <div className="flex justify-between text-[10px] font-black text-primary">
                        <span>{c.sender}</span>
                        <span className="text-muted-text">{c.time}</span>
                      </div>
                      <p className="text-xs text-card-foreground font-medium">{c.text}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={handlePostComment} className="flex gap-2 pt-2">
                  <input 
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="टिप्पणी लेख्नुहोस्..."
                    className="flex-grow bg-muted-area/50 border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground outline-none"
                  />
                  <button type="submit" className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-bold">पठाउनुहोस्</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight">मेरा असाइनमेन्टहरू (My Assignments)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {assignments.map(a => (
                <div key={a.id} className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase">
                      {a.priority}
                    </span>
                    <span className="text-xs font-bold text-amber-600 font-mono flex items-center gap-1">
                      <Clock size={12} /> {a.deadline}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-card-foreground">{a.title}</h4>
                  <div className="pt-3 border-t border-border-theme/40 text-xs flex justify-between text-muted-text font-medium">
                    <span>असाइन गर्ने: <strong className="text-card-foreground">{a.editor}</strong></span>
                    <span className="font-bold text-primary">{a.status}</span>
                  </div>
                  <button onClick={() => setActiveTab('workspace')} className="w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all">
                    काम सुरु गर्नुहोस्
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: RESEARCH ASSISTANT */}
        {activeTab === 'research' && (
          <div className="bg-card border border-border-theme rounded-3xl p-8 space-y-6">
            <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight">अनुसन्धान सहायक (Research Center)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-muted-area/50 rounded-3xl space-y-3">
                <h4 className="text-sm font-bold text-card-foreground">📚 архиव रिपोर्ट र लेखहरू</h4>
                <p className="text-xs text-muted-text">सनातन मार्गको ५ वर्षको आर्काइवबाट सान्दर्भिक लेखहरू तुरुन्तै खोज्नुहोस्।</p>
                <input type="text" placeholder="विषय वा कीवर्ड खोज्नुहोस्..." className="w-full bg-card border border-border-theme rounded-xl px-4 py-2.5 text-xs outline-none" />
              </div>
              <div className="p-6 bg-muted-area/50 rounded-3xl space-y-3">
                <h4 className="text-sm font-bold text-card-foreground">🔥 ट्रेन्डिङ किवर्ड्स (Trending Keywords)</h4>
                <div className="flex flex-wrap gap-2">
                  {['पशुपतिनाथ', 'संविधान', 'डिजिटल नेपाल', 'अर्थतन्त्र', 'संस्कृति', 'युवा स्वरोजगार'].map((kw, i) => (
                    <span key={i} className="px-3 py-1 bg-card border border-border-theme rounded-xl text-xs font-bold text-primary">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MEDIA CENTER */}
        {activeTab === 'media' && (
          <div className="bg-card border border-border-theme rounded-3xl p-8 space-y-6">
            <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight">मिडिया अपलोड सेन्टर (Media Center)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { title: 'पशुपति क्षेत्र फोटो.jpg', size: '२.४ एमबी' },
                { title: 'सांस्कृतिक ¥याली भिडियो.mp4', size: '१८.२ एमबी' },
                { title: 'मन्त्रीको अन्तर्वार्ता अडियो.mp3', size: '५.१ एमबी' }
              ].map((m, i) => (
                <div key={i} className="p-4 bg-muted-area/50 rounded-2xl border border-border-theme space-y-2">
                  <div className="w-full h-24 bg-card rounded-xl flex items-center justify-center text-muted-text font-bold text-xs">
                    [Preview]
                  </div>
                  <h4 className="text-xs font-bold text-card-foreground truncate">{m.title}</h4>
                  <span className="text-[10px] text-muted-text">{m.size}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: EDITORIAL FEEDBACK */}
        {activeTab === 'comments' && (
          <div className="bg-card border border-border-theme rounded-3xl p-8 space-y-6">
            <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight">सम्पादकीय संवाद र प्रतिक्रिया (Feedback)</h3>
            <div className="space-y-4">
              {commentsThread.map((c, i) => (
                <div key={i} className="p-4 bg-muted-area/50 rounded-2xl flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">
                    {c.sender[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-card-foreground">{c.sender}</span>
                      <span className="text-[10px] text-muted-text">{c.time}</span>
                    </div>
                    <p className="text-xs text-muted-text font-medium mt-1">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: PERSONAL METRICS */}
        {activeTab === 'metrics' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-2">
              <span className="text-xs font-black uppercase text-muted-text">कुल प्रकाशित लेख</span>
              <div className="text-3xl font-black text-card-foreground font-mono">४२ लेख</div>
              <span className="text-xs text-emerald-600 font-bold">यस महिना</span>
            </div>
            <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-2">
              <span className="text-xs font-black uppercase text-muted-text">मासिक भ्युज</span>
              <div className="text-3xl font-black text-primary font-mono">२.८ लाख</div>
              <span className="text-xs text-emerald-600 font-bold">+२४% गत महिनाभन्दा</span>
            </div>
            <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-2">
              <span className="text-xs font-black uppercase text-muted-text">इंगेजमेन्ट स्कोर</span>
              <div className="text-3xl font-black text-emerald-600 font-mono">९६.४%</div>
              <span className="text-xs text-emerald-600 font-bold">उत्कृष्ट</span>
            </div>
            <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-2">
              <span className="text-xs font-black uppercase text-muted-text">सम्पन्न असाइनमेन्ट</span>
              <div className="text-3xl font-black text-purple-600 font-mono">२८ वटा</div>
              <span className="text-xs text-purple-600 font-bold">समयमा सम्पन्न</span>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
