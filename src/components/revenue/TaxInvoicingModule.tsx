import { useState } from "react";
import { 
  SAMPLE_TAX_INVOICES, 
  TaxInvoiceRecord 
} from "@/src/constants/revenueInventory";
import { 
  Printer, 
  FileText, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Download, 
  Building2, 
  CreditCard,
  Percent,
  Receipt,
  Eye,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

export default function TaxInvoicingModule() {
  const [invoices, setInvoices] = useState<TaxInvoiceRecord[]>(SAMPLE_TAX_INVOICES);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<TaxInvoiceRecord | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Invoice Form State
  const [newAdvName, setNewAdvName] = useState("");
  const [newAdvPan, setNewAdvPan] = useState("");
  const [newAdvAddress, setNewAdvAddress] = useState("");
  const [newCampaignTitle, setNewCampaignTitle] = useState("");
  const [newTaxableAmount, setNewTaxableAmount] = useState(50000);
  const [newDueDate, setNewDueDate] = useState("2026-09-15");

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === "all" || inv.paymentStatus === statusFilter;
    const matchesSearch =
      inv.advertiserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.advertiserPan.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  // Financial summary
  const summary = invoices.reduce(
    (acc, inv) => {
      acc.totalTaxable += inv.taxableAmountNpr;
      acc.totalVat += inv.vatAmountNpr;
      acc.totalGross += inv.totalPayableNpr;
      if (inv.paymentStatus === "paid") acc.collected += inv.totalPayableNpr;
      else acc.pending += inv.totalPayableNpr;
      return acc;
    },
    { totalTaxable: 0, totalVat: 0, totalGross: 0, collected: 0, pending: 0 }
  );

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdvPan || newAdvPan.length !== 9 || !/^\d+$/.test(newAdvPan)) {
      toast.error("कृपया ९-अङ्कको वैध स्थायी लेखा नम्बर (PAN) प्रविष्ट गर्नुहोस्!");
      return;
    }

    const vatAmount = Math.round(newTaxableAmount * 0.13);
    const tdsAmount = Math.round(newTaxableAmount * 0.015);
    const totalPayable = newTaxableAmount + vatAmount;

    const newRec: TaxInvoiceRecord = {
      id: `inv-2083-${(invoices.length + 1).toString().padStart(3, "0")}`,
      invoiceNumber: `SM-INV-2083-0${146 + invoices.length}`,
      advertiserId: `adv-${Date.now()}`,
      advertiserName: newAdvName,
      advertiserPan: newAdvPan,
      advertiserAddress: newAdvAddress || "काठमाडौँ, नेपाल",
      campaignTitle: newCampaignTitle,
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: newDueDate,
      taxableAmountNpr: newTaxableAmount,
      vatRatePct: 13,
      vatAmountNpr: vatAmount,
      tdsRatePct: 1.5,
      tdsAmountNpr: tdsAmount,
      totalPayableNpr: totalPayable,
      netReceivableNpr: totalPayable - tdsAmount,
      paymentStatus: "unpaid",
      notes: "नयाँ विज्ञापन सम्झौता बीजक।"
    };

    setInvoices([newRec, ...invoices]);
    toast.success(`बीजक नं. ${newRec.invoiceNumber} सफलतापूर्वक जारी भयो!`);
    setShowCreateModal(false);
    setNewAdvName("");
    setNewAdvPan("");
    setNewCampaignTitle("");
  };

  const handleUpdateStatus = (invId: string, newStatus: any) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === invId ? { ...i, paymentStatus: newStatus } : i))
    );
    toast.success("भुक्तानी स्थिति अद्यावधिक गरियो!");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted-area/40 border border-border-theme p-5 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xxs font-black uppercase tracking-wider border border-emerald-500/20">
              Inland Revenue Department (IRD) Compliant
            </span>
            <span className="text-xxs font-bold text-muted-text">
              • १३% भ्याट तथा १.५% टीडीएस बिलिङ प्रणाली
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-black text-card-foreground">
            कर बीजक तथा भुक्तानी व्यवस्थापन (Tax Invoices & VAT Ledger)
          </h2>
          <p className="text-xs text-muted-text max-w-2xl">
            नेपाल सरकारको आन्तरिक राजस्व विभागको मापदण्ड अनुसार PAN प्रमाणित बीजक जारी, भ्याट हिसाब र भुक्तानी ट्र्याकिङ।
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={16} /> नयाँ कर बीजक जारी (Issue Tax Invoice)
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border-theme rounded-3xl p-4 shadow-sm space-y-1">
          <div className="flex justify-between text-muted-text text-xxs font-bold uppercase">
            <span>कुल करयोग्य कारोबार</span>
            <Receipt size={16} className="text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-card-foreground font-mono">
            रू {summary.totalTaxable.toLocaleString("ne-NP")}
          </div>
          <p className="text-xxs text-muted-text font-bold">मापन गरिएको (Actual Billed)</p>
        </div>

        <div className="bg-card border border-border-theme rounded-3xl p-4 shadow-sm space-y-1">
          <div className="flex justify-between text-muted-text text-xxs font-bold uppercase">
            <span>१३% भ्याट सङ्कलन (VAT)</span>
            <Percent size={16} className="text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-600 font-mono">
            रू {summary.totalVat.toLocaleString("ne-NP")}
          </div>
          <p className="text-xxs text-muted-text font-bold">आन्तरिक राजस्व विभाग दाखिला</p>
        </div>

        <div className="bg-card border border-border-theme rounded-3xl p-4 shadow-sm space-y-1">
          <div className="flex justify-between text-muted-text text-xxs font-bold uppercase">
            <span>प्राप्त भइसकेको (Collected)</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
            रू {summary.collected.toLocaleString("ne-NP")}
          </div>
          <p className="text-xxs text-emerald-600 font-bold">प्रमाणित बैंक / वालेट भुक्तानी</p>
        </div>

        <div className="bg-card border border-border-theme rounded-3xl p-4 shadow-sm space-y-1">
          <div className="flex justify-between text-muted-text text-xxs font-bold uppercase">
            <span>बाँकी बक्यौता (Receivable)</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 font-mono">
            रू {summary.pending.toLocaleString("ne-NP")}
          </div>
          <p className="text-xxs text-amber-600 font-bold">भुक्तानी बाँकी बीजकहरू</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: "all", label: "सबै बीजक (All Invoices)" },
            { id: "paid", label: "भुक्तानी सम्पन्न (Paid)" },
            { id: "unpaid", label: "भुक्तानी बाँकी (Unpaid)" },
            { id: "overdue", label: "म्याद नाघेको (Overdue)" }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === f.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted-area/60 text-muted-text hover:text-card-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative flex items-center bg-muted-area/50 border border-border-theme rounded-xl px-3 py-1.5 w-full sm:w-72">
          <Search size={14} className="text-muted-text mr-2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="PAN, संस्था वा बीजक नं..."
            className="bg-transparent text-xs font-medium text-card-foreground placeholder:text-muted-foreground focus:outline-none w-full"
          />
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-card border border-border-theme rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted-area/50 text-muted-text font-black uppercase text-xxs tracking-wider border-b border-border-theme">
              <tr>
                <th className="p-4">बीजक नं / मिति</th>
                <th className="p-4">विज्ञापनदाता / PAN</th>
                <th className="p-4">अभियान विवरण</th>
                <th className="p-4">करयोग्य रकम</th>
                <th className="p-4">१३% भ्याट</th>
                <th className="p-4">कुल रकम (Payable)</th>
                <th className="p-4">भुक्तानी स्थिति</th>
                <th className="p-4 text-right">कार्य</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme">
              {filteredInvoices.map((inv) => {
                const isPaid = inv.paymentStatus === "paid";
                const isOverdue = inv.paymentStatus === "overdue";
                return (
                  <tr key={inv.id} className="hover:bg-muted-area/20 transition-colors">
                    <td className="p-4 space-y-0.5">
                      <div className="font-mono font-black text-card-foreground">{inv.invoiceNumber}</div>
                      <div className="text-[10px] text-muted-text">जारी: {inv.invoiceDate}</div>
                    </td>
                    <td className="p-4 space-y-0.5">
                      <div className="font-black text-card-foreground line-clamp-1">{inv.advertiserName}</div>
                      <div className="text-xxs font-mono text-muted-text">PAN: {inv.advertiserPan}</div>
                    </td>
                    <td className="p-4 text-muted-text font-medium max-w-xs line-clamp-1">
                      {inv.campaignTitle}
                    </td>
                    <td className="p-4 font-mono font-bold text-card-foreground">
                      रू {inv.taxableAmountNpr.toLocaleString("ne-NP")}
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-600">
                      रू {inv.vatAmountNpr.toLocaleString("ne-NP")}
                    </td>
                    <td className="p-4 font-mono font-black text-card-foreground">
                      रू {inv.totalPayableNpr.toLocaleString("ne-NP")}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-xxs font-black px-2.5 py-0.5 rounded-full border ${
                        isPaid
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : isOverdue
                          ? "bg-red-500/10 text-red-600 border-red-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }`}>
                        {isPaid ? "भुक्तानी सम्पन्न" : isOverdue ? "म्याद नाघेको" : "बाँकी"}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-2.5 py-1 bg-muted-area hover:bg-card-foreground hover:text-card rounded-lg text-xxs font-black transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye size={12} /> हेर्नुहोस्
                      </button>
                      {!isPaid && (
                        <button
                          onClick={() => handleUpdateStatus(inv.id, "paid")}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xxs font-black hover:bg-emerald-700 transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} /> भुक्तानी प्रमाणित
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE INVOICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border-theme rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-theme pb-4">
              <h2 className="text-lg font-black text-card-foreground">
                नयाँ कर बीजक जारी गर्नुहोस् (Issue Tax Invoice)
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg bg-muted-area text-muted-text hover:text-card-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-card-foreground block">विज्ञापनदाता संस्थाको नाम *</label>
                <input
                  type="text"
                  required
                  value={newAdvName}
                  onChange={(e) => setNewAdvName(e.target.value)}
                  placeholder="उदा: नेपाल टेलिकम, डाबर नेपाल..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-card-foreground block">स्थायी लेखा नम्बर (९-अङ्क PAN) *</label>
                  <input
                    type="text"
                    required
                    maxLength={9}
                    value={newAdvPan}
                    onChange={(e) => setNewAdvPan(e.target.value)}
                    placeholder="उदा: 300054210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-card-foreground block">ठेगाना (Address)</label>
                  <input
                    type="text"
                    value={newAdvAddress}
                    onChange={(e) => setNewAdvAddress(e.target.value)}
                    placeholder="उदा: कमलादी, काठमाडौँ"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-card-foreground block">अभियान शीर्षक / प्रयोजन *</label>
                <input
                  type="text"
                  required
                  value={newCampaignTitle}
                  onChange={(e) => setNewCampaignTitle(e.target.value)}
                  placeholder="उदा: भाद्र महिनाको गृह पृष्ठ ब्यानर तथा स्पोन्सर"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-card-foreground block">करयोग्य रकम (NPR) *</label>
                  <input
                    type="number"
                    required
                    value={newTaxableAmount}
                    onChange={(e) => setNewTaxableAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-card-foreground block">भुक्तानी अन्तिम मिति (Due Date)</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* Automatic Calculation Preview */}
              <div className="p-3.5 rounded-2xl bg-muted-area/40 border border-border-theme space-y-1.5 text-xxs font-bold">
                <div className="flex justify-between text-muted-text">
                  <span>करयोग्य रकम (Taxable):</span>
                  <span className="font-mono">रू {newTaxableAmount.toLocaleString("ne-NP")}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>१३% मूल्य अभिवृद्धि कर (VAT):</span>
                  <span className="font-mono">+ रू {Math.round(newTaxableAmount * 0.13).toLocaleString("ne-NP")}</span>
                </div>
                <div className="flex justify-between text-card-foreground font-black pt-1 border-t border-border-theme">
                  <span>कुल बीजक रकम (Grand Total):</span>
                  <span className="font-mono text-xs text-emerald-600">रू {Math.round(newTaxableAmount * 1.13).toLocaleString("ne-NP")}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-theme">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-muted-area text-muted-text font-bold cursor-pointer"
                >
                  रद्द
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md cursor-pointer"
                >
                  बीजक जारी गर्नुहोस्
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE OFFICIAL VAT INVOICE MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card text-card-foreground border border-border-theme rounded-3xl p-6 sm:p-10 max-w-2xl w-full space-y-6 shadow-2xl my-8">
            
            {/* Header / Actions */}
            <div className="flex items-center justify-between border-b border-border-theme pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full border border-emerald-500/20">
                  आधिकारिक कर बीजक (Official Tax Invoice)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm hover:opacity-90"
                >
                  <Printer size={14} /> प्रिन्ट गर्नुहोस् (Print)
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2 rounded-xl bg-muted-area text-muted-text hover:text-card-foreground cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* TAX INVOICE BODY (Nepal IRD Standard Layout) */}
            <div className="space-y-6 text-xs font-sans">
              
              {/* Publisher Header */}
              <div className="text-center space-y-1 border-b border-border-theme pb-4">
                <h1 className="text-xl sm:text-2xl font-black text-card-foreground tracking-tight">
                  सनातन मार्ग डिजिटल मिडिया प्रा. लि.
                </h1>
                <p className="text-xs text-muted-text">
                  SanatanMarga Digital Media Pvt. Ltd. | काठमाडौँ, नेपाल
                </p>
                <div className="flex items-center justify-center gap-4 text-xxs font-mono font-bold text-muted-text pt-1">
                  <span>स्थायी लेखा नं (PAN): <strong className="text-card-foreground">609841253</strong></span>
                  <span>•</span>
                  <span>मूल्य अभिवृद्धि कर दर्ता नं: <strong className="text-card-foreground">609841253</strong></span>
                </div>
                <div className="inline-block mt-2 px-3 py-0.5 border border-border-theme rounded text-[11px] font-black uppercase">
                  कर बीजक (TAX INVOICE)
                </div>
              </div>

              {/* Invoice Meta Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-muted-area/30 border border-border-theme text-xs">
                <div className="space-y-1">
                  <div><span className="text-muted-text">बीजक नं (Invoice No):</span> <strong className="font-mono">{selectedInvoice.invoiceNumber}</strong></div>
                  <div><span className="text-muted-text">जारी मिति (Date):</span> <strong className="font-mono">{selectedInvoice.invoiceDate}</strong></div>
                  <div><span className="text-muted-text">भुक्तानी म्याद (Due Date):</span> <strong className="font-mono">{selectedInvoice.dueDate}</strong></div>
                </div>
                <div className="space-y-1">
                  <div><span className="text-muted-text">खरिदकर्ता (Buyer):</span> <strong>{selectedInvoice.advertiserName}</strong></div>
                  <div><span className="text-muted-text">खरिदकर्ता PAN नं:</span> <strong className="font-mono text-emerald-600">{selectedInvoice.advertiserPan}</strong></div>
                  <div><span className="text-muted-text">ठेगाना (Address):</span> <span>{selectedInvoice.advertiserAddress}</span></div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-border-theme rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted-area text-muted-text font-black text-xxs uppercase">
                    <tr>
                      <th className="p-3">क्र.सं</th>
                      <th className="p-3">विवरण (Description)</th>
                      <th className="p-3 text-right">रकम (NPR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-theme">
                    <tr>
                      <td className="p-3 font-mono">१</td>
                      <td className="p-3">
                        <div className="font-bold text-card-foreground">{selectedInvoice.campaignTitle}</div>
                        <div className="text-[10px] text-muted-text">डिजिटल विज्ञापन तथा प्रायोजन सेवा (Digital Advertising Services)</div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-card-foreground">
                        रू {selectedInvoice.taxableAmountNpr.toLocaleString("ne-NP")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tax Calculations Summary */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-text font-bold">
                    <span>करयोग्य रकम (Taxable Amount):</span>
                    <span className="font-mono">रू {selectedInvoice.taxableAmountNpr.toLocaleString("ne-NP")}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>१३% मूल्य अभिवृद्धि कर (१३% VAT):</span>
                    <span className="font-mono">+ रू {selectedInvoice.vatAmountNpr.toLocaleString("ne-NP")}</span>
                  </div>
                  <div className="flex justify-between text-card-foreground font-black text-sm pt-2 border-t border-border-theme">
                    <span>कुल रकम (Total Amount):</span>
                    <span className="font-mono text-emerald-600">रू {selectedInvoice.totalPayableNpr.toLocaleString("ne-NP")}</span>
                  </div>
                  <div className="flex justify-between text-xxs text-muted-text pt-1">
                    <span>१.५% अग्रिम कर कट्टी (TDS):</span>
                    <span className="font-mono">रू {selectedInvoice.tdsAmountNpr.toLocaleString("ne-NP")}</span>
                  </div>
                  <div className="flex justify-between text-xxs text-blue-600 font-bold">
                    <span>खुद प्राप्त रकम (Net Receivable):</span>
                    <span className="font-mono">रू {selectedInvoice.netReceivableNpr.toLocaleString("ne-NP")}</span>
                  </div>
                </div>
              </div>

              {/* Signature & Seal */}
              <div className="pt-8 border-t border-border-theme flex justify-between items-end text-xxs text-muted-text">
                <div className="space-y-1">
                  <div>भुक्तानी स्थिति: <strong className="uppercase text-card-foreground">{selectedInvoice.paymentStatus}</strong></div>
                  {selectedInvoice.paymentReference && <div>ट्रान्जेक्शन रेफरन्स: <strong className="font-mono">{selectedInvoice.paymentReference}</strong></div>}
                </div>
                <div className="text-center space-y-1">
                  <div className="w-36 border-b border-border-theme pb-8 text-center text-muted-text italic">
                    [ Official Digital Signature ]
                  </div>
                  <div className="font-bold text-card-foreground">अधिकृत हस्ताक्षर (Authorized Signatory)</div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
