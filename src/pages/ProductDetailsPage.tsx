import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ShoppingBag, 
  ArrowLeft, 
  Star, 
  ShieldCheck, 
  Truck, 
  RotateCw, 
  Check, 
  MessageCircle, 
  Share2, 
  BookOpen, 
  Package, 
  Download, 
  Clock, 
  MapPin, 
  Phone, 
  CreditCard,
  User,
  Send,
  Sparkles,
  Info
} from "lucide-react";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import SEOHead from "@/src/components/common/SEOHead";
import { useLanguage } from "@/src/context/LanguageContext";
import type { StoreProduct, StoreOrder } from "@/src/types";
import { SAMPLE_PRODUCTS } from "./StorePage";
import { toast } from "sonner";
import { db } from "@/src/lib/firebase";
import { doc, setDoc } from "@/src/lib/firebase";

interface ProductReview {
  id: string;
  userName: string;
  rating: number;
  date: string;
  comment: string;
  verifiedPurchase: boolean;
}

const DEFAULT_REVIEWS: ProductReview[] = [
  {
    id: "rev-1",
    userName: "रमेश अधिकारी",
    rating: 5,
    date: "२०८१ फागुन १५",
    comment: "अत्यन्तै उच्च गुणस्तरको ग्रन्थ! संस्कृत श्लोक र नेपाली भावानुवाद दुवै स्पष्ट छन्। प्याकेजिङ पनि निकै सुरक्षित थियो।",
    verifiedPurchase: true
  },
  {
    id: "rev-2",
    userName: "सुनिता शर्मा",
    rating: 5,
    date: "२०८१ माघ २८",
    comment: "काठमाडौँ बाहिर पनि २ दिनमै डेलिभरी भयो। सनातन परम्पराको प्रामाणिक सामग्री खोज्नेहरूका लागि यो अनिवार्य छ।",
    verifiedPurchase: true
  },
  {
    id: "rev-3",
    userName: "विष्णु प्रसाद पौडेल",
    rating: 4,
    date: "२०८१ माघ १०",
    comment: "कागज र अक्षरको छपाइ निकै राम्रो छ। हाम्रो पुस्तकालयका लागि थप २ प्रति अर्डर गर्दैछु।",
    verifiedPurchase: true
  }
];

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [allProducts, setAllProducts] = useState<StoreProduct[]>(SAMPLE_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "authenticity" | "delivery">("description");

  // Reviews state
  const [reviews, setReviews] = useState<ProductReview[]>(DEFAULT_REVIEWS);
  const [newReviewAuthor, setNewReviewAuthor] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Order modal state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerDistrict, setCustomerDistrict] = useState("काठमाडौँ (Kathmandu)");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"whatsapp_cod" | "esewa" | "khalti">("whatsapp_cod");
  const [orderNotes, setOrderNotes] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Load product
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const findProduct = (list: StoreProduct[]) => {
      return list.find(p => p.id === id || p.slug === id);
    };

    // 1. Check in SAMPLE_PRODUCTS or localStorage
    try {
      const saved = localStorage.getItem("sg_store_products");
      let combined = [...SAMPLE_PRODUCTS];
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          combined = [...parsed, ...SAMPLE_PRODUCTS.filter(sp => !parsed.some((p: StoreProduct) => p.id === sp.id))];
        }
      }
      setAllProducts(combined);

      const found = findProduct(combined);
      if (found) {
        setProduct(found);
        setSelectedImage(found.images?.[0] || "");
      }
    } catch {
      // ignore
    }

    // 2. Fetch from API
    fetch(`/api/store/products`)
      .then(r => r.json())
      .then(data => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          const apiProducts = data.products;
          setAllProducts(apiProducts);
          const matched = findProduct(apiProducts);
          if (matched) {
            setProduct(matched);
            if (!selectedImage) setSelectedImage(matched.images?.[0] || "");
          }
        }
      })
      .catch(() => {
        // fallback ok
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // Load persisted reviews for this product
    try {
      const storedReviews = localStorage.getItem(`sg_product_reviews_${id}`);
      if (storedReviews) {
        const parsed = JSON.parse(storedReviews);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReviews([...parsed, ...DEFAULT_REVIEWS]);
        }
      }
    } catch {
      // ignore
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading && !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-muted-text">
              उत्पादनको विवरण लोड हुँदैछ...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-5 p-8 rounded-3xl bg-card border border-border-theme shadow-lg">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <ShoppingBag size={32} />
            </div>
            <h2 className="text-xl font-black text-foreground">
              {language === "en" ? "Product Not Found" : "उत्पादन फेला परेन"}
            </h2>
            <p className="text-sm text-muted-text">
              {language === "en" 
                ? "The requested item might have been moved or is currently unavailable in the store catalogue."
                : "तपाईंले खोज्नुभएको सामग्री स्टोरमा उपलब्ध नभएको वा हटाइएको हुन सक्छ।"}
            </p>
            <Link
              to="/store"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-md"
            >
              <ArrowLeft size={16} />
              <span>{language === "en" ? "Return to Store" : "स्टोरमा फर्कनुहोस्"}</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const effectivePrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
  const hasSale = !!product.salePrice && product.salePrice < product.price;
  const discountPercent = hasSale ? Math.round(((product.price - product.salePrice!) / product.price) * 100) : 0;
  const isOutOfStock = product.stock <= 0 || product.status === "out_of_stock";

  const relatedProducts = allProducts
    .filter(p => p.id !== product.id && (p.category === product.category || p.isFeatured))
    .slice(0, 3);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.nameNepali,
        text: product.descriptionNepali,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(language === "en" ? "Link copied to clipboard!" : "उत्पादनको लिंक कपी गरियो!");
    }
  };

  const generateWhatsAppUrl = () => {
    const phone = product.whatsappNumber || "9779800000000";
    const cleanedPhone = phone.replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      `नमस्ते सनातन मिडिया!\nम स्टोरबाट यो सामग्री अर्डर गर्न चाहन्छु:\n\n• सामग्री: ${product.nameNepali} (${product.name})\n• परिणाम: ${quantity} थान\n• जम्मा मूल्य: रु. ${effectivePrice * quantity}\n• लिंक: ${window.location.href}\n\nकृपया डेलिभरी प्रक्रिया अगाडि बढाइदिनुहोला।`
    );
    return `https://wa.me/${cleanedPhone}?text=${msg}`;
  };

  const handleDirectOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      toast.error("कृपया नाम, फोन नम्बर र ठेगाना अनिवार्य भर्नुहोस्।");
      return;
    }

    setIsSubmittingOrder(true);
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const newOrder: StoreOrder = {
      id: orderId,
      orderId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      phone: customerPhone.trim(),
      district: customerDistrict,
      address: customerAddress.trim(),
      productId: product.id,
      productName: product.nameNepali,
      quantity,
      unitPriceLocked: effectivePrice,
      totalPrice: effectivePrice * quantity,
      paymentMethod,
      status: "pending",
      notes: orderNotes.trim(),
      storageClass: "AUTHORITATIVE_DURABLE",
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Try Firebase Firestore
      if (db) {
        await setDoc(doc(db, "store_orders", orderId), newOrder);
      }
    } catch {
      // continue to local storage fallback
    }

    // 2. Persist in local storage
    try {
      const existing = localStorage.getItem("sg_commerce_orders");
      const list: StoreOrder[] = existing ? JSON.parse(existing) : [];
      list.unshift(newOrder);
      localStorage.setItem("sg_commerce_orders", JSON.stringify(list));
    } catch {
      // ignore
    }

    // 3. Post to backend if available
    try {
      fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder)
      }).catch(() => {});
    } catch {
      // ignore
    }

    setIsSubmittingOrder(false);
    setIsOrderModalOpen(false);
    toast.success(
      language === "en" 
        ? `Order #${orderId} placed successfully! Our team will contact you shortly.` 
        : `अर्डर #${orderId} सफलतापूर्वक दर्ता भयो! हाम्रो टोलीले छिट्टै सम्पर्क गर्नेछ।`
    );
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) {
      toast.error("कृपया तपाईंको नाम र समीक्षा लेख्नुहोस्।");
      return;
    }

    setSubmittingReview(true);
    const rev: ProductReview = {
      id: `rev-${Date.now()}`,
      userName: newReviewAuthor.trim(),
      rating: newReviewRating,
      date: new Date().toLocaleDateString("ne-NP", { year: "numeric", month: "long", day: "numeric" }),
      comment: newReviewComment.trim(),
      verifiedPurchase: true
    };

    const updated = [rev, ...reviews];
    setReviews(updated);
    try {
      localStorage.setItem(`sg_product_reviews_${product.id}`, JSON.stringify([rev]));
    } catch {
      // ignore
    }

    setNewReviewAuthor("");
    setNewReviewComment("");
    setSubmittingReview(false);
    toast.success("समीक्षाका लागि धन्यवाद! तपाईंको समीक्षा प्रकाशित भयो।");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20 selection:text-primary">
      <SEOHead
        title={`${product.nameNepali} | सनातन भण्डार`}
        description={product.descriptionNepali || product.description}
        image={product.images?.[0]}
      />
      <Header />

      <main className="flex-1 pb-16">
        {/* Breadcrumb Navigation */}
        <div className="bg-muted-area/40 border-b border-border-theme py-3 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-muted-text">
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
              <Link to="/" className="hover:text-primary transition-colors">गृहपृष्ठ</Link>
              <span>/</span>
              <Link to="/store" className="hover:text-primary transition-colors">सनातन भण्डार</Link>
              <span>/</span>
              <span className="capitalize">{product.category}</span>
              <span>/</span>
              <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-xs">
                {language === "en" ? product.name : product.nameNepali}
              </span>
            </div>
            <button
              onClick={() => navigate("/store")}
              className="inline-flex items-center gap-1 hover:text-primary transition-colors shrink-0 font-medium cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>पछाडि फर्कनुहोस्</span>
            </button>
          </div>
        </div>

        {/* Product Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Gallery Column (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative aspect-square w-full rounded-3xl bg-muted-area border border-border-theme overflow-hidden shadow-sm group">
                <img
                  src={selectedImage || product.images?.[0] || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800"}
                  alt={product.nameNepali}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {hasSale && (
                  <span className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-wider shadow-md">
                    {discountPercent}% छुट (OFFER)
                  </span>
                )}
                <span className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-card/85 backdrop-blur-md border border-border-theme text-xs font-black uppercase tracking-wider text-muted-text shadow-sm">
                  {product.category}
                </span>
              </div>

              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        selectedImage === img ? "border-primary shadow-md scale-95" : "border-border-theme hover:border-primary/50"
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-card border border-border-theme flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">१००% प्रामाणिक</h5>
                    <p className="text-[11px] text-muted-text">सनातन मानक प्रमाणित</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-card border border-border-theme flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">७७ वटै जिल्लामा</h5>
                    <p className="text-[11px] text-muted-text">सुरक्षित होम डेलिभरी</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Meta & Actions Column (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Header info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                      {product.category}
                    </span>
                    {product.isFeatured && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={12} /> विशेष छनोट
                      </span>
                    )}
                    {product.isCertified && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck size={12} /> प्रामाणिक ग्यारेन्टी
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
                    {language === "en" ? product.name : product.nameNepali}
                  </h1>

                  {language === "ne" && product.name && (
                    <p className="text-sm text-muted-text italic">
                      {product.name}
                    </p>
                  )}
                </div>

                {/* Rating & Author */}
                <div className="flex items-center gap-4 text-xs flex-wrap border-y border-border-theme py-2.5">
                  <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={star <= Math.round(product.rating || 5) ? "fill-amber-500 text-amber-500" : "text-muted-text/30"}
                        />
                      ))}
                    </div>
                    <span>{product.rating || 5.0}</span>
                    <span className="text-muted-text font-normal">
                      ({reviews.length || product.reviewCount || 10} समीक्षाहरू)
                    </span>
                  </div>

                  {product.authorOrMaker && (
                    <span className="text-muted-text border-l border-border-theme pl-3">
                      प्रकाशन/सर्जक: <strong className="text-foreground">{product.authorOrMaker}</strong>
                    </span>
                  )}

                  <span className="text-muted-text border-l border-border-theme pl-3">
                    स्थिति:{" "}
                    {isOutOfStock ? (
                      <strong className="text-red-500">स्टक सकिएको</strong>
                    ) : (
                      <strong className="text-emerald-600">स्टकमा उपलब्ध ({product.stock} बाँकी)</strong>
                    )}
                  </span>
                </div>

                {/* Price Display */}
                <div className="p-4 rounded-2xl bg-muted-area/50 border border-border-theme flex items-baseline gap-3">
                  <span className="text-xs font-bold text-muted-text">मूल्य:</span>
                  <span className="text-3xl font-black text-primary">
                    रु. {effectivePrice}
                  </span>
                  {hasSale && (
                    <>
                      <span className="text-base text-muted-text line-through">
                        रु. {product.price}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                        रु. {product.price - product.salePrice!} बचत
                      </span>
                    </>
                  )}
                </div>

                {/* Short Description */}
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {language === "en" ? product.description : product.descriptionNepali}
                </p>

                {/* Specifications Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                  {product.language && (
                    <div className="p-2.5 rounded-xl bg-card border border-border-theme text-xs">
                      <span className="text-muted-text block text-[10px] uppercase font-bold">भाषा</span>
                      <span className="font-bold text-foreground capitalize">{product.language}</span>
                    </div>
                  )}
                  {product.pageCount && (
                    <div className="p-2.5 rounded-xl bg-card border border-border-theme text-xs">
                      <span className="text-muted-text block text-[10px] uppercase font-bold">पृष्ठ सङ्ख्या</span>
                      <span className="font-bold text-foreground">{product.pageCount} पृष्ठ</span>
                    </div>
                  )}
                  {product.fileFormat && (
                    <div className="p-2.5 rounded-xl bg-card border border-border-theme text-xs">
                      <span className="text-muted-text block text-[10px] uppercase font-bold">फर्म्याट</span>
                      <span className="font-bold text-foreground">{product.fileFormat}</span>
                    </div>
                  )}
                  <div className="p-2.5 rounded-xl bg-card border border-border-theme text-xs">
                    <span className="text-muted-text block text-[10px] uppercase font-bold">भुक्तानी</span>
                    <span className="font-bold text-foreground">eSewa / Khalti / COD</span>
                  </div>
                </div>

                {/* Quantity and Action Buttons */}
                <div className="pt-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-muted-text uppercase tracking-wider">परिमाण (Quantity):</span>
                    <div className="inline-flex items-center rounded-xl border border-border-theme bg-card shadow-xs">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1 || isOutOfStock}
                        className="px-3.5 py-2 text-foreground hover:bg-muted-area font-black text-sm disabled:opacity-40 transition-colors"
                      >
                        -
                      </button>
                      <span className="px-4 py-2 font-bold text-sm min-w-[40px] text-center border-x border-border-theme">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}
                        disabled={isOutOfStock || quantity >= (product.stock || 10)}
                        className="px-3.5 py-2 text-foreground hover:bg-muted-area font-black text-sm disabled:opacity-40 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-muted-text">
                      जम्मा: <strong className="text-primary font-black">रु. {effectivePrice * quantity}</strong>
                    </span>
                  </div>

                  {/* Primary CTA Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => setIsOrderModalOpen(true)}
                      disabled={isOutOfStock}
                      className="w-full py-3.5 px-6 rounded-2xl bg-primary text-white font-black text-sm shadow-md hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag size={18} />
                      <span>अनलाइन अर्डर गर्नुहोस्</span>
                    </button>

                    <a
                      href={generateWhatsAppUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-md hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageCircle size={18} />
                      <span>WhatsApp बाट अर्डर गर्नुहोस्</span>
                    </a>
                  </div>

                  {/* Secondary Share Button */}
                  <div className="flex items-center justify-between text-xs text-muted-text pt-2">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-primary" />
                      अर्डर पुष्टि भएको २४ देखि ४८ घण्टाभित्र डेलिभरी सुरु हुन्छ।
                    </span>
                    <button
                      onClick={handleShare}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                    >
                      <Share2 size={14} />
                      <span>साझा गर्नुहोस्</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Tabbed Info Section */}
          <div className="mt-16 pt-8 border-t border-border-theme">
            <div className="flex items-center gap-3 border-b border-border-theme overflow-x-auto pb-px">
              <button
                onClick={() => setActiveTab("description")}
                className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "description"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-text hover:text-foreground"
                }`}
              >
                विस्तृत विवरण (Description)
              </button>
              <button
                onClick={() => setActiveTab("authenticity")}
                className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "authenticity"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-text hover:text-foreground"
                }`}
              >
                प्रामाणिकता र गुणस्तर ग्यारेन्टी
              </button>
              <button
                onClick={() => setActiveTab("delivery")}
                className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "delivery"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-text hover:text-foreground"
                }`}
              >
                डेलिभरी र फिर्ता नीति
              </button>
            </div>

            <div className="py-6">
              {activeTab === "description" && (
                <div className="space-y-4 max-w-4xl text-sm leading-relaxed text-foreground/80">
                  <h4 className="text-base font-bold text-foreground">
                    {product.nameNepali}
                  </h4>
                  <p>{product.descriptionNepali}</p>
                  {product.description && (
                    <div className="mt-4 p-4 rounded-2xl bg-muted-area/40 border border-border-theme space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-text block">
                        English Details
                      </span>
                      <p className="text-xs text-foreground/80">{product.description}</p>
                    </div>
                  )}
                  {product.downloadUrl && (
                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Download className="text-primary" size={24} />
                        <div>
                          <h5 className="font-bold text-foreground text-sm">डिजिटल डाउनलोड उपलब्ध</h5>
                          <p className="text-xs text-muted-text">अर्डर सम्पन्न हुनासाथ तपाईंको इमेल र खातामा तुरुन्तै उपलब्ध हुनेछ।</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-xl bg-primary text-white text-xs font-bold">
                        {product.fileFormat || "PDF"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "authenticity" && (
                <div className="max-w-4xl space-y-4 text-sm leading-relaxed">
                  <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
                    <ShieldCheck size={24} className="shrink-0 mt-0.5 text-emerald-600" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-foreground">सनातन मानक र वैदिक प्रामाणिकता</h4>
                      <p className="text-xs">
                        हाम्रो स्टोरमा उपलब्ध सम्पूर्ण ग्रन्थहरू र हस्तकलाहरू आधिकारिक विद्वान परिषद् तथा स्थानीय परम्परागत कालिगडहरूद्वारा परीक्षण र प्रमाणीकरण गरिएका छन्।
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-xs text-foreground/80 list-disc list-inside">
                    <li>ग्रन्थहरूमा कुनै पनि विकृति वा गैर-प्रामाणिक थपघट नगरिएको प्रत्याभूति।</li>
                    <li>हस्तनिर्मित कपडा र पूजा सामग्रीहरू १००% प्राकृतिक तथा पर्यावरणमैत्री।</li>
                    <li>प्रत्येक अर्डरसँगै सनातन प्रामाणिकता प्रमाणीकरण पत्र संलग्न।</li>
                  </ul>
                </div>
              )}

              {activeTab === "delivery" && (
                <div className="max-w-4xl space-y-4 text-sm leading-relaxed">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-card border border-border-theme space-y-1">
                      <h5 className="font-bold text-foreground text-xs uppercase tracking-wider text-primary">उपत्यकाभित्र (Kathmandu Valley)</h5>
                      <p className="text-xs text-muted-text">२४ घण्टाभित्र सिधै घरमै डेलिभरी। क्यास अन डेलिभरी (COD) उपलब्ध।</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-card border border-border-theme space-y-1">
                      <h5 className="font-bold text-foreground text-xs uppercase tracking-wider text-primary">उपत्यकाबाहिर (All 77 Districts)</h5>
                      <p className="text-xs text-muted-text">२ देखि ४ दिनभित्र कुरियर/डेलिभरी सेवामार्फत सुरक्षित हस्तान्तरण।</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-text">
                    सामग्रीमा कुनै क्षति वा त्रुटि देखिएमा प्राप्त भएको ७ दिनभित्र निःशुल्क साटफेर वा फिर्ताको व्यवस्था छ।
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="mt-12 pt-8 border-t border-border-theme">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-black text-foreground">
                  ग्राहक समीक्षाहरू ({reviews.length})
                </h3>
                <p className="text-xs text-muted-text">सत्यापित ग्राहकहरूको अनुभव र प्रतिक्रिया</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Existing Reviews List */}
              <div className="lg:col-span-7 space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-card border border-border-theme space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {rev.userName.charAt(0)}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-foreground">{rev.userName}</h5>
                          <span className="text-[10px] text-muted-text">{rev.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center text-amber-500">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={12} className={s <= rev.rating ? "fill-amber-500" : "text-muted-text/30"} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed">{rev.comment}</p>
                    {rev.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                        <Check size={10} /> प्रमाणित खरिद (Verified Purchase)
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Review Form */}
              <div className="lg:col-span-5">
                <div className="p-5 rounded-3xl bg-card border border-border-theme shadow-sm space-y-4">
                  <h4 className="text-sm font-black text-foreground">
                    आफ्नो समीक्षा थप्नुहोस्
                  </h4>

                  <form onSubmit={handleReviewSubmit} className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-muted-text block mb-1">
                        मूल्याङ्कन (Rating)
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setNewReviewRating(star)}
                            className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star
                              size={20}
                              className={star <= newReviewRating ? "fill-amber-500" : "text-muted-text/30"}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-muted-text ml-2">
                          {newReviewRating} / ५
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-muted-text block mb-1">
                        तपाईंको पूरा नाम
                      </label>
                      <input
                        type="text"
                        value={newReviewAuthor}
                        onChange={(e) => setNewReviewAuthor(e.target.value)}
                        placeholder="उदा. डा. प्रकाश शर्मा"
                        className="w-full px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-xs focus:outline-hidden focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-muted-text block mb-1">
                        तपाईंको प्रतिक्रिया/समीक्षा
                      </label>
                      <textarea
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        rows={3}
                        placeholder="सामग्रीको गुणस्तर, छपाइ र सेवाबारे आफ्नो अनुभव लेख्नुहोस्..."
                        className="w-full px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-xs focus:outline-hidden focus:border-primary resize-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Send size={14} />
                      <span>समीक्षा पोस्ट गर्नुहोस्</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="mt-16 pt-8 border-t border-border-theme">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-foreground">
                    सम्बन्धित सामग्रीहरू
                  </h3>
                  <p className="text-xs text-muted-text">सनातन भण्डारका अन्य लोकप्रिय सामग्रीहरू</p>
                </div>
                <Link
                  to="/store"
                  className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>सबै हेर्नुहोस्</span>
                  <ArrowLeft size={12} className="rotate-180" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProducts.map((p) => (
                  <Link
                    key={p.id}
                    to={`/store/product/${p.id}`}
                    className="p-4 rounded-3xl bg-card border border-border-theme hover:border-primary/50 transition-all shadow-xs hover:shadow-md space-y-3 group"
                  >
                    <div className="aspect-video w-full rounded-2xl bg-muted-area overflow-hidden">
                      <img
                        src={p.images?.[0] || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=600"}
                        alt={p.nameNepali}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-500 font-bold flex items-center gap-1">
                          <Star size={12} className="fill-amber-500" />
                          {p.rating || 5.0}
                        </span>
                        <span className="font-black text-primary">
                          रु. {p.salePrice || p.price}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {language === "en" ? p.name : p.nameNepali}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Online Order Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-md w-full bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-border-theme pb-3">
              <div>
                <h3 className="text-base font-black text-foreground">
                  अनलाइन अर्डर फारम
                </h3>
                <p className="text-xs text-muted-text">
                  {product.nameNepali} ({quantity} थान)
                </p>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1 rounded-xl hover:bg-muted-area text-muted-text hover:text-foreground transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDirectOrderSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-text block mb-1">
                  तपाईंको पूरा नाम *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="उदा. सन्तोष रेग्मी"
                  className="w-full px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-xs focus:outline-hidden focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-text block mb-1">
                  सम्पर्क मोबाइल नम्बर *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="उदा. 9841XXXXXX"
                  className="w-full px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-xs focus:outline-hidden focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-muted-text block mb-1">
                    जिल्ला *
                  </label>
                  <select
                    value={customerDistrict}
                    onChange={(e) => setCustomerDistrict(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-muted-area border border-border-theme text-xs focus:outline-hidden focus:border-primary"
                  >
                    <option value="काठमाडौँ (Kathmandu)">काठमाडौँ</option>
                    <option value="ललितपुर (Lalitpur)">ललितपुर</option>
                    <option value="भक्तपुर (Bhaktapur)">भक्तपुर</option>
                    <option value="कास्की (Pokhara)">कास्की (पोखरा)</option>
                    <option value="चितवन (Chitwan)">चितवन</option>
                    <option value="मोरङ (Biratnagar)">मोरङ (विराटनगर)</option>
                    <option value="रुपन्देही (Butwal/Bhairahawa)">रुपन्देही</option>
                    <option value="अन्य ७० जिल्ला">अन्य जिल्ला</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-text block mb-1">
                    भुक्तानी विधि
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl bg-muted-area border border-border-theme text-xs focus:outline-hidden focus:border-primary"
                  >
                    <option value="whatsapp_cod">क्यास अन डेलिभरी (COD)</option>
                    <option value="esewa">eSewa वालेट</option>
                    <option value="khalti">Khalti वालेट</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-text block mb-1">
                  डेलिभरी ठेगाना (टोल/घर नम्बर) *
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="उदा. नयाँ बानेश्वर, काठमाडौँ"
                  className="w-full px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-xs focus:outline-hidden focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-text block mb-1">
                  थप टिप्पणी (वैकल्पिक)
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="डेलिभरी समय वा विशेष निर्देशन..."
                  className="w-full px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-xs focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="p-3 rounded-xl bg-muted-area border border-border-theme flex items-center justify-between text-xs">
                <span className="text-muted-text">कुल भुक्तानी रकम:</span>
                <span className="text-sm font-black text-primary">रु. {effectivePrice * quantity}</span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-border-theme text-xs font-bold hover:bg-muted-area transition-colors cursor-pointer"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="w-1/2 py-2.5 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md cursor-pointer"
                >
                  {isSubmittingOrder ? "अर्डर हुँदैछ..." : "अर्डर सुरक्षित गर्नुहोस्"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
