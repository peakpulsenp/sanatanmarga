import { useState, useMemo } from "react";
import { 
  Building2, 
  DollarSign, 
  CheckCircle2, 
  FileText, 
  Download, 
  ShieldCheck, 
  Filter, 
  Search, 
  Plus, 
  CreditCard,
  Layers,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Printer
} from "lucide-react";
import { revenueLedger, LedgerEntry, FinancialStatementSummary } from "@/src/services/revenueLedger";
import { toast } from "sonner";

export default function FinancialLedgerModule() {
  const [entries, setEntries] = useState<LedgerEntry[]>(() => revenueLedger.getAllEntries());
  const [searchTerm, setSearchTerm] = useState("");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Form for Recording Payment & TDS
  const [paymentForm, setPaymentForm] = useState({
    invoiceNumber: "SM-INV-2083-0148",
    advertiserId: "adv-pokhara-03",
    advertiserName: "Pokhara Tourism Promotion Committee",
    advertiserPan: "602481092",
    cashAmountNpr: 50087,
    tdsAmountNpr: 763,
    referenceNumber: "NABIL-TXN-902188",
    actor: "Finance Officer (Niraj C.)"
  });

  // Calculate Statements deterministically
  const statements: FinancialStatementSummary = useMemo(() => {
    return revenueLedger.getFinancialStatements();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const matchSearch = 
        e.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.advertiserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchAccount = accountFilter === "all" || e.account === accountFilter;
      return matchSearch && matchAccount;
    });
  }, [entries, searchTerm, accountFilter]);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.invoiceNumber || !paymentForm.cashAmountNpr) {
      toast.error("कृपया सम्पूर्ण विवरण भर्नुहोस्।");
      return;
    }

    const newEntries = revenueLedger.recordPaymentReceived({
      invoiceId: `inv-${Date.now()}`,
      invoiceNumber: paymentForm.invoiceNumber,
      advertiserId: paymentForm.advertiserId,
      advertiserName: paymentForm.advertiserName,
      advertiserPan: paymentForm.advertiserPan,
      cashAmountNpr: Number(paymentForm.cashAmountNpr),
      tdsAmountNpr: Number(paymentForm.tdsAmountNpr),
      referenceNumber: paymentForm.referenceNumber,
      actor: paymentForm.actor
    });

    setEntries(revenueLedger.getAllEntries());
    setIsPaymentModalOpen(false);
    toast.success("भुक्तानी तथा टीडीएस लेजर प्रविष्टि सफलतापूर्वक अभिलेखीकरण भयो!");
  };

  const handleExportCsv = () => {
    const headers = "ID,Timestamp,FiscalYear,InvoiceNumber,Advertiser,PAN,Account,EntryType,AmountNPR,Status,Actor\n";
    const rows = entries.map(e => 
      `"${e.id}","${e.timestamp}","${e.fiscalYear}","${e.invoiceNumber}","${e.advertiserName}","${e.advertiserPan}","${e.account}","${e.entryType}",${e.amountNpr},"${e.status}","${e.auditActor}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `SanatanMarga_Revenue_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("लेजर CSV डाउनलोड भयो!");
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER & FINANCIAL BALANCE SHEET OVERVIEW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-theme pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-card-foreground">
              वित्तीय लेजर तथा लेखा परीक्षण (Financial Revenue Ledger)
            </h2>
            <span className="text-xxs font-black bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Double-Entry Standard
            </span>
          </div>
          <p className="text-xs text-muted-text mt-1">
            नेपाल आयकर ऐन तथा आन्तरिक राजस्व विभाग (IRD) मापदण्ड अनुसारको डिजिटल दोहोरो लेखा प्रणाली (Deterministic Ledger)।
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="px-3.5 py-2 bg-primary text-primary-foreground text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs hover:opacity-90 transition-all"
          >
            <Plus size={14} /> भुक्तानी प्रविष्टि (Record Payment)
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-muted-area text-card-foreground hover:bg-muted-area/80 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border border-border-theme transition-all"
          >
            <Download size={14} /> लेजर CSV (Export)
          </button>
        </div>
      </div>

      {/* SUMMARY FINANCIAL CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Gross Billed */}
        <div className="p-4 rounded-2xl bg-card border border-border-theme space-y-1">
          <span className="text-xxs font-bold text-muted-text uppercase block">कुल जारी बिल रकम</span>
          <div className="text-lg sm:text-xl font-black text-card-foreground font-mono">
            रू {statements.grossBilledRevenueNpr.toLocaleString("ne-NP")}
          </div>
          <p className="text-[10px] text-muted-text font-medium">Gross Invoiced</p>
        </div>

        {/* Net Taxable Revenue */}
        <div className="p-4 rounded-2xl bg-card border border-border-theme space-y-1">
          <span className="text-xxs font-bold text-muted-text uppercase block">खुद विज्ञापन आय</span>
          <div className="text-lg sm:text-xl font-black text-purple-600 font-mono">
            रू {statements.netTaxableRevenueNpr.toLocaleString("ne-NP")}
          </div>
          <p className="text-[10px] text-muted-text font-medium">Net Ad Revenue</p>
        </div>

        {/* VAT Liability */}
        <div className="p-4 rounded-2xl bg-card border border-border-theme space-y-1">
          <span className="text-xxs font-bold text-muted-text uppercase block">१३% भ्याट दायित्व</span>
          <div className="text-lg sm:text-xl font-black text-blue-600 font-mono">
            रू {statements.totalVatLiabilityNpr.toLocaleString("ne-NP")}
          </div>
          <p className="text-[10px] text-muted-text font-medium">IRD VAT Payable</p>
        </div>

        {/* TDS Withheld */}
        <div className="p-4 rounded-2xl bg-card border border-border-theme space-y-1">
          <span className="text-xxs font-bold text-muted-text uppercase block">१.५% अग्रिम कर (TDS)</span>
          <div className="text-lg sm:text-xl font-black text-amber-600 font-mono">
            रू {statements.totalTdsWithheldNpr.toLocaleString("ne-NP")}
          </div>
          <p className="text-[10px] text-muted-text font-medium">TDS Withheld Asset</p>
        </div>

        {/* Cash Collected */}
        <div className="p-4 rounded-2xl bg-card border border-border-theme space-y-1">
          <span className="text-xxs font-bold text-muted-text uppercase block">प्राप्त नगद / बैंक</span>
          <div className="text-lg sm:text-xl font-black text-emerald-600 font-mono">
            रू {statements.cashCollectedNpr.toLocaleString("ne-NP")}
          </div>
          <p className="text-[10px] text-muted-text font-medium">Cash Collected</p>
        </div>

        {/* Outstanding Receivables */}
        <div className="p-4 rounded-2xl bg-card border border-border-theme space-y-1">
          <span className="text-xxs font-bold text-muted-text uppercase block">उठ्न बाँकी (Receivables)</span>
          <div className="text-lg sm:text-xl font-black text-rose-600 font-mono">
            रू {statements.accountsReceivableNpr.toLocaleString("ne-NP")}
          </div>
          <p className="text-[10px] text-muted-text font-medium">Pending Clearance</p>
        </div>

      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border-theme">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
          <input
            type="text"
            placeholder="बीजक नं, विज्ञापनदाता वा विवरण खोज्नुहोस्..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-muted-area/50 border border-border-theme text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {[
            { id: "all", label: "सबै खाताहरू" },
            { id: "accounts_receivable", label: "Accounts Receivable" },
            { id: "advertising_revenue", label: "Ad Revenue (आय)" },
            { id: "vat_liability_payable", label: "VAT Payable (भ्याट)" },
            { id: "tds_withholding_receivable", label: "TDS Withheld" },
            { id: "cash_bank_nepal", label: "Cash & Bank" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setAccountFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                accountFilter === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted-area text-muted-text hover:text-card-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* DOUBLE-ENTRY LEDGER TABLE */}
      <div className="bg-card border border-border-theme rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted-area/60 text-muted-text text-[11px] font-mono border-b border-border-theme">
              <tr>
                <th className="p-3.5">मिति / आर्थिक वर्ष</th>
                <th className="p-3.5">लेजर ID / बीजक नं</th>
                <th className="p-3.5">विज्ञापनदाता / विवरण</th>
                <th className="p-3.5">लेखा खाता (Account)</th>
                <th className="p-3.5 text-right">डेबिट (Dr.) रू</th>
                <th className="p-3.5 text-right">क्रेडिट (Cr.) रू</th>
                <th className="p-3.5 text-center">अडिट स्थिति</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme">
              {filteredEntries.map((e) => (
                <tr key={e.id} className="hover:bg-muted-area/30 transition-colors">
                  <td className="p-3.5 space-y-0.5">
                    <div className="font-mono text-card-foreground font-bold">
                      {e.timestamp.split("T")[0]}
                    </div>
                    <span className="text-[10px] text-muted-text font-mono">आ.व. {e.fiscalYear}</span>
                  </td>

                  <td className="p-3.5 space-y-0.5">
                    <div className="font-mono font-bold text-card-foreground">{e.id}</div>
                    <span className="text-[10px] text-purple-600 font-mono font-bold block">{e.invoiceNumber}</span>
                  </td>

                  <td className="p-3.5 space-y-0.5 max-w-xs">
                    <div className="font-bold text-card-foreground">{e.advertiserName}</div>
                    <p className="text-[11px] text-muted-text line-clamp-1">{e.description}</p>
                    <span className="text-[10px] text-muted-text font-mono">PAN: {e.advertiserPan}</span>
                  </td>

                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-muted-area border border-border-theme inline-block">
                      {e.account}
                    </span>
                  </td>

                  <td className="p-3.5 text-right font-mono font-bold">
                    {e.entryType === "debit" ? (
                      <span className="text-card-foreground">रू {e.amountNpr.toLocaleString("ne-NP")}</span>
                    ) : (
                      <span className="text-muted-text">-</span>
                    )}
                  </td>

                  <td className="p-3.5 text-right font-mono font-bold">
                    {e.entryType === "credit" ? (
                      <span className="text-emerald-600">रू {e.amountNpr.toLocaleString("ne-NP")}</span>
                    ) : (
                      <span className="text-muted-text">-</span>
                    )}
                  </td>

                  <td className="p-3.5 text-center space-y-0.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      e.status === "reconciled" 
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    }`}>
                      {e.status === "reconciled" ? "फर्स्यौट (Reconciled)" : "अभिलेख (Recorded)"}
                    </span>
                    <div className="text-[9px] text-muted-text font-mono">{e.auditActor}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border-theme rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-theme pb-3">
              <h3 className="text-base font-black text-card-foreground flex items-center gap-2">
                <CreditCard size={18} className="text-primary" /> विज्ञापन भुक्तानी तथा टीडीएस प्रविष्टि
              </h3>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 text-muted-text hover:text-card-foreground text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-muted-text font-bold">बीजक नम्बर (Invoice Number):</label>
                <input
                  type="text"
                  required
                  value={paymentForm.invoiceNumber}
                  onChange={e => setPaymentForm({...paymentForm, invoiceNumber: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl bg-muted-area/50 border border-border-theme font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-muted-text font-bold">विज्ञापनदाता (Client):</label>
                  <input
                    type="text"
                    required
                    value={paymentForm.advertiserName}
                    onChange={e => setPaymentForm({...paymentForm, advertiserName: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl bg-muted-area/50 border border-border-theme"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-muted-text font-bold">ग्राहक PAN:</label>
                  <input
                    type="text"
                    required
                    value={paymentForm.advertiserPan}
                    onChange={e => setPaymentForm({...paymentForm, advertiserPan: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl bg-muted-area/50 border border-border-theme font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-muted-text font-bold">प्राप्त रकम (Cash/Bank) रू:</label>
                  <input
                    type="number"
                    required
                    value={paymentForm.cashAmountNpr}
                    onChange={e => setPaymentForm({...paymentForm, cashAmountNpr: Number(e.target.value)})}
                    className="w-full px-3 py-2 rounded-xl bg-muted-area/50 border border-border-theme font-mono font-bold text-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-muted-text font-bold">१.५% टीडीएस रकम (TDS) रू:</label>
                  <input
                    type="number"
                    required
                    value={paymentForm.tdsAmountNpr}
                    onChange={e => setPaymentForm({...paymentForm, tdsAmountNpr: Number(e.target.value)})}
                    className="w-full px-3 py-2 rounded-xl bg-muted-area/50 border border-border-theme font-mono font-bold text-amber-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-muted-text font-bold">बैंक भौचर / रेफरेन्स कोड:</label>
                <input
                  type="text"
                  required
                  value={paymentForm.referenceNumber}
                  onChange={e => setPaymentForm({...paymentForm, referenceNumber: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl bg-muted-area/50 border border-border-theme font-mono"
                  placeholder="e.g. NABIL-TXN-902188 / eSewa Tx ID"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-text font-bold">अडिट अधिकृत (Finance Officer):</label>
                <input
                  type="text"
                  required
                  value={paymentForm.actor}
                  onChange={e => setPaymentForm({...paymentForm, actor: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl bg-muted-area/50 border border-border-theme"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-muted-area text-muted-text hover:text-card-foreground font-bold cursor-pointer"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-black cursor-pointer shadow-sm hover:opacity-90"
                >
                  लेजर प्रविष्टि सुरक्षित गर्नुहोस्
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
