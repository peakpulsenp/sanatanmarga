import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ShoppingBag, 
  BookOpen, 
  Shirt, 
  Download, 
  Sparkles, 
  MessageCircle, 
  Check, 
  Search, 
  Filter, 
  ArrowRight, 
  ShieldCheck, 
  Star, 
  X, 
  PhoneCall, 
  MapPin, 
  Tag, 
  Truck,
  Heart,
  RotateCw,
  Info,
  Book,
  PackageCheck
} from "lucide-react";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import SEOHead from "@/src/components/common/SEOHead";
import { useLanguage } from "@/src/context/LanguageContext";
import type { StoreProduct, StoreOrder } from "@/src/types";
import { toast } from "sonner";
import { db } from "@/src/lib/firebase";
import { doc, setDoc } from "@/src/lib/firebase";

export const SAMPLE_PRODUCTS: StoreProduct[] = [
  {
    id: "book-gita-deluxe",
    name: "Bhagavad Gita As It Is - Deluxe Hardcover Edition",
    nameNepali: "श्रीमद्भगवद्गीता यथारूप - संस्कृत र नेपाली भावानुवादसहित (डेल्क्स हार्डकभर)",
    slug: "bhagavad-gita-deluxe",
    description: "Original Sanskrit verses with word-for-word transliteration, Nepali translation, and comprehensive purports.",
    descriptionNepali: "संस्कृत मूल श्लोक, पदच्छेद, नेपाली भावानुवाद र विस्तृत प्रामाणिक व्याख्यासहितको पावन ग्रन्थ।",
    price: 1500,
    salePrice: 1250,
    category: "books",
    images: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800"],
    stock: 45,
    whatsappNumber: "9779800000000",
    status: "active",
    isFeatured: true,
    authorOrMaker: "सनातन ज्ञान पीठ",
    language: "multilingual",
    pageCount: 720,
    rating: 4.9,
    reviewCount: 128
  },
  {
    id: "book-rigveda-samhita",
    name: "Rigveda Samhita (4 Volumes Set in Nepali)",
    nameNepali: "ऋग्वेद संहिता - ४ खण्ड पूर्ण नेपाली अनुवादसहित",
    slug: "rigveda-samhita-set",
    description: "The complete 10 Mandalas of Rigveda translated into poetic Nepali with Vedic accents and commentaries.",
    descriptionNepali: "ऋग्वेदका १० वटै मण्डलहरूको ऋचा, पदपाठ र प्रामाणिक वैदिक नेपाली व्याख्यासहितको ४ खण्डको ऐतिहासिक सेट।",
    price: 4500,
    salePrice: 3800,
    category: "books",
    images: ["https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800"],
    stock: 20,
    whatsappNumber: "9779800000000",
    status: "active",
    isFeatured: true,
    authorOrMaker: "वैदिक अनुसन्धान परिषद्",
    language: "sanskrit",
    pageCount: 2400,
    rating: 5.0,
    reviewCount: 94
  },
  {
    id: "merch-dhaka-topi",
    name: "Handwoven Palpali Dhaka Topi & Muffler Set",
    nameNepali: "पाल्पाली ढाका टोपी तथा मफलर सेट (हस्तनिर्मित)",
    slug: "palpali-dhaka-topi-set",
    description: "100% authentic handwoven Palpali Dhaka fabric created by traditional weavers in Palpa, Nepal.",
    descriptionNepali: "पाल्पाका परम्परागत बुनाइकर्मीहरूद्वारा तयार पारिएको १००% हस्तनिर्मित पाल्पाली ढाका टोपी र सल।",
    price: 1800,
    salePrice: 1500,
    category: "merchandise",
    images: ["https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=800"],
    stock: 35,
    whatsappNumber: "9779800000000",
    status: "active",
    isFeatured: true,
    authorOrMaker: "नेपाल हस्तकला प्रतिष्ठान",
    rating: 4.8,
    reviewCount: 67
  },
  {
    id: "merch-pashupatinath-canvas",
    name: "Pashupatinath Temple Gold Leaf Canvas Artwork",
    nameNepali: "श्री पशुपतिनाथ मन्दिर स्वर्णपत्र क्यानभास फ्रेम आर्ट (30x20 in)",
    slug: "pashupatinath-gold-canvas",
    description: "Handcrafted 3D textured gold-leaf artwork depicting the holy Pashupatinath temple complex.",
    descriptionNepali: "श्री पशुपतिनाथ मन्दिरको स्वर्णपत्र र थ्रीडी हस्तकलायुक्त कलात्मक फ्रेम।",
    price: 3200,
    salePrice: 2800,
    category: "artwork",
    images: ["https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800"],
    stock: 12,
    whatsappNumber: "9779800000000",
    status: "active",
    isFeatured: false,
    authorOrMaker: "काठमाडौँ भ्याली आर्ट",
    rating: 4.9,
    reviewCount: 41
  },
  {
    id: "digital-dashain-guide",
    name: "Bada Dashain Complete Puja Vidhi & Tithi Guide (PDF)",
    nameNepali: "बडादसैँ पूजा विधि तथा तिथिपत्र - डिजिटल गाइड (PDF)",
    slug: "dashain-puja-guide-pdf",
    description: "Complete step-by-step ritual guide for Ghatasthapana, Maha Asthami, Navami, and Vijaya Dashami with Mantra audio notes.",
    descriptionNepali: "घटस्थापना, महाअष्टमी, महानवमी र विजयादशमीको प्रामाणिक पूजा विधि र मन्त्र गाइड।",
    price: 250,
    salePrice: 0,
    category: "digital",
    images: ["https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&q=80&w=800"],
    stock: 9999,
    whatsappNumber: "9779800000000",
    status: "active",
    isFeatured: true,
    fileFormat: "PDF (Digital Download)",
    downloadUrl: "#",
    rating: 5.0,
    reviewCount: 230
  },
  {
    id: "digital-temple-map",
    name: "Kathmandu Valley Ancient Temple Architecture Map (PDF)",
    nameNepali: "काठमाडौँ उपत्यकाका प्राचीन मन्दिर तथा तीर्थस्थल डिजिटल नक्सा (High-Res PDF)",
    slug: "kathmandu-temple-map-pdf",
    description: "High-resolution topological and heritage map of sacred sites in Kathmandu, Bhaktapur, and Lalitpur.",
    descriptionNepali: "काठमाडौँ, भक्तपुर र ललितपुरका ऐतिहासिक मन्दिर, बहाः र तीर्थस्थलहरूको डिजिटल नक्सा।",
    price: 300,
    salePrice: 150,
    category: "digital",
    images: ["https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=800"],
    stock: 9999,
    whatsappNumber: "9779800000000",
    status: "active",
    isFeatured: true,
    fileFormat: "PDF (300 DPI)",
    downloadUrl: "#",
    rating: 4.9,
    reviewCount: 88
  },
  {
    id: "digital-vedic-chanting-mp3",
    name: "Vedic Chanting High-Resolution Audio Album & E-Book",
    nameNepali: "वैदिक मन्त्रोच्चारण डिजिटल अडियो एलबम + संस्कृत इ-बुक (HD MP3)",
    slug: "vedic-chanting-audio-ebook",
    description: "HD Mastered recording of Rudram, Chamakam, and Purusha Suktam recited by traditional Nepalese Gurukulam priests.",
    descriptionNepali: "नेपालका गुरुकुलका बटुकहरूद्वारा वाचन गरिएको श्रीरुद्रम्, चमकम् र पुरुषसूक्तम्को एचडी अडियो संग्रह।",
    price: 500,
    salePrice: 350,
    category: "digital",
    images: ["https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800"],
    stock: 999,
    whatsappNumber: "9779800000000",
    status: "active",
    isFeatured: false,
    fileFormat: "MP3 + PDF",
    downloadUrl: "#",
    rating: 5.0,
    reviewCount: 112
  }
];

export default function StorePage() {
  const { language } = useLanguage();
  const [products, setProducts] = useState<StoreProduct[]>(SAMPLE_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);

  const toggleFlip = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFlippedCardId(prev => prev === id ? null : id);
  };

  // Order Form State
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("काठमाडौँ");
  const [quantity, setQuantity] = useState(1);
  const [selectedGateway, setSelectedGateway] = useState<"esewa" | "khalti" | "fonepay" | "whatsapp">("esewa");

  useEffect(() => {
    let isMounted = true;
    fetch("/api/store/products")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === "all" || p.category === selectedCategory;
    const matchesSearch = (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.nameNepali || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const [activeIdempotencyKey, setActiveIdempotencyKey] = useState<string>("");

  const handleOpenOrderModal = (product: StoreProduct) => {
    setSelectedProduct(product);
    setQuantity(1);
    setActiveIdempotencyKey(`idem-${product.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
  };

  const handleWhatsAppCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!customerName.trim() || !phone.trim()) {
      toast.error("कृपया आफ्नो नाम र फोन नम्बर राख्नुहोस्।");
      return;
    }

    const idempotencyKey = activeIdempotencyKey || `idem-${selectedProduct.id}-${phone.replace(/\D/g, "")}-${Date.now()}`;
    const totalAmt = (selectedProduct.salePrice || selectedProduct.price) * quantity;

    try {
      const res = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          customerName: customerName.trim(),
          customerPhone: phone.trim(),
          address: district ? district.trim() : "काठमाडौँ",
          productId: selectedProduct.id,
          productName: selectedProduct.nameNepali || selectedProduct.name,
          quantity,
          paymentMethod: selectedGateway === "whatsapp" ? "cod_whatsapp" : selectedGateway,
        }),
      });
      const data = await res.json().catch(() => ({ success: false, code: "UNKNOWN_ERROR" }));

      if (!res.ok || !data.success) {
        if (res.status === 503 || data.code === "ORDER_STORAGE_TEMPORARILY_UNAVAILABLE" || data.cartPreserved) {
          toast.error(
            language === "en"
              ? "Your order could not be confirmed right now. Your cart has been preserved. Please try again shortly."
              : "अर्डर अहिले पुष्टि हुन सकेन। तपाईंको अर्डर विवरण सुरक्षित छ। कृपया केही समयपछि पुनः प्रयास गर्नुहोस्।"
          );
        } else {
          toast.error(data.error || "अर्डर दर्ता गर्न सकिएन (स्टक अपर्याप्त हुन सक्छ)।");
        }
        // Cart, quantities, and input details are preserved. Do not close modal!
        return;
      }

      // Authoritative Confirmation Succeeded
      const orderId = data.orderId || `ORD-${Date.now()}`;
      toast.success(`अर्डर (${orderId}) सफलतापुर्वक दर्ता भयो!`);

      if (selectedGateway === "whatsapp") {
        const message = `नमस्ते Sanatan Store,\n\nम निम्न सामान खरिद गर्न चाहन्छु:\n\n` +
          `🆔 अर्डर ID: ${orderId}\n` +
          `📦 सामान: ${selectedProduct.nameNepali || selectedProduct.name}\n` +
          `🔢 परिमाण (Quantity): ${quantity}\n` +
          `💰 जम्मा मूल्य: रु. ${data.order?.totalPrice || totalAmt}\n\n` +
          `👤 ग्राहकको नाम: ${customerName}\n` +
          `📱 फोन नम्बर: ${phone}\n` +
          `📍 जिल्ला / ठेगाना: ${district}\n\n` +
          `कृपया अर्डर पुष्टि गरी पठाउने प्रक्रिया अगाडि बढाउनुहोला। धन्यवाद!`;

        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/9779851081080?text=${encoded}`, "_blank");
      }

      // Close modal and reset idempotency session only after verified success
      setSelectedProduct(null);
      setActiveIdempotencyKey("");
    } catch (error) {
      console.error("Order submit error:", error);
      toast.error(
        language === "en"
          ? "Your order could not be confirmed right now. Your cart has been preserved. Please try again shortly."
          : "अर्डर अहिले पुष्टि हुन सकेन। तपाईंको अर्डर विवरण सुरक्षित छ। कृपया केही समयपछि पुनः प्रयास गर्नुहोस्।"
      );
      // Cart is preserved
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEOHead
        title={language === "en" ? "Sanatan Store - Books, Merchandise & Heritage Artifacts" : "सनातन स्टोर - धार्मिक ग्रन्थ, वस्त्र र हस्तकला"}
        description="Official Sanatan Marga store for authentic Vedic books, Palpali Dhaka topi, artwork, and digital audio scriptures."
        url="/store"
      />
      <Header />

      <main className="flex-grow container-custom max-w-6xl py-8 md:py-12 space-y-8">
        {/* Banner Hero */}
        <div className="border border-border-theme bg-gradient-to-r from-amber-500/10 via-primary/10 to-transparent rounded-3xl p-6 md:p-10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag size={12} /> {language === "en" ? "Official Store" : "सनातन प्रामाणिक बजार"}
            </span>
            <span className="text-xs font-bold text-muted-text">Direct WhatsApp Order</span>
          </div>

          <div className="max-w-2xl space-y-2">
            <h1 className="text-2xl md:text-4xl font-black text-card-foreground tracking-tight">
              {language === "en" ? "Sanatan Heritage & Book Store" : "सनातन ग्रन्थ, वस्त्र तथा वैदिक कला संग्रह"}
            </h1>
            <p className="text-xs md:text-sm text-muted-text leading-relaxed">
              {language === "en"
                ? "Authentic Vedic scriptures, handwoven Nepali Dhaka products, temple artwork, and high-resolution digital audiobooks delivered directly across Nepal."
                : "प्रामाणिक वैदिक ग्रन्थहरू, हस्तनिर्मित पाल्पाली ढाका, मन्दिर कला र डिजिटल ग्रन्थ संग्रह। नेपालभर ह्वाट्सएप मार्फत सजिलै अर्डर गर्नुहोस्।"}
            </p>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card/60 border border-border-theme text-xs font-bold">
              <Truck size={16} className="text-amber-500 shrink-0" />
              <span>नेपालभर होम डेलिभरी</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card/60 border border-border-theme text-xs font-bold">
              <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
              <span>१००% प्रामाणिक ग्रन्थ</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card/60 border border-border-theme text-xs font-bold">
              <MessageCircle size={16} className="text-green-500 shrink-0" />
              <span>ह्वाट्सएप अर्डर सुलभता</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card/60 border border-border-theme text-xs font-bold">
              <Download size={16} className="text-blue-500 shrink-0" />
              <span>तुरुन्तै डाउनलोड योग्य इ-बुक</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {[
              { id: "all", labelNe: "सबै (All)", labelEn: "All" },
              { id: "books", labelNe: "ग्रन्थ तथा पुस्तकहरू", labelEn: "Books" },
              { id: "merchandise", labelNe: "वस्त्र तथा ढाका", labelEn: "Merchandise" },
              { id: "artwork", labelNe: "कला तथा मन्दिर फ्रेम", labelEn: "Artwork" },
              { id: "digital", labelNe: "डिजिटल इ-बुक / अडियो", labelEn: "Digital" },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-card border border-border-theme text-muted-text hover:text-foreground"
                }`}
              >
                {language === "en" ? cat.labelEn : cat.labelNe}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
            <input
              type="text"
              placeholder="सामान खोज्नुहोस्..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border-theme rounded-xl text-xs focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => {
            const hasSale = !!product.salePrice && product.salePrice < product.price;
            const isFlipped = flippedCardId === product.id;

            return (
              <div
                key={product.id}
                className="group [perspective:1000px] h-[430px]"
              >
                <div 
                  className={`relative w-full h-full rounded-3xl transition-all duration-700 [transform-style:preserve-3d] shadow-sm hover:shadow-xl ${
                    isFlipped ? "[transform:rotateY(180deg)]" : ""
                  }`}
                >
                  {/* FRONT SIDE */}
                  <div className="absolute inset-0 w-full h-full rounded-3xl bg-card border border-border-theme overflow-hidden flex flex-col justify-between [backface-visibility:hidden]">
                    {/* Image Area */}
                    <div className="relative h-48 bg-muted-area overflow-hidden">
                      <Link to={`/store/product/${product.id}`} className="block w-full h-full">
                        <img
                          src={product.images?.[0] || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=600"}
                          alt={product.nameNepali}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                      {hasSale && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-red-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                          छुट (OFFER)
                        </span>
                      )}
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-card/80 backdrop-blur-md border border-border-theme text-[10px] font-black uppercase tracking-wider text-muted-text">
                        {product.category}
                      </span>
                      {/* Flip Hint Button on Image */}
                      <button
                        onClick={(e) => toggleFlip(product.id, e)}
                        className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-xl bg-card/90 backdrop-blur-md border border-border-theme text-foreground text-[10px] font-black uppercase tracking-wider flex items-center gap-1 hover:bg-primary hover:text-white transition-all shadow-md cursor-pointer"
                        title="3D विवरण फ्लिप गर्नुहोस्"
                      >
                        <RotateCw size={12} className="text-primary group-hover:text-white transition-colors" />
                        <span>विवरण फ्लिप (3D)</span>
                      </button>
                    </div>

                    {/* Content Area */}
                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                          <Star size={12} className="fill-amber-500" />
                          <span>{product.rating}</span>
                          <span className="text-muted-text font-normal">({product.reviewCount})</span>
                          {product.authorOrMaker && (
                            <span className="text-muted-text font-normal text-[11px] ml-auto truncate">
                              by {product.authorOrMaker}
                            </span>
                          )}
                        </div>
                        <Link to={`/store/product/${product.id}`} className="block">
                          <h3 className="text-sm font-bold text-card-foreground line-clamp-2 hover:text-primary transition-colors cursor-pointer">
                            {language === "en" ? product.name : product.nameNepali}
                          </h3>
                        </Link>
                        <p className="text-xs text-muted-text line-clamp-2">
                          {language === "en" ? product.description : product.descriptionNepali}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-border-theme flex items-center justify-between gap-2">
                        <div>
                          <span className="text-xs text-muted-text">मूल्य:</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-black text-primary">
                              रु. {product.salePrice || product.price}
                            </span>
                            {hasSale && (
                              <span className="text-xs text-muted-text line-through">
                                रु. {product.price}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => toggleFlip(product.id, e)}
                            className="p-2 rounded-xl bg-muted-area hover:bg-primary/10 text-muted-text hover:text-primary border border-border-theme transition-all cursor-pointer"
                            title="कार्ड पल्टाउनुहोस्"
                          >
                            <RotateCw size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenOrderModal(product)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <MessageCircle size={14} />
                            <span>अर्डर</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BACK SIDE (Flipped) */}
                  <div className="absolute inset-0 w-full h-full rounded-3xl bg-card border-2 border-primary/40 p-5 overflow-y-auto custom-scrollbar flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden] shadow-2xl">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-border-theme pb-2">
                        {product.isCertified ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck size={12} /> सनातन प्रामाणिक ग्यारेन्टी
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Info size={12} /> सनातन भण्डार विवरण
                          </span>
                        )}
                        <button
                          onClick={(e) => toggleFlip(product.id, e)}
                          className="p-1.5 rounded-full hover:bg-muted-area text-muted-text hover:text-card-foreground transition-all cursor-pointer"
                          title="सुल्ट्याउनुहोस्"
                        >
                          <RotateCw size={14} />
                        </button>
                      </div>

                      <div>
                        <h4 className="text-xs font-black text-primary uppercase tracking-wider">
                          {product.category} SPECIFICATIONS
                        </h4>
                        <h3 className="text-sm font-bold text-card-foreground mt-0.5">
                          {language === "en" ? product.name : product.nameNepali}
                        </h3>
                      </div>

                      <div className="space-y-2 text-xs text-card-foreground">
                        <div className="p-2.5 rounded-xl bg-muted-area/60 border border-border-theme/60 space-y-1">
                          <p className="text-xs text-muted-text leading-relaxed">
                            {language === "en" ? product.description : product.descriptionNepali}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          {product.authorOrMaker && (
                            <div className="p-2 rounded-lg bg-muted-area/40 border border-border-theme/40">
                              <span className="text-muted-text block text-[9px] uppercase font-bold">रचयिता/निर्माता:</span>
                              <span className="font-black text-card-foreground">{product.authorOrMaker}</span>
                            </div>
                          )}
                          {product.pageCount && (
                            <div className="p-2 rounded-lg bg-muted-area/40 border border-border-theme/40">
                              <span className="text-muted-text block text-[9px] uppercase font-bold">कुल पृष्ठ:</span>
                              <span className="font-black text-card-foreground">{product.pageCount} Pages</span>
                            </div>
                          )}
                          {product.fileFormat && (
                            <div className="p-2 rounded-lg bg-muted-area/40 border border-border-theme/40">
                              <span className="text-muted-text block text-[9px] uppercase font-bold">डिजिटल ढाँचा:</span>
                              <span className="font-black text-card-foreground">{product.fileFormat}</span>
                            </div>
                          )}
                          <div className="p-2 rounded-lg bg-muted-area/40 border border-border-theme/40">
                            <span className="text-muted-text block text-[9px] uppercase font-bold">उपलब्ध स्टक:</span>
                            <span className="font-black text-emerald-600">{product.stock} units (Ready)</span>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Link
                            to={`/store/product/${product.id}`}
                            className="w-full py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            <BookOpen size={13} />
                            <span>सम्पूर्ण विवरण हेर्नुहोस् (Full Details)</span>
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border-theme flex items-center justify-between gap-2 mt-2">
                      <button
                        onClick={(e) => toggleFlip(product.id, e)}
                        className="px-3 py-2 rounded-xl bg-muted-area hover:bg-card border border-border-theme text-muted-text text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCw size={12} />
                        <span>सुल्ट्याउनुहोस्</span>
                      </button>

                      <button
                        onClick={() => {
                          setFlippedCardId(null);
                          handleOpenOrderModal(product);
                        }}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                      >
                        <MessageCircle size={14} />
                        <span>अर्डर गर्नुहोस् (रु. {product.salePrice || product.price})</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* WhatsApp Order Drawer / Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border-theme rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-muted-area text-muted-text transition-all"
              >
                <X size={18} />
              </button>

              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit">
                  <MessageCircle size={12} /> WhatsApp Direct Order
                </span>
                <h3 className="text-lg font-black text-card-foreground">
                  ह्वाट्सएप मार्फत अर्डर पठाउनुहोस्
                </h3>
              </div>

              {/* Product Summary inside Modal */}
              <div className="p-4 rounded-2xl bg-muted-area/50 border border-border-theme flex items-center gap-4">
                <img
                  src={selectedProduct.images?.[0] || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200"}
                  alt={selectedProduct.nameNepali}
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <h4 className="text-xs font-bold text-card-foreground truncate">
                    {selectedProduct.nameNepali}
                  </h4>
                  <div className="text-xs font-black text-primary">
                    रु. {selectedProduct.salePrice || selectedProduct.price}
                  </div>
                </div>
              </div>

              {/* Order Form */}
              <form onSubmit={handleWhatsAppCheckout} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-card-foreground">तपाईंको नाम (Full Name) *</label>
                  <input
                    type="text"
                    required
                    placeholder="रामबहादुर श्रेष्ठ"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted-area border border-border-theme rounded-xl text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-card-foreground">फोन नम्बर (Phone) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="98XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted-area border border-border-theme rounded-xl text-xs focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-card-foreground">जिल्ला (District)</label>
                    <input
                      type="text"
                      placeholder="काठमाडौँ / पोखरा"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted-area border border-border-theme rounded-xl text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-card-foreground">परिमाण (Quantity)</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-9 h-9 rounded-xl bg-muted-area font-bold text-sm flex items-center justify-center border border-border-theme"
                    >
                      -
                    </button>
                    <span className="text-sm font-black w-6 text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-9 h-9 rounded-xl bg-muted-area font-bold text-sm flex items-center justify-center border border-border-theme"
                    >
                      +
                    </button>
                    <span className="ml-auto text-xs font-bold text-muted-text">
                      जम्मा: <span className="text-primary font-black">रु. {(selectedProduct.salePrice || selectedProduct.price) * quantity}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-card-foreground">भुक्तानी माध्यम (Payment Gateway) *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "esewa", label: "eSewa Wallet", color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" },
                      { id: "khalti", label: "Khalti Wallet", color: "bg-violet-500/10 border-violet-500/30 text-violet-600" },
                      { id: "fonepay", label: "Fonepay QR Direct", color: "bg-red-500/10 border-red-500/30 text-red-600" },
                      { id: "whatsapp", label: "WhatsApp Direct", color: "bg-amber-500/10 border-amber-500/30 text-amber-600" }
                    ].map(gw => (
                      <button
                        key={gw.id}
                        type="button"
                        onClick={() => setSelectedGateway(gw.id as any)}
                        className={`p-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer text-center ${
                          selectedGateway === gw.id
                            ? `${gw.color} ring-2 ring-primary`
                            : "bg-muted-area border-border-theme text-muted-text hover:text-foreground"
                        }`}
                      >
                        {gw.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <MessageCircle size={16} />
                  <span>ह्वाट्सएपमा अर्डर पठाउनुहोस्</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
