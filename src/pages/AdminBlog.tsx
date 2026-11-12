import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  BookOpen, Plus, Edit, Trash2, Eye, CheckCircle2, Clock, 
  Sparkles, Layers, Tag, Save, Send, AlertCircle, RefreshCw, 
  FileText, Globe, User, Award, ArrowLeft
} from "lucide-react";
import { BlogPost, BlogCategory, BlogSeries, BlogStatus, ScriptureReference } from "@/src/types";
import { sanatanBlogService } from "@/src/services/sanatanBlogService";
import { CANONICAL_BLOG_CATEGORIES, CANONICAL_BLOG_POSTS, CANONICAL_BLOG_SERIES } from "@/src/data/sanatanBlogData";
import { useAuth } from "@/src/lib/auth";
import AdminLayout from "@/src/components/layout/AdminLayout";
import NepaliInput from "@/src/components/ui/NepaliInput";
import { toast } from "sonner";

export const AdminBlog: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>(CANONICAL_BLOG_CATEGORIES);
  const [seriesList, setSeriesList] = useState<BlogSeries[]>(CANONICAL_BLOG_SERIES);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | BlogStatus>("all");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Form State for Editing Post
  const [title, setTitle] = useState("");
  const [titleNe, setTitleNe] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [subtitleNe, setSubtitleNe] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [excerptNe, setExcerptNe] = useState("");
  const [body, setBody] = useState("");
  const [bodyNe, setBodyNe] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [categoryId, setCategoryId] = useState("cat_dharma");
  const [seriesId, setSeriesId] = useState("");
  const [tagsString, setTagsString] = useState("");
  const [readingTime, setReadingTime] = useState(5);
  const [authorDisplayName, setAuthorDisplayName] = useState(user?.displayName || "Acharya Vidyadhar Sharma");
  const [scriptureList, setScriptureList] = useState<ScriptureReference[]>([]);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const snapshot = await sanatanBlogService.getBlogHomepageSnapshot();
      setPosts(snapshot.latestPosts || CANONICAL_BLOG_POSTS);
    } catch (e) {
      setPosts(CANONICAL_BLOG_POSTS);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingPost(null);
    setTitle("");
    setTitleNe("");
    setSubtitle("");
    setSubtitleNe("");
    setExcerpt("");
    setExcerptNe("");
    setBody("");
    setBodyNe("");
    setFeaturedImage("https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=1200");
    setCategoryId("cat_dharma");
    setSeriesId("");
    setTagsString("dharma, philosophy, upanishad");
    setReadingTime(5);
    setAuthorDisplayName(user?.displayName || "Sanatan Scholar");
    setScriptureList([]);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (post: BlogPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setTitleNe(post.titleNe || "");
    setSubtitle(post.subtitle || "");
    setSubtitleNe(post.subtitleNe || "");
    setExcerpt(post.excerpt);
    setExcerptNe(post.excerptNe || "");
    setBody(post.body);
    setBodyNe(post.bodyNe || "");
    setFeaturedImage(post.featuredImage);
    setCategoryId(post.categoryId);
    setSeriesId(post.seriesId || "");
    setTagsString((post.tags || []).join(", "));
    setReadingTime(post.readingTimeMinutes || 5);
    setAuthorDisplayName(post.authorDisplayName);
    setScriptureList(post.scriptureReferences || []);
    setIsEditorOpen(true);
  };

  const handleSavePost = async (statusToSave: BlogStatus) => {
    if (!title) {
      toast.error("Title is required");
      return;
    }

    const selectedCat = categories.find(c => c.id === categoryId) || categories[0];
    const selectedSeries = seriesList.find(s => s.id === seriesId);
    const tags = tagsString.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);

    const postPayload: Partial<BlogPost> = {
      ...(editingPost || {}),
      title,
      titleNe,
      subtitle,
      subtitleNe,
      excerpt,
      excerptNe,
      body,
      bodyNe,
      featuredImage,
      categoryId: selectedCat.id,
      categorySlug: selectedCat.slug,
      categoryName: selectedCat.name,
      categoryNameNe: selectedCat.nameNe,
      seriesId: selectedSeries?.id,
      seriesSlug: selectedSeries?.slug,
      seriesName: selectedSeries?.title,
      tags,
      readingTimeMinutes: Number(readingTime),
      authorDisplayName,
      status: statusToSave,
      scriptureReferences: scriptureList
    };

    try {
      const saved = await sanatanBlogService.savePost(postPayload, {
        uid: user?.uid || "admin_author",
        displayName: authorDisplayName
      });
      toast.success(statusToSave === "published" ? "Essay Published Successfully!" : "Draft Saved!");
      setIsEditorOpen(false);
      loadPosts();
    } catch (e) {
      toast.error("Failed to save post");
    }
  };

  const handleAiAssist = async (taskType: "draft" | "outline" | "translation" | "scripture_lookup") => {
    if (!aiPrompt && !title) {
      toast.error("Please enter a topic or title for AI assistance");
      return;
    }
    setAiLoading(true);
    try {
      const res = await sanatanBlogService.aiAssist(aiPrompt || title, taskType);
      if (res && res.result) {
        if (taskType === "outline" || taskType === "draft") {
          setBody(prev => prev ? `${prev}\n\n${res.result}` : res.result);
        } else if (taskType === "translation") {
          setBodyNe(res.result);
        }
        toast.success("AI suggestion applied!");
      }
    } catch (e) {
      toast.error("AI service error");
    } finally {
      setAiLoading(false);
    }
  };

  const addScriptureRef = () => {
    setScriptureList(prev => [
      ...prev,
      {
        text: "Bhagavad Gita",
        chapter: 2,
        verse: 47,
        devanagariText: "",
        englishTranslation: ""
      }
    ]);
  };

  const filteredPosts = activeTab === "all" ? posts : posts.filter(p => p.status === activeTab);

  return (
    <AdminLayout title="Sanatan Blog Editorial CMS">
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card-bg border border-border-theme/60">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Publish Once, Read Many Architecture</span>
            </div>
            <h1 className="text-xl font-bold text-main-text">Sanatan Scholarly Blog Management</h1>
            <p className="text-xs text-muted-text">Long-form Vedic essays, scriptural citations, SGIS linking, and bilingual publishing.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/blog"
              target="_blank"
              className="px-4 py-2 rounded-xl border border-border-theme bg-muted-area/50 text-xs font-bold text-main-text hover:bg-muted-area flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Public Blog</span>
            </Link>

            <button
              onClick={handleOpenNew}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow hover:bg-primary/90 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Essay</span>
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 border-b border-border-theme/60 pb-3">
          {(["all", "published", "draft", "under_review", "archived"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === tab ? "bg-primary text-white" : "bg-card-bg text-muted-text hover:text-main-text border border-border-theme/50"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Articles List Table */}
        <div className="bg-card-bg border border-border-theme/60 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-16 text-center text-muted-text flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <span>Loading blog posts...</span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-16 text-center text-muted-text">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No essays found in this view.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-theme/40">
              {filteredPosts.map((post) => (
                <div key={post.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted-area/30 transition-colors">
                  <div className="flex items-start gap-4 min-w-0">
                    <img src={post.featuredImage || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200"} alt={post.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-xxs font-bold uppercase bg-primary/10 text-primary">
                          {post.categoryName}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xxs font-bold uppercase ${
                          post.status === "published" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                        }`}>
                          {post.status}
                        </span>
                        {post.seriesName && (
                          <span className="text-xxs text-muted-text flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {post.seriesName}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-main-text line-clamp-1">
                        {post.title}
                      </h3>
                      {post.titleNe && (
                        <div className="text-xxs text-muted-text line-clamp-1">{post.titleNe}</div>
                      )}

                      <div className="flex items-center gap-3 text-xxs text-muted-text mt-1">
                        <span>By: <strong>{post.authorDisplayName}</strong></span>
                        <span>•</span>
                        <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{post.views || 0} views</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link
                      to={`/blog/${post.slug}`}
                      target="_blank"
                      className="p-2 rounded-lg bg-card-bg border border-border-theme text-muted-text hover:text-primary transition-colors"
                      title="View Article"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleOpenEdit(post)}
                      className="p-2 rounded-lg bg-card-bg border border-border-theme text-muted-text hover:text-primary transition-colors"
                      title="Edit Article"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Full-Screen / Modal Editor */}
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="bg-card-bg border border-border-theme/70 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-5 border-b border-border-theme/60 flex items-center justify-between bg-muted-area/30">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-bold text-main-text">
                    {editingPost ? "Edit Scholarly Essay" : "Author New Sanatan Essay"}
                  </h2>
                </div>
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="text-xs font-bold text-muted-text hover:text-main-text"
                >
                  ✕ Close
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Title (English) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-text mb-1">
                    Article Title (English) *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Nachiketa’s Quest in Katha Upanishad"
                    className="w-full px-4 py-2.5 rounded-xl bg-card-bg border border-border-theme text-sm text-main-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Title (Nepali Transliteration) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-text mb-1">
                    शीर्षक (नेपाली / देवनागरी)
                  </label>
                  <NepaliInput
                    value={titleNe}
                    onChange={setTitleNe}
                    placeholder="कठोपनिषद्मा नचिकेताको अमर जिज्ञासा..."
                    className="w-full px-4 py-2.5 rounded-xl bg-card-bg border border-border-theme text-sm text-main-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Subtitle / Excerpt */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-text mb-1">
                      Excerpt (English)
                    </label>
                    <textarea
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl bg-card-bg border border-border-theme text-xs text-main-text focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-text mb-1">
                      संक्षेप (नेपाली)
                    </label>
                    <NepaliInput
                      value={excerptNe}
                      onChange={setExcerptNe}
                      rows={3}
                      type="textarea"
                      className="w-full px-3 py-2 rounded-xl bg-card-bg border border-border-theme text-xs text-main-text focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Category & Series */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-text mb-1">
                      Category *
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-card-bg border border-border-theme text-xs text-main-text focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.nameNe})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-text mb-1">
                      Series (Optional)
                    </label>
                    <select
                      value={seriesId}
                      onChange={(e) => setSeriesId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-card-bg border border-border-theme text-xs text-main-text focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">None (Standalone Essay)</option>
                      {seriesList.map((s) => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-text mb-1">
                      Author Attribution
                    </label>
                    <input
                      type="text"
                      value={authorDisplayName}
                      onChange={(e) => setAuthorDisplayName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-card-bg border border-border-theme text-xs text-main-text focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Featured Image URL */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-text mb-1">
                    Featured Image URL
                  </label>
                  <input
                    type="text"
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-card-bg border border-border-theme text-xs text-main-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Body (English Markdown) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-text">
                      Essay Body (Markdown) *
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAiAssist("outline")}
                        disabled={aiLoading}
                        className="text-xxs px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold transition-colors flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>AI Outline</span>
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={8}
                    className="w-full p-4 rounded-xl bg-card-bg border border-border-theme text-xs text-main-text font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Write article in Markdown..."
                  />
                </div>

                {/* Body (Nepali) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-text">
                      आलेख मुख्य पाठ (नेपाली)
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAiAssist("translation")}
                      disabled={aiLoading}
                      className="text-xxs px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold transition-colors flex items-center gap-1"
                    >
                      <Globe className="w-3 h-3" />
                      <span>Translate to Nepali</span>
                    </button>
                  </div>
                  <NepaliInput
                    value={bodyNe}
                    onChange={setBodyNe}
                    rows={6}
                    type="textarea"
                    className="w-full p-4 rounded-xl bg-card-bg border border-border-theme text-xs text-main-text font-sans focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="नेपालीमा आलेख यहाँ लेख्नुहोस्..."
                  />
                </div>

                {/* Scripture Reference Builder */}
                <div className="p-4 rounded-xl bg-muted-area/40 border border-border-theme/60">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      Scripture Citations & Shlokas ({scriptureList.length})
                    </span>
                    <button
                      type="button"
                      onClick={addScriptureRef}
                      className="text-xxs px-2.5 py-1 rounded bg-primary text-white font-bold"
                    >
                      + Add Verse
                    </button>
                  </div>

                  {scriptureList.map((ref, idx) => (
                    <div key={idx} className="p-3 mb-2 rounded-lg bg-card-bg border border-border-theme text-xs space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={ref.text}
                          onChange={(e) => {
                            const updated = [...scriptureList];
                            updated[idx].text = e.target.value;
                            setScriptureList(updated);
                          }}
                          placeholder="Text (e.g. Bhagavad Gita)"
                          className="px-2 py-1 rounded border border-border-theme text-xxs"
                        />
                        <input
                          type="text"
                          value={ref.chapter || ""}
                          onChange={(e) => {
                            const updated = [...scriptureList];
                            updated[idx].chapter = e.target.value;
                            setScriptureList(updated);
                          }}
                          placeholder="Chapter"
                          className="px-2 py-1 rounded border border-border-theme text-xxs"
                        />
                        <input
                          type="text"
                          value={ref.verse || ""}
                          onChange={(e) => {
                            const updated = [...scriptureList];
                            updated[idx].verse = e.target.value;
                            setScriptureList(updated);
                          }}
                          placeholder="Verse"
                          className="px-2 py-1 rounded border border-border-theme text-xxs"
                        />
                      </div>
                      <input
                        type="text"
                        value={ref.devanagariText || ""}
                        onChange={(e) => {
                          const updated = [...scriptureList];
                          updated[idx].devanagariText = e.target.value;
                          setScriptureList(updated);
                        }}
                        placeholder="Devanagari Sanskrit Shloka"
                        className="w-full px-2 py-1 rounded border border-border-theme text-xxs"
                      />
                      <input
                        type="text"
                        value={ref.englishTranslation || ""}
                        onChange={(e) => {
                          const updated = [...scriptureList];
                          updated[idx].englishTranslation = e.target.value;
                          setScriptureList(updated);
                        }}
                        placeholder="English Translation"
                        className="w-full px-2 py-1 rounded border border-border-theme text-xxs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-border-theme/60 bg-muted-area/30 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border-theme text-xs font-bold text-muted-text hover:text-main-text"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSavePost("draft")}
                    className="px-4 py-2 rounded-xl bg-card-bg border border-border-theme text-xs font-bold text-main-text hover:bg-muted-area"
                  >
                    Save as Draft
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSavePost("published")}
                    className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow hover:bg-primary/90 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish Essay (Snapshot OS)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBlog;
