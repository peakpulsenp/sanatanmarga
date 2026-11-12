import { useState, useEffect } from "react";
import { collection, addDoc, doc, serverTimestamp } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { X, Image as ImageIcon, Send, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import NepaliInput from "@/src/components/ui/NepaliInput";

import { toast } from "sonner";
import { addDocWithQueue, setDocWithQueue } from "@/src/lib/offlineQueue";
import { broadcastNotification } from "@/src/lib/notifications";

import { chautariStore } from "@/src/utils/chautariStore";
import { uploadMediaFile } from "@/src/services/mediaService";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    title?: string;
    content?: string;
    imageUrl?: string;
    category?: string;
    linkedArticleId?: string;
  };
}

export default function CreatePostModal({ isOpen, onClose, initialData }: CreatePostModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [category, setCategory] = useState(initialData?.category || "News");
  const [hashtags, setHashtags] = useState("");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [activeTab, setActiveTab] = useState<"post" | "media">("post");
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = ["News", "Market", "Advice", "Showcase", "General"];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingMedia(true);
      const asset = await uploadMediaFile({
        file,
        category: "community",
        uploadedBy: user?.displayName || user?.uid || "Community User"
      });
      if (asset && asset.url) {
        setImageUrl(asset.url);
        toast.success("मिडिया सफलतापूर्वक अपलोड भयो!");
      }
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("मिडिया अपलोड गर्न सकिएन।");
    } finally {
      setUploadingMedia(false);
    }
  };

  // Update state when initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      setTitle(initialData.title || "");
      setContent(initialData.content || "");
      setCategory(initialData.category || "News");
      setImageUrl(initialData.imageUrl || "");
      setHashtags("");
      if (initialData.imageUrl) setActiveTab("media");
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (activeTab === "post" && !content.trim()) {
      setError("Body text is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const hashtagArray = hashtags
        .split(/[ ,]+/)
        .map(tag => {
          if (!tag) return "";
          return tag.startsWith("#") ? tag : `#${tag}`;
        })
        .filter(tag => tag.length > 1);

      const postId = `chautari_post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const postPayload = {
        id: postId,
        title: title.trim(),
        content: content.trim(),
        category,
        hashtags: hashtagArray,
        imageUrl: imageUrl.trim() || null,
        linkedArticleId: initialData?.linkedArticleId || null,
        authorId: user.uid,
        authorName: user.displayName || "Anonymous",
        authorPhoto: user.photoURL || null,
        upvotes: 0,
        downvotes: 0,
        commentCount: 0,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      chautariStore.addLocalPost(postPayload as any);

      await setDocWithQueue(doc(db, "communityPosts", postId), {
        ...postPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("snapshot-rebuilt", {
            detail: { collection: "communityPosts", docId: postId, timestamp: Date.now() }
          })
        );
      }
      
      toast.success("Post submitted!");
      setTitle("");
      setContent("");
      setHashtags("");
      setImageUrl("");
      onClose();
    } catch (err: any) {
      setError("Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-0 sm:p-4 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="relative w-full max-w-2xl bg-card sm:rounded-xl shadow-2xl overflow-hidden border border-border-theme flex flex-col h-full sm:h-auto sm:max-h-[85vh]"
          >
            <div className="flex items-center justify-between p-4 border-b border-border-theme bg-muted-area/30">
              <h2 className="text-sm font-black text-card-foreground uppercase tracking-widest">Create a Post</h2>
              <button onClick={onClose} className="p-1 hover:bg-muted-area rounded-md flex items-center gap-1 text-muted-text text-xs font-bold transition-colors">
                <X size={16} /> Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category Picker */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all border ${
                        category === cat 
                          ? "bg-primary text-white border-primary shadow-sm" 
                          : "bg-muted-area/50 text-muted-text border-border-theme/50 hover:border-primary/30"
                      }`}
                    >
                      c/{cat}
                    </button>
                  ))}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border-theme mb-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("post")}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all relative ${
                      activeTab === "post" ? "text-primary" : "text-muted-text hover:text-card-foreground"
                    }`}
                  >
                    Post
                    {activeTab === "post" && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("media")}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all relative ${
                      activeTab === "media" ? "text-primary" : "text-muted-text hover:text-card-foreground"
                    }`}
                  >
                    Images & Video
                    {activeTab === "media" && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                  </button>
                </div>

                {error && (
                  <div className="bg-red-500/10 text-red-500 p-3 rounded-lg flex items-center gap-2 text-xs font-bold border border-red-500/20">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <div className="space-y-4">
                  <NepaliInput 
                    placeholder="Title"
                    value={title}
                    onChange={setTitle}
                    className="w-full p-3 rounded-lg border-2 border-border-theme bg-muted-area/30 focus:border-primary/50 outline-none text-base font-bold"
                  />

                  {activeTab === "post" ? (
                    <NepaliInput 
                      placeholder="Text (required)"
                      value={content}
                      onChange={setContent}
                      className="w-full p-3 rounded-lg border-2 border-border-theme bg-muted-area/30 focus:border-primary/50 outline-none resize-none text-sm min-h-[160px]"
                      style={{ borderRadius: "var(--app-radius, 12px)" }}
                      type="textarea"
                    />
                  ) : (
                    <div className="space-y-4">
                      <div 
                        className="border-2 border-dashed border-border-theme p-8 bg-muted-area/10 text-center relative hover:border-primary/50 transition-colors cursor-pointer"
                        style={{ borderRadius: "var(--app-radius, 12px)" }}
                        onClick={() => document.getElementById('community-file-input')?.click()}
                      >
                        <input 
                          id="community-file-input"
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <ImageIcon size={24} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-card-foreground">
                              {uploadingMedia ? "अपलोड हुँदैछ..." : "फाइल छान्नुहोस् वा ड्रप गर्नुहोस् (Click or Drag)"}
                            </p>
                            <p className="text-[10px] text-muted-text mt-1">तस्वीर वा भिडियो (अधिकतम २०MB)</p>
                          </div>
                          <button
                            type="button"
                            disabled={uploadingMedia}
                            className="mt-2 px-4 py-2 bg-primary text-white rounded-full text-xs font-bold shadow-sm hover:brightness-110 transition-all"
                          >
                            {uploadingMedia ? "अपलोड हुँदैछ..." : "डिफाइसबाट छान्नुहोस्"}
                          </button>
                        </div>
                      </div>

                      <div className="text-center text-[10px] text-muted-text font-medium">— अथवा प्रत्यक्ष URL राख्नुहोस् —</div>
                      <input 
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full p-3 border border-border-theme bg-card text-xs focus:ring-1 focus:ring-primary outline-none rounded-lg"
                      />
                      
                      {imageUrl?.trim() && (
                        <div 
                          className="relative overflow-hidden border border-border-theme group"
                          style={{ borderRadius: "var(--app-radius, 12px)" }}
                        >
                          <img src={imageUrl || null} alt="Preview" className="w-full h-auto max-h-[300px] object-contain bg-black/5" referrerPolicy="no-referrer" />
                          <button 
                            type="button"
                            onClick={() => setImageUrl("")}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}

                      <NepaliInput 
                        placeholder="विवरण (वैकल्पिक)"
                        value={content}
                        onChange={setContent}
                        className="w-full p-3 border border-border-theme bg-muted-area/30 outline-none text-xs"
                        style={{ borderRadius: "var(--app-radius, 8px)" }}
                        type="textarea"
                        rows={3}
                      />
                    </div>
                  )}

                  <input 
                    type="text"
                    placeholder="Add tags (separated by space)"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    className="w-full p-3 rounded-lg border border-border-theme bg-muted-area/30 text-xs focus:border-primary outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-theme">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 rounded-full text-xs font-black text-muted-text hover:bg-muted-area transition-all"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-primary text-white px-8 py-2 rounded-full text-xs font-black shadow-md hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? "Posting..." : "Post"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
