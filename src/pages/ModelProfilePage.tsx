import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, setDoc, deleteDoc } from "@/src/lib/firebase";
import { db, auth, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { 
  MapPin, Award, Instagram, Facebook, Twitter, 
  ChevronLeft, ChevronRight, X, Send, CheckCircle2,
  User, Ruler, Weight, Calendar, Globe, Star, Camera, Video,
  Heart, MessageCircle, Share2, ThumbsUp, Smile, Zap
} from "lucide-react";
import type { Model, ProjectType, GalleryImage, GalleryReaction, GalleryComment } from "@/src/types";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { toast } from "sonner";
import { useAuth } from "@/src/lib/auth";
import ImageLightboxModal, { LightboxImageItem } from "@/src/components/common/ImageLightboxModal";

import { addDocWithQueue } from "@/src/lib/offlineQueue";

export default function ModelProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [model, setModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isContactAgentModalOpen, setIsContactAgentModalOpen] = useState(false);
  
  // Gallery Interactions State
  const [reactions, setReactions] = useState<GalleryReaction[]>([]);
  const [comments, setComments] = useState<GalleryComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    name: "",
    email: "",
    phone: "",
    projectType: "Photoshoot" as ProjectType,
    budget: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Agent Contact Form State
  const [agentForm, setAgentForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmittingAgent, setIsSubmittingAgent] = useState(false);
  const [isAgentSuccess, setIsAgentSuccess] = useState(false);

  const allGalleryImages: GalleryImage[] = model ? [
    { id: 'profile', url: model.profileImage, createdAt: model.createdAt },
    ...(model.coverImages || []).map((url, i) => ({ id: `cover-${i}`, url, createdAt: model.createdAt })),
    ...(model.gallery || [])
  ] : [];

  const activeImage = allGalleryImages[activeImageIndex];

  useEffect(() => {
    if (isLightboxOpen && activeImage && model) {
      const fetchGalleryData = async () => {
        try {
          const qR = query(collection(db, "galleryReactions"), where("imageId", "==", activeImage.id));
          const snapR = await getDocs(qR);
          setReactions(snapR.docs.map(d => ({ id: d.id, ...d.data() } as GalleryReaction)));
          
          const qC = query(collection(db, "galleryComments"), where("imageId", "==", activeImage.id), orderBy("createdAt", "asc"));
          const snapC = await getDocs(qC);
          setComments(snapC.docs.map(d => ({ id: d.id, ...d.data() } as GalleryComment)));
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, "gallery");
        }
      };
      fetchGalleryData();
    }
  }, [isLightboxOpen, activeImageIndex, model]);

  const handleReaction = async (type: GalleryReaction["type"]) => {
    if (!user) {
      toast.error("Please login to react");
      return;
    }
    if (!activeImage || !model) return;

    const reactionId = `${activeImage.id}_${user.uid}`;
    const existingReaction = reactions.find(r => r.userId === user.uid);

    try {
      if (existingReaction && existingReaction.type === type) {
        await deleteDoc(doc(db, "galleryReactions", reactionId));
      } else {
        await setDoc(doc(db, "galleryReactions", reactionId), {
          modelId: model.id,
          imageId: activeImage.id,
          userId: user.uid,
          type,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "galleryReactions");
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to comment");
      return;
    }
    if (!commentText.trim() || !activeImage || !model) return;

    setIsSubmittingComment(true);
    try {
      const result = await addDocWithQueue("galleryComments", {
        modelId: model.id,
        imageId: activeImage.id,
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userPhoto: user.photoURL || "",
        text: commentText.trim(),
        createdAt: serverTimestamp()
      });
      if (result && 'queued' in (result as any)) {
        toast.info("कोटा समाप्त भयो, प्रतिक्रिया क्युमा राखियो।");
      }
      setCommentText("");
    } catch (err) {
      console.error("Error commenting:", err);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleAgentContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!model) return;
    
    setIsSubmittingAgent(true);
    try {
      const result = await addDocWithQueue("agentInquiries", {
        ...agentForm,
        modelId: model.id,
        modelName: model.name,
        agentId: model.agentId || 'general',
        status: "new",
        createdAt: serverTimestamp()
      });
      if (result && 'queued' in (result as any)) {
        toast.info("कोटा समाप्त भयो, सन्देश क्युमा राखियो।");
      }
      setIsAgentSuccess(true);
      toast.success("Contact request sent to agent!");
      setTimeout(() => {
        setIsContactAgentModalOpen(false);
        setIsAgentSuccess(false);
        setAgentForm({
          name: "",
          email: "",
          subject: "",
          message: ""
        });
      }, 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "agentInquiries");
    } finally {
      setIsSubmittingAgent(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    const fetchModel = async () => {
      try {
        const docRef = doc(db, "models", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setModel({ id: docSnap.id, ...docSnap.data() } as Model);
        }
      } catch (err) {
        console.error("Error fetching model:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchModel();
  }, [id]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!model) return;
    
    setIsSubmitting(true);
    try {
      const result = await addDocWithQueue("modelInquiries", {
        ...bookingForm,
        modelId: model.id,
        modelName: model.name,
        status: "new",
        createdAt: serverTimestamp()
      });
      if (result && 'queued' in (result as any)) {
        toast.info("कोटा समाप्त भयो, बुकिङ क्युमा राखियो।");
      }
      setIsSuccess(true);
      toast.success("Inquiry sent successfully!");
      setTimeout(() => {
        setIsBookingModalOpen(false);
        setIsSuccess(false);
        setBookingForm({
          name: "",
          email: "",
          phone: "",
          projectType: "Photoshoot",
          budget: "",
          message: ""
        });
      }, 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "modelInquiries");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h2 className="text-3xl font-black text-card-foreground mb-4">Model not found</h2>
        <Link to="/models" className="text-primary font-bold hover:underline">Back to Directory</Link>
      </div>
    );
  }

  const allImages = [model.profileImage, ...(model.coverImages || [])];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />

      {/* Hero Section - Editorial Style */}
      <section className="relative h-screen md:h-[90vh] overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5 }}
            src={model.profileImage || null} 
            alt={model.name}
            className="w-full h-full object-cover opacity-80 pointer-events-none select-none"
            referrerPolicy="no-referrer"
            onContextMenu={(e) => e.preventDefault()}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        </div>

        <div className="container-custom relative h-full flex flex-col justify-end pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <span className="px-4 py-1.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-full">
                {model.category}
              </span>
              {model.isVerified && (
                <div className="flex items-center gap-2 text-white/80 text-xs font-black uppercase tracking-widest">
                  <Award size={16} className="text-primary" /> Verified Professional
                </div>
              )}
            </div>
            
            <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter leading-none mb-8">
              {model.name.split(' ').map((part, i) => (
                <span key={i} className="block">{part}</span>
              ))}
            </h1>

            <div className="flex flex-wrap items-center gap-8 text-white/80">
              <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm">
                <MapPin size={18} className="text-primary" /> {model.location}
              </div>
              <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm">
                <Ruler size={18} className="text-primary" /> {model.height}
              </div>
              <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm">
                <Star size={18} className="text-primary" /> {model.experienceYears}+ Years Exp.
              </div>
            </div>

            <div className="mt-12 flex flex-wrap gap-4">
              <button 
                onClick={() => setIsBookingModalOpen(true)}
                className="px-10 py-5 bg-white text-slate-900 rounded-full text-sm font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all duration-300 shadow-2xl"
              >
                Book Now
              </button>
              <button 
                onClick={() => setIsContactAgentModalOpen(true)}
                className="px-10 py-5 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full text-sm font-black uppercase tracking-widest hover:bg-white/20 transition-all duration-300"
              >
                Contact Agent
              </button>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 right-10 hidden md:block">
          <div className="flex flex-col items-center gap-4">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest vertical-text">Scroll</span>
            <div className="w-px h-20 bg-gradient-to-b from-white/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* Stats & Bio Section */}
      <section className="py-24 bg-muted-area">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Bio */}
            <div className="lg:col-span-7">
              <h2 className="text-xxs font-black text-primary uppercase tracking-widest mb-6">About</h2>
              <p className="text-2xl md:text-3xl font-medium text-card-foreground leading-relaxed tracking-tight">
                {model.bio || "No biography provided."}
              </p>
              
              <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-8">
                <div className="flex flex-col gap-1">
                  <span className="text-xxs font-black text-muted-text uppercase tracking-widest">Languages</span>
                  <span className="text-sm font-bold text-card-foreground">{model.languages?.join(", ") || "N/A"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xxs font-black text-muted-text uppercase tracking-widest">Skills</span>
                  <span className="text-sm font-bold text-card-foreground">{model.skills?.join(", ") || "N/A"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xxs font-black text-muted-text uppercase tracking-widest">Age</span>
                  <span className="text-sm font-bold text-card-foreground">{model.age} Years</span>
                </div>
              </div>
            </div>

            {/* Stats Sidebar */}
            <div className="lg:col-span-5 relative">
              <div className="sticky top-[132px] bg-card rounded-[40px] p-10 shadow-xl shadow-muted-area/50 border border-border-theme transition-all duration-300">
                <h3 className="text-xl font-black text-card-foreground tracking-tight mb-8">Physical Stats</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-4 border-b border-border-theme">
                    <div className="flex items-center gap-3 text-muted-text font-bold uppercase tracking-widest text-xs">
                      <Ruler size={16} /> Height
                    </div>
                    <span className="text-lg font-black text-card-foreground">{model.height}</span>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-border-theme">
                    <div className="flex items-center gap-3 text-muted-text font-bold uppercase tracking-widest text-xs">
                      <Weight size={16} /> Weight
                    </div>
                    <span className="text-lg font-black text-card-foreground">{model.weight}</span>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-border-theme">
                    <div className="flex items-center gap-3 text-muted-text font-bold uppercase tracking-widest text-xs">
                      <User size={16} /> Gender
                    </div>
                    <span className="text-lg font-black text-card-foreground">{model.gender}</span>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3 text-muted-text font-bold uppercase tracking-widest text-xs">
                      <Globe size={16} /> Location
                    </div>
                    <span className="text-lg font-black text-card-foreground">{model.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Gallery */}
      <section className="py-24 bg-card">
        <div className="container-custom">
          <div className="flex items-end justify-between mb-16">
            <div>
              <h2 className="text-xxs font-black text-primary uppercase tracking-widest mb-4">Portfolio</h2>
              <h3 className="text-4xl md:text-5xl font-black text-card-foreground tracking-tighter">Visual Journey</h3>
            </div>
            <div className="hidden md:flex gap-4">
              <div className="flex items-center gap-2 text-xs font-black text-muted-text uppercase tracking-widest">
                <Camera size={16} /> Photos
              </div>
              <div className="flex items-center gap-2 text-xs font-black text-muted-text uppercase tracking-widest">
                <Video size={16} /> Videos
              </div>
            </div>
          </div>

          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {allGalleryImages.map((img, index) => (
              <motion.div 
                key={img.id}
                whileHover={{ y: -10 }}
                className="relative group cursor-pointer overflow-hidden rounded-[var(--app-radius)]"
                style={{ borderRadius: 'var(--app-radius)' }}
                onClick={() => {
                  setActiveImageIndex(index);
                  setIsLightboxOpen(true);
                }}
              >
                <img 
                  src={img.url || null} 
                  alt={`${model.name} Portfolio ${index + 1}`}
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110 pointer-events-none select-none"
                  referrerPolicy="no-referrer"
                  onContextMenu={(e) => e.preventDefault()}
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex gap-4 scale-50 group-hover:scale-100 transition-transform duration-300">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 border border-border-theme">
                      <Heart size={20} className="text-red-500 fill-red-500" />
                    </div>
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 border border-border-theme">
                      <MessageCircle size={20} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isContactAgentModalOpen && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContactAgentModalOpen(false)}
              className="absolute inset-0 bg-background/90 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-card rounded-[40px] overflow-hidden shadow-2xl border border-border-theme p-10 flex flex-col gap-8"
            >
              <button 
                onClick={() => setIsContactAgentModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-muted-text hover:text-card-foreground transition-colors z-10"
              >
                <X size={24} />
              </button>

              {isAgentSuccess ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-card-foreground tracking-tight mb-2">Request Sent!</h3>
                  <p className="text-muted-text font-medium">The agent will get back to you shortly.</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-3xl font-black text-card-foreground tracking-tighter">Contact Agent</h3>
                    <p className="text-muted-text font-medium">Message the representative for {model.name}.</p>
                  </div>
                  
                  <form onSubmit={handleAgentContactSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Your Name</label>
                      <input 
                        required
                        value={agentForm.name}
                        onChange={e => setAgentForm({...agentForm, name: e.target.value})}
                        className="w-full px-4 py-3 bg-muted-area border border-border-theme rounded-xl text-sm font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Email</label>
                      <input 
                        required
                        type="email"
                        value={agentForm.email}
                        onChange={e => setAgentForm({...agentForm, email: e.target.value})}
                        className="w-full px-4 py-3 bg-muted-area border border-border-theme rounded-xl text-sm font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Subject</label>
                      <input 
                        required
                        value={agentForm.subject}
                        onChange={e => setAgentForm({...agentForm, subject: e.target.value})}
                        className="w-full px-4 py-3 bg-muted-area border border-border-theme rounded-xl text-sm font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Message</label>
                      <textarea 
                        required
                        value={agentForm.message}
                        onChange={e => setAgentForm({...agentForm, message: e.target.value})}
                        className="w-full px-4 py-3 bg-muted-area border border-border-theme rounded-xl text-sm font-bold outline-none min-h-[120px]"
                      />
                    </div>
                    <button 
                      disabled={isSubmittingAgent}
                      className="w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      {isSubmittingAgent ? "Sending..." : "Send Message"} <Send size={16} />
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute inset-0 bg-background/90 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-card rounded-[40px] overflow-hidden shadow-2xl border border-border-theme"
            >
              <button 
                onClick={() => setIsBookingModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-muted-text hover:text-card-foreground transition-colors z-10"
              >
                <X size={24} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="hidden md:block relative h-full">
                  <img 
                    src={model.profileImage || null} 
                    alt={model.name} 
                    className="w-full h-full object-cover pointer-events-none select-none"
                    referrerPolicy="no-referrer"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
                  <div className="absolute bottom-10 left-10 right-10 text-white">
                    <h4 className="text-2xl font-black tracking-tight">{model.name}</h4>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80">{model.category}</p>
                  </div>
                </div>

                <div className="p-8 md:p-12">
                  {isSuccess ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                      <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 size={40} />
                      </div>
                      <h3 className="text-2xl font-black text-card-foreground tracking-tight mb-2">Inquiry Sent!</h3>
                      <p className="text-muted-text font-medium">Our team will contact you shortly regarding your booking request for {model.name}.</p>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-3xl font-black text-card-foreground tracking-tighter mb-2">Book Model</h3>
                      <p className="text-muted-text font-medium mb-8">Fill in the details for your professional project.</p>
                      
                      <form onSubmit={handleBookingSubmit} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Full Name</label>
                          <input 
                            required
                            type="text"
                            value={bookingForm.name}
                            onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                            className="w-full px-4 py-3 bg-muted-area border border-border-theme rounded-xl text-sm font-bold text-card-foreground focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            placeholder="Your Name"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Email</label>
                            <input 
                              required
                              type="email"
                              value={bookingForm.email}
                              onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                              className="w-full px-4 py-3 bg-muted-area border border-border-theme rounded-xl text-sm font-bold text-card-foreground focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                              placeholder="Email"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Phone</label>
                            <input 
                              type="tel"
                              value={bookingForm.phone}
                              onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                              className="w-full px-4 py-3 bg-muted-area border border-border-theme rounded-xl text-sm font-bold text-card-foreground focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                              placeholder="Phone"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Project Type</label>
                          <select 
                            required
                            value={bookingForm.projectType}
                            onChange={(e) => setBookingForm({...bookingForm, projectType: e.target.value as ProjectType})}
                            className="w-full px-4 py-3 bg-muted-area border border-border-theme rounded-xl text-sm font-bold text-card-foreground focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                          >
                            <option value="Photoshoot" className="bg-card">Photoshoot</option>
                            <option value="Music Video" className="bg-card">Music Video</option>
                            <option value="Movie" className="bg-card">Movie</option>
                            <option value="Advertisement" className="bg-card">Advertisement</option>
                            <option value="Other" className="bg-card">Other</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Message</label>
                          <textarea 
                            value={bookingForm.message}
                            onChange={(e) => setBookingForm({...bookingForm, message: e.target.value})}
                            className="w-full px-4 py-3 bg-muted-area border border-border-theme rounded-xl text-sm font-bold text-card-foreground focus:ring-2 focus:ring-primary/20 transition-all outline-none min-h-[100px] resize-none"
                            placeholder="Tell us about your project..."
                          />
                        </div>
                        
                        <button 
                          disabled={isSubmitting}
                          type="submit"
                          className="w-full py-4 bg-primary text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>Send Inquiry <Send size={16} /></>
                          )}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox Modal */}
      <ImageLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={allGalleryImages.map((img) => ({
          id: img.id,
          url: img.url,
          title: model?.name || "फोटो",
          subtitle: model?.category || "सनातन मार्ग",
          authorName: model?.name,
          authorPhoto: model?.profileImage,
          modelId: model?.id
        }))}
        currentIndex={activeImageIndex}
        onIndexChange={setActiveImageIndex}
      />

      <Footer />
      
      <style>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </div>
  );
}
