import { useState } from "react";
import { AdvertiserProfile } from "@/src/types";
import { advertiserRegistry } from "@/src/services/advertiserRegistry";
import { Building2, Plus, Search, CheckCircle2, XCircle, Phone, Mail, MapPin, FileText, Edit, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function AdvertiserManagementModule() {
  const [advertisers, setAdvertisers] = useState<AdvertiserProfile[]>(() => advertiserRegistry.getAdvertisers());
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<AdvertiserProfile>>({
    legalName: "",
    displayName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    pan: "",
    vatNumber: "",
    billingAddress: "",
    paymentTerms: "net30",
    status: "active"
  });

  const filtered = advertisers.filter(a => 
    a.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.pan.includes(searchQuery)
  );

  const handleOpenModal = (adv?: AdvertiserProfile) => {
    if (adv) {
      setEditingId(adv.id);
      setFormData(adv);
    } else {
      setEditingId(null);
      setFormData({
        legalName: "",
        displayName: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        pan: "",
        vatNumber: "",
        billingAddress: "",
        paymentTerms: "net30",
        status: "active"
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.legalName || !formData.pan) {
      toast.error("कृपया संस्थाको कानुनी नाम र PAN नम्बर अनिवार्य प्रविष्ट गर्नुहोस्।");
      return;
    }

    if (editingId) {
      advertiserRegistry.updateAdvertiser(editingId, formData);
      toast.success("विज्ञापनदाता विवरण सफलतापुर्वक अद्यावधिक गरियो।");
    } else {
      advertiserRegistry.addAdvertiser(formData as any);
      toast.success("नयाँ विज्ञापनदाता सफलतापुर्वक दर्ता गरियो।");
    }

    setAdvertisers(advertiserRegistry.getAdvertisers());
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border-theme shadow-xs">
        <div>
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <span>विज्ञापनदाता पञ्जिका (Advertiser Master Registry)</span>
          </h2>
          <p className="text-xs text-muted-text">
            प्रमाणित संस्थागत विज्ञापनदाता, PAN/VAT कर पहिचान र भुक्तानी सर्तहरूको व्यवस्थापन।
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black flex items-center gap-2 shadow-xs hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>नयाँ विज्ञापनदाता दर्ता</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-text" />
        <input
          type="text"
          placeholder="विज्ञापनदाताको नाम, कानुनी नाम वा PAN नम्बर खोज्नुहोस्..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-theme bg-card text-foreground text-xs font-medium focus:outline-hidden focus:border-primary"
        />
      </div>

      {/* Advertisers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((adv) => (
          <div key={adv.id} className="p-5 rounded-2xl bg-card border border-border-theme shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xxs uppercase tracking-wider text-rose-600 dark:text-rose-400 font-bold">
                    ID: {adv.id}
                  </span>
                  <h3 className="text-sm font-black text-foreground">{adv.displayName}</h3>
                  <p className="text-xs text-muted-text">{adv.legalName}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                  adv.status === "active" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-gray-500/15 text-gray-700 dark:text-gray-300"
                }`}>
                  {adv.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-muted-text border-t border-b border-border-theme py-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-muted-text shrink-0" />
                  <span>PAN: <strong className="text-foreground">{adv.pan}</strong></span>
                  {adv.vatNumber && <span className="text-xxs px-1.5 py-0.5 rounded-md bg-muted-area text-foreground">VAT Registered</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-muted-text shrink-0" />
                  <span>{adv.phone} ({adv.contactPerson})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-muted-text shrink-0" />
                  <span className="truncate">{adv.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-muted-text shrink-0" />
                  <span className="truncate">{adv.address}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-xxs text-muted-text">सर्त: <strong className="text-foreground uppercase">{adv.paymentTerms}</strong></span>
              <button
                onClick={() => handleOpenModal(adv)}
                className="px-3 py-1.5 rounded-lg bg-muted-area hover:bg-muted-area/80 text-foreground font-bold flex items-center gap-1 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>सम्पादन</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border-theme rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-black text-foreground">
              {editingId ? "विज्ञापनदाता सम्पादन गर्नुहोस्" : "नयाँ विज्ञापनदाता दर्ता गर्नुहोस्"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">संस्थाको कानुनी नाम (Legal Entity Name) *</label>
                <input
                  type="text"
                  required
                  placeholder="उदा: एनसेल एक्सियाटा लिमिटेड"
                  value={formData.legalName || ""}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border-theme bg-muted-area/50 text-foreground font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">प्रदर्शन नाम (Display Name)</label>
                  <input
                    type="text"
                    placeholder="उदा: Ncell"
                    value={formData.displayName || ""}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border-theme bg-muted-area/50 text-foreground font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">PAN नम्बर *</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा: 300123456"
                    value={formData.pan || ""}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border-theme bg-muted-area/50 text-foreground font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">सम्पर्क व्यक्ति (Contact Person)</label>
                  <input
                    type="text"
                    placeholder="उदा: सुमन अधिकारी"
                    value={formData.contactPerson || ""}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border-theme bg-muted-area/50 text-foreground font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">फोन नम्बर</label>
                  <input
                    type="text"
                    placeholder="उदा: +977-1-4445555"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border-theme bg-muted-area/50 text-foreground font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">इमेल ठेगाना</label>
                <input
                  type="email"
                  placeholder="corporate@ncell.com.np"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border-theme bg-muted-area/50 text-foreground font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">ठेगाना</label>
                <input
                  type="text"
                  placeholder="एकान्तकुना, ललितपुर"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border-theme bg-muted-area/50 text-foreground font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-theme">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-muted-area hover:bg-muted-area/80 text-foreground font-bold"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black shadow-xs"
                >
                  सुरक्षित गर्नुहोस्
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
