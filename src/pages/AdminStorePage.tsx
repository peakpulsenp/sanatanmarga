import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Copy,
  Check, 
  ArrowLeft, 
  MessageCircle, 
  Package, 
  DollarSign, 
  Truck, 
  X,
  FileText,
  BarChart3,
  RefreshCw
} from "lucide-react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import SEOHead from "@/src/components/common/SEOHead";
import { SAMPLE_PRODUCTS } from "@/src/pages/StorePage";
import type { StoreProduct, StoreOrder } from "@/src/types";
import { toast } from "sonner";
import { db } from "@/src/lib/firebase";
import { collection, getDocs, doc, updateDoc, setDoc, query, orderBy } from "@/src/lib/firebase";

export default function AdminStorePage() {
  const [products, setProducts] = useState<StoreProduct[]>(SAMPLE_PRODUCTS);
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form State
  const [formState, setFormState] = useState({
    nameNepali: "",
    name: "",
    category: "granth",
    price: 500,
    salePrice: 450,
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
    descriptionNepali: "",
    isFeatured: false,
  });

  useEffect(() => {
    fetchOrdersAndProducts();
  }, []);

  const fetchOrdersAndProducts = async () => {
    try {
      const [pRes, oRes] = await Promise.all([
        fetch("/api/store/products").then((r) => r.json()).catch(() => ({ success: false })),
        fetch("/api/store/orders").then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      if (pRes.success && Array.isArray(pRes.products) && pRes.products.length > 0) {
        setProducts(pRes.products);
      }

      if (oRes.success && Array.isArray(oRes.orders)) {
        setOrders(oRes.orders);
      } else {
        const q = query(collection(db, "commerce_orders"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const fetched: StoreOrder[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as StoreOrder));
        if (fetched.length > 0) setOrders(fetched);
      }
    } catch (err) {
      console.warn("Notice loading orders:", err);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setFormState({
      nameNepali: "",
      name: "",
      category: "granth",
      price: 500,
      salePrice: 450,
      stock: 15,
      imageUrl: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
      descriptionNepali: "",
      isFeatured: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: StoreProduct) => {
    setEditingProductId(p.id);
    setFormState({
      nameNepali: p.nameNepali || p.name,
      name: p.name || p.nameNepali,
      category: p.category || "granth",
      price: p.price,
      salePrice: p.salePrice || p.price,
      stock: p.stock,
      imageUrl: p.images?.[0] || "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
      descriptionNepali: p.descriptionNepali || p.description || "",
      isFeatured: !!p.isFeatured,
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.nameNepali) {
      toast.error("सामानको नेपाली नाम अनिवार्य छ।");
      return;
    }

    try {
      const payload = {
        id: editingProductId || undefined,
        nameNepali: formState.nameNepali,
        name: formState.name || formState.nameNepali,
        category: formState.category,
        price: Number(formState.price) || 0,
        salePrice: Number(formState.salePrice) || Number(formState.price) || 0,
        stock: Number(formState.stock) || 0,
        images: [formState.imageUrl],
        descriptionNepali: formState.descriptionNepali,
        description: formState.descriptionNepali,
        isFeatured: formState.isFeatured,
      };

      const res = await fetch("/api/store/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingProductId ? "सामान अद्यावधिक भयो!" : "नयाँ सामान थपियो!");
        setIsModalOpen(false);
        fetchOrdersAndProducts();
      } else {
        toast.error(data.error || "सामान सुरक्षित गर्न सकिएन।");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDuplicateProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/store/products/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("सामानको प्रतिलिपि (Copy) बनाइयो!");
        fetchOrdersAndProducts();
      } else {
        toast.error(data.error || "प्रतिलिपि बनाउन सकिएन।");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("के तपाईं यो सामान क्याटलगबाट हटाउन निश्चित हुनुहुन्छ?")) return;
    try {
      const res = await fetch(`/api/store/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("सामान हटाइयो!");
        fetchOrdersAndProducts();
      } else {
        toast.error(data.error || "हटाउन सकिएन।");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: StoreOrder["status"]) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    try {
      const res = await fetch(`/api/store/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`अर्डर स्थिति "${newStatus}" मा अद्यावधिक गरियो${data.restoredStock ? " (स्टक फिर्ता भयो)" : ""}`);
        fetchOrdersAndProducts();
      }
    } catch (err) {
      console.warn("Order status update notice:", err);
    }
  };

  return (
    <AdminLayout title="Sanatan Store & Commerce">
      <SEOHead title="Commerce & Store Admin - Sanatan Marga" description="Manage Sanatan Store products, inventory, and WhatsApp orders" />

      <div className="space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link to="/admin" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                <ArrowLeft size={14} /> Admin
              </Link>
              <span className="text-muted-text">•</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <ShoppingBag size={12} /> Commerce OS
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-card-foreground">
              Sanatan Store & Order Management
            </h1>
            <p className="text-xs text-muted-text">
              धार्मिक ग्रन्थ, हस्तकला, मन्दिर फ्रेम र ह्वाट्सएप अर्डर व्यवस्थापन।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Product</span>
            </button>
            <Link
              to="/admin/commerce-analytics"
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <BarChart3 size={14} />
              <span>Commerce Analytics</span>
            </Link>
            <Link
              to="/store"
              className="px-4 py-2 rounded-xl bg-card border border-border-theme text-foreground text-xs font-bold hover:bg-muted-area transition-all flex items-center gap-1.5"
            >
              <ShoppingBag size={14} />
              <span>Store Front</span>
            </Link>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-3 border-b border-border-theme pb-1">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "products"
                ? "border-primary text-primary"
                : "border-transparent text-muted-text hover:text-foreground"
            }`}
          >
            Products Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "orders"
                ? "border-primary text-primary"
                : "border-transparent text-muted-text hover:text-foreground"
            }`}
          >
            WhatsApp Orders ({orders.length})
          </button>
        </div>

        {/* Products View */}
        {activeTab === "products" && (
          <div className="space-y-4">
            <div className="border border-border-theme bg-card rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted-area/50 border-b border-border-theme text-[11px] font-black uppercase text-muted-text">
                  <tr>
                    <th className="p-4">सामान (Product)</th>
                    <th className="p-4">क्याटोगोरी</th>
                    <th className="p-4">मूल्य (Price)</th>
                    <th className="p-4">स्टक (Stock)</th>
                    <th className="p-4">स्थिति</th>
                    <th className="p-4 text-right">कार्य (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-theme">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-muted-area/30 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <img src={p.images?.[0] || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=100"} alt={p.nameNepali} className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <div className="font-bold text-card-foreground">{p.nameNepali}</div>
                          <div className="text-[10px] text-muted-text">{p.name}</div>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-muted-text uppercase text-[10px]">{p.category}</td>
                      <td className="p-4 font-black text-primary">रु. {p.salePrice || p.price}</td>
                      <td className="p-4 font-bold text-card-foreground">
                        <span className={`px-2 py-0.5 rounded-md font-mono ${p.stock < 5 ? 'bg-amber-500/10 text-amber-500 font-bold' : ''}`}>
                          {p.stock} pcs
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                          {p.stock > 0 ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            title="Edit Product"
                            className="p-1.5 rounded-lg border border-border-theme bg-muted-area/50 hover:bg-muted-area text-foreground cursor-pointer"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => handleDuplicateProduct(p.id)}
                            title="Duplicate Product"
                            className="p-1.5 rounded-lg border border-border-theme bg-muted-area/50 hover:bg-muted-area text-blue-500 cursor-pointer"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            title="Delete Product"
                            className="p-1.5 rounded-lg border border-border-theme bg-muted-area/50 hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders View */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="border border-border-theme bg-card rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted-area/50 border-b border-border-theme text-[11px] font-black uppercase text-muted-text">
                  <tr>
                    <th className="p-4">ID / मिति</th>
                    <th className="p-4">ग्राहक (Customer)</th>
                    <th className="p-4">सामान (Item)</th>
                    <th className="p-4">जम्मा रकम</th>
                    <th className="p-4">स्थिति (Status)</th>
                    <th className="p-4 text-right">अद्यावधिक</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-theme">
                  {orders.map(o => {
                    const orderKey = o.id || o.orderId || `ord-${Math.random()}`;
                    const isRecoveryOnly = o.status === "PENDING_RECOVERY" || o.storageClass === "LOCAL_RECOVERY_ONLY";
                    return (
                      <tr key={orderKey} className="hover:bg-muted-area/30 transition-colors">
                        <td className="p-4 font-mono text-muted-text">
                          <div className="flex items-center gap-1.5">
                            <span>{orderKey}</span>
                            {isRecoveryOnly && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                                Local Only
                              </span>
                            )}
                          </div>
                          <div className="text-[10px]">{new Date(o.createdAt || Date.now()).toLocaleDateString()}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-card-foreground">{o.customerName}</div>
                          <div className="text-[10px] text-muted-text">{o.customerPhone || o.phone} • {o.address || o.district}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold">{o.productName}</div>
                          <div className="text-[10px] text-muted-text">परिमाण: {o.quantity}</div>
                        </td>
                        <td className="p-4 font-black text-primary">रु. {o.totalPrice}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            o.status === "confirmed" ? "bg-blue-500/10 text-blue-500" :
                            o.status === "delivered" ? "bg-emerald-500/10 text-emerald-500" :
                            o.status === "cancelled" ? "bg-rose-500/10 text-rose-500" :
                            o.status === "PENDING_RECOVERY" ? "bg-amber-500/20 text-amber-600 border border-amber-500/30" :
                            "bg-amber-500/10 text-amber-500"
                          }`}>
                            {o.status === "PENDING_RECOVERY" ? "Pending Recovery" : o.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(orderKey, e.target.value as any)}
                            className="px-2 py-1 bg-muted-area border border-border-theme rounded-lg text-[10px] font-bold"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled (Restore Stock)</option>
                            {isRecoveryOnly && <option value="PENDING_RECOVERY">Pending Recovery</option>}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Product Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border-theme rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border-theme pb-3">
                <h3 className="text-lg font-black text-card-foreground">
                  {editingProductId ? "सामान सम्पादन गर्नुहोस् (Edit Product)" : "नयाँ सामान थप्नुहोस् (Add Product)"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-text hover:text-foreground cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-muted-text">नेपाली नाम (Nepali Title)*</label>
                  <input
                    type="text"
                    required
                    value={formState.nameNepali}
                    onChange={(e) => setFormState({ ...formState, nameNepali: e.target.value })}
                    placeholder="उदा: श्रीमद्भगवद्गीता (नेपाली व्याख्या)"
                    className="w-full px-3 py-2 bg-muted-area border border-border-theme rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-text">क्याटोगोरी (Category)</label>
                    <select
                      value={formState.category}
                      onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                      className="w-full px-3 py-2 bg-muted-area border border-border-theme rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="granth">धार्मिक ग्रन्थ (Books)</option>
                      <option value="handicraft">हस्तकला (Handicrafts)</option>
                      <option value="framed">मन्दिर फ्रेम (Frames)</option>
                      <option value="mala">रुद्राक्ष र माला (Mala)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-muted-text">स्टक परिमाण (Stock)*</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formState.stock}
                      onChange={(e) => setFormState({ ...formState, stock: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-muted-area border border-border-theme rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-text">अंक्य मूल्य (Price रु.)*</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formState.price}
                      onChange={(e) => setFormState({ ...formState, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-muted-area border border-border-theme rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-muted-text">बिक्री मूल्य (Sale Price रु.)</label>
                    <input
                      type="number"
                      min={0}
                      value={formState.salePrice}
                      onChange={(e) => setFormState({ ...formState, salePrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-muted-area border border-border-theme rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-text">तस्बिर URL (Image Link)</label>
                  <input
                    type="url"
                    required
                    value={formState.imageUrl}
                    onChange={(e) => setFormState({ ...formState, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-muted-area border border-border-theme rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-text">विवरण (Nepali Description)</label>
                  <textarea
                    rows={2}
                    value={formState.descriptionNepali}
                    onChange={(e) => setFormState({ ...formState, descriptionNepali: e.target.value })}
                    placeholder="सामानको विशेषता र विवरण लेख्नुहोस्..."
                    className="w-full px-3 py-2 bg-muted-area border border-border-theme rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition-all cursor-pointer shadow-md shadow-primary/20"
                  >
                    {editingProductId ? "अद्यावधिक गर्नुहोस् (Update)" : "सुरक्षित गर्नुहोस् (Save Product)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme font-bold text-xs text-muted-text hover:text-foreground cursor-pointer"
                  >
                    रद्द (Cancel)
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

