import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ShoppingBag, 
  TrendingUp, 
  DollarSign, 
  MapPin, 
  Package, 
  Users, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  BarChart3, 
  PieChart, 
  RefreshCw,
  Truck,
  Filter,
  Download
} from "lucide-react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import SEOHead from "@/src/components/common/SEOHead";
import { db } from "@/src/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "@/src/lib/firebase";
import type { StoreOrder, StoreProduct } from "@/src/types";
import { SAMPLE_PRODUCTS } from "@/src/pages/StorePage";
import { toast } from "sonner";

export default function AdminCommerceAnalytics() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [products] = useState<StoreProduct[]>(SAMPLE_PRODUCTS);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/store/orders");
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        // Fallback to Firestore commerce_orders
        const q = query(collection(db, "commerce_orders"), orderBy("createdAt", "desc"), limit(200));
        const snap = await getDocs(q);
        const fetched: StoreOrder[] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoreOrder));
        setOrders(fetched);
      }
    } catch (err) {
      console.error("Error fetching commerce orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Metrics Calculations
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const confirmedOrders = orders.filter(o => o.status === "confirmed").length;
  const shippedOrders = orders.filter(o => o.status === "shipped").length;
  const deliveredOrders = orders.filter(o => o.status === "delivered").length;

  // District Demand Breakdown
  const districtCounts: Record<string, { count: number; totalAmt: number }> = {};
  orders.forEach(o => {
    const d = o.district || "काठमाडौँ";
    if (!districtCounts[d]) districtCounts[d] = { count: 0, totalAmt: 0 };
    districtCounts[d].count += 1;
    districtCounts[d].totalAmt += o.totalPrice || 0;
  });

  const sortedDistricts = Object.entries(districtCounts).sort((a, b) => b[1].totalAmt - a[1].totalAmt);

  // Best Sellers Breakdown
  const productSales: Record<string, { name: string; count: number; revenue: number }> = {};
  orders.forEach(o => {
    const pName = o.productName || "अज्ञात सामान";
    if (!productSales[pName]) productSales[pName] = { name: pName, count: 0, revenue: 0 };
    productSales[pName].count += o.quantity || 1;
    productSales[pName].revenue += o.totalPrice || 0;
  });

  const topSellers = Object.values(productSales).sort((a, b) => b.revenue - a.revenue);

  // Low Stock Items (< 5)
  const lowStockItems = products.filter(p => p.stock < 5);

  return (
    <AdminLayout title="Commerce Analytics OS">
      <SEOHead title="Commerce Analytics - Sanatan Marga Admin" description="Sanatan Store revenue analytics, district demand, and order performance" />

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link to="/admin/store" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                <ArrowLeft size={14} /> Store Admin
              </Link>
              <span className="text-muted-text">•</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <BarChart3 size={12} /> Analytics OS
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-card-foreground">
              Sanatan Store Commerce Analytics
            </h1>
            <p className="text-xs text-muted-text">
              अर्डर प्रवाह, राजस्व (Revenue), जिल्ला अनुसार माग (District Demand) र स्टक विश्लेषण।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              className="px-3.5 py-2 rounded-xl bg-muted-area text-foreground border border-border-theme text-xs font-bold hover:bg-muted-area/80 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>रिफ्रेस</span>
            </button>
            <Link
              to="/admin/store"
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
            >
              <ShoppingBag size={14} />
              <span>अर्डर र स्टोर व्यवस्थापन</span>
            </Link>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-card border border-border-theme rounded-2xl shadow-sm space-y-2">
            <div className="flex items-center justify-between text-muted-text">
              <span className="text-xs font-bold uppercase tracking-wider">कुल राजस्व (Revenue)</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <DollarSign size={18} />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              रु. {totalRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-muted-text">औसत अर्डर मूल्य: <span className="font-bold text-foreground">रु. {avgOrderValue}</span></div>
          </div>

          <div className="p-5 bg-card border border-border-theme rounded-2xl shadow-sm space-y-2">
            <div className="flex items-center justify-between text-muted-text">
              <span className="text-xs font-bold uppercase tracking-wider">कुल अर्डर सङ्ख्या</span>
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                <ShoppingBag size={18} />
              </div>
            </div>
            <div className="text-3xl font-black text-card-foreground">
              {totalOrders}
            </div>
            <div className="text-[11px] text-muted-text">ह्वाट्सएप मार्फत दर्ता भएका अर्डरहरू</div>
          </div>

          <div className="p-5 bg-card border border-border-theme rounded-2xl shadow-sm space-y-2">
            <div className="flex items-center justify-between text-muted-text">
              <span className="text-xs font-bold uppercase tracking-wider">बाँकी अर्डर (Pending)</span>
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                <Clock size={18} />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-500">
              {pendingOrders}
            </div>
            <div className="text-[11px] text-muted-text">पुष्टि गर्न बाँकी ह्वाट्सएप अर्डरहरू</div>
          </div>

          <div className="p-5 bg-card border border-border-theme rounded-2xl shadow-sm space-y-2">
            <div className="flex items-center justify-between text-muted-text">
              <span className="text-xs font-bold uppercase tracking-wider">सफल सम्प्रेषण (Delivered)</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <CheckCircle size={18} />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-500">
              {deliveredOrders + confirmedOrders}
            </div>
            <div className="text-[11px] text-muted-text">पुष्टि / डेलिभर भइसकेका अर्डरहरू</div>
          </div>
        </div>

        {/* Middle Section: Best Sellers & District Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Selling Products */}
          <div className="bg-card border border-border-theme rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border-theme pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                <h2 className="text-base font-black text-card-foreground">उत्कृष्ट बिक्री हुने सामग्री (Best Sellers)</h2>
              </div>
              <span className="text-xs font-bold text-muted-text">राजस्व अनुसार</span>
            </div>

            {topSellers.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-text">अहिलेसम्म अर्डर प्राप्त भएको छैन।</div>
            ) : (
              <div className="space-y-3">
                {topSellers.slice(0, 5).map((seller, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-muted-area/40 border border-border-theme/60">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-xs text-card-foreground">{seller.name}</div>
                        <div className="text-[10px] text-muted-text">बिक्री परिमाण: {seller.count} वटा</div>
                      </div>
                    </div>
                    <div className="text-right font-black text-xs text-emerald-600 dark:text-emerald-400">
                      रु. {seller.revenue.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* District Demand Heatmap List */}
          <div className="bg-card border border-border-theme rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border-theme pb-4">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-primary" />
                <h2 className="text-base font-black text-card-foreground">जिल्ला अनुसार अर्डर माग (District Demand)</h2>
              </div>
              <span className="text-xs font-bold text-muted-text">नेपाल हब Commerce</span>
            </div>

            {sortedDistricts.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-text">जिल्ला अर्डर डेटा उपलब्ध छैन।</div>
            ) : (
              <div className="space-y-3">
                {sortedDistricts.slice(0, 5).map(([dist, data], idx) => (
                  <div key={dist} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-card-foreground flex items-center gap-1.5">
                        <MapPin size={12} className="text-primary" /> {dist}
                      </span>
                      <span className="text-muted-text font-mono">
                        {data.count} अर्डर • रु. {data.totalAmt.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-muted-area rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.max(15, (data.totalAmt / totalRevenue) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Inventory Stock Warning & Customer Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Low Stock Alerts */}
          <div className="lg:col-span-1 bg-card border border-border-theme rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border-theme pb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                <h2 className="text-sm font-black text-card-foreground">कम स्टक चेतावनी (Low Stock)</h2>
              </div>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-2">
                <CheckCircle size={16} /> सबै सामानको स्टक पर्याप्त छ।
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map(item => (
                  <div key={item.id} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-card-foreground">{item.nameNepali}</div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">स्टक बाँकी: {item.stock} वटा</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[9px] font-black uppercase">
                      री-अर्डर गर्नुहोस्
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders List */}
          <div className="lg:col-span-2 bg-card border border-border-theme rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border-theme pb-4">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-primary" />
                <h2 className="text-sm font-black text-card-foreground">हालैका ह्वाट्सएप अर्डरहरू</h2>
              </div>
              <span className="text-xs font-bold text-muted-text">नयाँ अर्डरहरू</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted-area/50 text-[10px] uppercase font-black text-muted-text border-b border-border-theme">
                  <tr>
                    <th className="p-3">अर्डर ID</th>
                    <th className="p-3">ग्राहक</th>
                    <th className="p-3">सामान</th>
                    <th className="p-3">जम्मा रकम</th>
                    <th className="p-3">स्थिति</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-theme">
                  {orders.slice(0, 5).map(o => (
                    <tr key={o.id} className="hover:bg-muted-area/30 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-muted-text">{o.id}</td>
                      <td className="p-3">
                        <div className="font-bold text-card-foreground">{o.customerName}</div>
                        <div className="text-[10px] text-muted-text">{o.phone} • {o.district}</div>
                      </td>
                      <td className="p-3 font-bold">{o.productName} ({o.quantity})</td>
                      <td className="p-3 font-black text-emerald-600 dark:text-emerald-400">रु. {o.totalPrice}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          o.status === "confirmed" || o.status === "delivered" 
                            ? "bg-emerald-500/10 text-emerald-500" 
                            : "bg-amber-500/10 text-amber-500"
                        }`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
