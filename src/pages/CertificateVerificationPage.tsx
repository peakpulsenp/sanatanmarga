import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Award, ShieldCheck, CheckCircle2, Search, Download, Printer, ExternalLink, GraduationCap, AlertCircle, Sparkles } from "lucide-react";
import SEOHead from "@/src/components/common/SEOHead";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { toast } from "sonner";

interface CertificateData {
  certId: string;
  studentName: string;
  courseTitle: string;
  issuedAt: string;
  issuer: string;
  checksum: string;
  status: string;
  verificationUrl: string;
}

export default function CertificateVerificationPage() {
  const { certId: routeCertId } = useParams<{ certId?: string }>();
  const navigate = useNavigate();
  const [inputCertId, setInputCertId] = useState(routeCertId || "");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [certData, setCertData] = useState<CertificateData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (routeCertId) {
      verifyCertificate(routeCertId);
    }
  }, [routeCertId]);

  const verifyCertificate = async (idToVerify: string) => {
    if (!idToVerify || !idToVerify.trim()) {
      toast.error("कृपया प्रमाणपत्र ID दर्ता गर्नुहोस्");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setVerified(null);
    setCertData(null);

    try {
      const res = await fetch(`/api/certificates/verify/${encodeURIComponent(idToVerify.trim())}`);
      const data = await res.json();
      if (data.success && data.certificate) {
        setVerified(data.verified);
        setCertData(data.certificate);
      } else {
        setVerified(false);
        setErrorMsg(data.error || "प्रमाणपत्र फेला परेन वा अमान्य छ।");
      }
    } catch (e: any) {
      setVerified(false);
      setErrorMsg("सर्भर पहुँच गर्न सकिएन। कृपया पुनः प्रयास गर्नुहोस्।");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCertId.trim()) {
      navigate(`/verify-certificate/${encodeURIComponent(inputCertId.trim())}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <SEOHead
        title="प्रमाणपत्र प्रमाणीकरण - सनातन मार्ग डिजिटल अकाडेमी"
        description="सनातन मार्ग ई-अकाडेमीद्वारा जारी डिजिटल प्रमाणपत्रहरूको आधिकारिक प्रमाणीकरण प्रणाली।"
        url={`/verify-certificate${routeCertId ? `/${routeCertId}` : ""}`}
      />

      <div className="min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider border border-emerald-500/20">
            <ShieldCheck size={14} /> Official Verifiable Records
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-card-foreground">
            डिजिटल प्रमाणपत्र प्रमाणीकरण प्रणाली
          </h1>
          <p className="text-xs sm:text-sm text-muted-text max-w-xl mx-auto">
            सनातन मार्ग डिजिटल अकाडेमीद्वारा शिक्षार्थीहरूलाई प्रदान गरिएका प्रमाणपत्रहरूको विश्वसनीयता तथा आधिकारिकता जाँच गर्नुहोस्।
          </p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleSearchSubmit} className="bg-card p-4 sm:p-6 rounded-3xl border border-border-theme shadow-sm space-y-4">
          <label className="block text-xs font-black uppercase tracking-wider text-muted-text">
            प्रमाणपत्र ID दर्ता गर्नुहोस् (Certificate ID):
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" />
              <input
                type="text"
                value={inputCertId}
                onChange={(e) => setInputCertId(e.target.value)}
                placeholder="उदा: CERT-SANATAN-2026-X89A"
                className="w-full pl-11 pr-4 py-3 bg-muted-area/50 border border-border-theme rounded-2xl text-sm font-mono font-bold uppercase focus:outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 transition-all cursor-pointer shrink-0 disabled:opacity-50"
            >
              {loading ? (
                <span>जाँच हुँदैछ...</span>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>प्रमाणीकरण गर्नुहोस्</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Certificate Result Render */}
        {verified === true && certData && (
          <div className="bg-gradient-to-b from-amber-500/5 via-card to-card border-2 border-amber-500/30 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 relative overflow-hidden print:p-0 print:border-none print:shadow-none">
            {/* Watermark Background */}
            <div className="absolute right-[-40px] bottom-[-40px] opacity-5 pointer-events-none text-amber-500">
              <GraduationCap size={300} />
            </div>

            {/* Status Header */}
            <div className="flex items-center justify-between border-b border-border-theme/60 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <div className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles size={12} /> आधिकारिक रूपमा प्रमाणित (VERIFIED CERTIFICATE)
                  </div>
                  <h2 className="text-lg font-black text-card-foreground">
                    प्रमाणपत्र आधिकारिक र सुरक्षित छ
                  </h2>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 print:hidden">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-card border border-border-theme text-xs font-bold flex items-center gap-1.5 hover:bg-muted-area transition-all cursor-pointer"
                >
                  <Printer size={14} /> प्रिन्ट गर्नुहोस्
                </button>
              </div>
            </div>

            {/* Certificate Body Card */}
            <div className="text-center space-y-6 py-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-muted-text uppercase tracking-widest">
                  प्रमाणपत्र सङ्ख्या (Certificate ID): <span className="font-mono text-primary">{certData.certId}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-black text-amber-600 dark:text-amber-400">
                  सनातन मार्ग डिजिटल अकाडेमी
                </h3>
                <p className="text-xs text-muted-text">प्रमाणित उपाधि तथा अध्ययन प्रमाणपत्र</p>
              </div>

              <div className="py-2">
                <p className="text-sm text-muted-text">यो प्रमाणित गरिन्छ कि शिक्षार्थी</p>
                <h4 className="text-2xl sm:text-3xl font-black text-card-foreground my-2">
                  {certData.studentName}
                </h4>
                <p className="text-sm text-muted-text max-w-lg mx-auto leading-relaxed">
                  ले सनातन मार्ग डिजिटल अकाडेमी अन्तर्गतको निम्नानुसारको पाठ्यक्रम सफलतापूर्वक सम्पन्न गर्नुभएको छ:
                </p>
              </div>

              <div className="p-4 bg-muted-area/60 border border-border-theme rounded-2xl inline-block max-w-md w-full">
                <div className="text-xs text-primary font-bold uppercase tracking-wider mb-1">सम्पन्न गरिएको पाठ्यक्रम</div>
                <div className="text-base sm:text-lg font-black text-card-foreground">
                  {certData.courseTitle}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-6 border-t border-border-theme/60 text-xs">
                <div>
                  <span className="text-muted-text">जारी गरिएको मिति:</span>
                  <div className="font-bold text-card-foreground">{new Date(certData.issuedAt).toLocaleDateString("ne-NP")} ({new Date(certData.issuedAt).toLocaleDateString("en-US")})</div>
                </div>
                <div>
                  <span className="text-muted-text">प्रमाणीकरण गर्ने निकाय:</span>
                  <div className="font-bold text-card-foreground">{certData.issuer}</div>
                </div>
              </div>

              {/* Cryptographic Hash Proof */}
              <div className="p-3 bg-muted-area/40 rounded-xl text-left border border-border-theme/40 text-[11px] font-mono text-muted-text break-all">
                <span className="font-bold text-card-foreground uppercase">Cryptographic Hash Checksum:</span> {certData.checksum}
              </div>
            </div>
          </div>
        )}

        {/* Failed Result */}
        {verified === false && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-lg font-black text-red-500">
              प्रमाणपत्र फेला परेन वा अमान्य छ
            </h3>
            <p className="text-xs sm:text-sm text-muted-text max-w-md mx-auto">
              {errorMsg || "तपाईंले दर्ता गर्नुभएको प्रमाणपत्र सङ्ख्या हाम्रो प्रणालीमा भेटिएन। कृपया ID पुन: जाँच गरी प्रयास गर्नुहोस्।"}
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
