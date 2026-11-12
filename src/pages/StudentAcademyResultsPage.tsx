import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import SEOHead from "@/src/components/common/SEOHead";
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  BarChart2, 
  ChevronLeft, 
  ExternalLink, 
  ShieldCheck, 
  TrendingUp, 
  RefreshCw, 
  FileText, 
  Sparkles, 
  HelpCircle,
  Search,
  Filter,
  Eye,
  Share2,
  BookOpen
} from "lucide-react";
import { useAuth } from "@/src/lib/auth";
import { toast } from "sonner";

interface StudentRecord {
  courseId: string;
  courseTitle: string;
  score: number;
  total: number;
  percentage: number;
  grade: string;
  passed: boolean;
  rank: number;
  totalStudents: number;
  percentile: number;
  attemptsCount: number;
  durationSeconds: number;
  submittedAt: string;
  certificate?: {
    certId: string;
    verificationUrl: string;
    issuedAt: string;
    checksum: string;
  };
}

export default function StudentAcademyResultsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<{
    coursesCompleted: number;
    averageScorePercentage: number;
    certificatesIssued: number;
  }>({
    coursesCompleted: 0,
    averageScorePercentage: 0,
    certificatesIssued: 0,
  });

  const [records, setRecords] = useState<StudentRecord[]>([]);

  const [selectedRecordForLeaderboard, setSelectedRecordForLeaderboard] = useState<StudentRecord | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);

  useEffect(() => {
    fetchStudentResults();
  }, [user]);

  const fetchStudentResults = async () => {
    if (!user?.uid) {
      setRecords([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const uId = user.uid;
      const res = await fetch(`/api/academy/student/${uId}/results`);
      const data = await res.json();

      if (data.success && data.records && data.records.length > 0) {
        setRecords(data.records);
        setSummary(data.summary);
      } else {
        setRecords([]);
      }
    } catch (e) {
      console.error("Failed fetching student results", e);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const openLeaderboard = async (record: StudentRecord) => {
    setSelectedRecordForLeaderboard(record);
    setLoadingLeaderboard(true);
    try {
      const res = await fetch(`/api/courses/${record.courseId}/rankings`);
      const data = await res.json();
      if (data.success && data.rankings) {
        setLeaderboard(data.rankings);
      } else {
        setLeaderboard([]);
      }
    } catch (e) {
      console.error("Failed fetching rankings", e);
      setLeaderboard([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins} मिनेट ${remainingSecs} सेकेन्ड`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEOHead
        title="मेरो नतिजा तथा प्रमाणपत्र (My Academy Performance & Results) - सनातन अकाडेमी"
        description="तपाईंको परीक्षा नतिजा, श्रेणी (Ranking), पर्सेन्टाइल र प्रमाणीकृत डिजिटल प्रमाणपत्र समीक्षा।"
        url="/academy/results"
      />
      <Header />

      <main className="flex-grow container-custom max-w-6xl py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/academy"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-text hover:text-primary transition-colors"
          >
            <ChevronLeft size={16} />
            <span>अकाडेमी मुख्य पृष्ठमा फर्कनुहोस्</span>
          </Link>

          <button
            onClick={fetchStudentResults}
            className="px-3 py-1.5 rounded-xl bg-muted-area hover:bg-border-theme text-xs font-bold text-card-foreground transition-colors flex items-center gap-1.5"
          >
            <RefreshCw size={13} />
            <span>डाटा ताजा गर्नुहोस्</span>
          </button>
        </div>

        {/* Page Header */}
        <div className="bg-card border border-border-theme rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black border border-emerald-500/20 mb-2">
                <ShieldCheck size={14} />
                <span>प्रमाणीकृत विद्यार्थी नतिजा प्रणाली (Verified Learning Performance)</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-card-foreground">
                विद्यार्थी कार्यसम्पादन तथा प्रमाणपत्र अभिलेख
              </h1>
              <p className="text-xs md:text-sm text-muted-text mt-1">
                तपाईंको आधिकारिक परीक्षा नतिजा, राष्ट्रिय श्रेणी, पर्सेन्टाइल र HMAC-SHA256 डिजिटल प्रमाणपत्र।
              </p>
            </div>

            <Link
              to="/academy"
              className="px-4 py-2.5 rounded-2xl bg-primary text-white font-black text-xs hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md shrink-0"
            >
              <BookOpen size={15} />
              <span>थप कोर्स अध्ययन गर्नुहोस्</span>
            </Link>
          </div>

          {/* Academic Overview Summary Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border-theme/60">
            <div className="p-4 rounded-2xl bg-muted-area/50 border border-border-theme space-y-1">
              <span className="text-[10px] font-black text-muted-text uppercase tracking-wider">सफल कोर्सहरू</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {summary.coursesCompleted}
              </div>
              <p className="text-[11px] text-muted-text font-medium">१००% पूरा भएको</p>
            </div>

            <div className="p-4 rounded-2xl bg-muted-area/50 border border-border-theme space-y-1">
              <span className="text-[10px] font-black text-muted-text uppercase tracking-wider">औसत प्राप्ताङ्क</span>
              <div className="text-2xl font-black text-primary">
                {summary.averageScorePercentage}%
              </div>
              <p className="text-[11px] text-muted-text font-medium">उत्कृष्ट नतिजा</p>
            </div>

            <div className="p-4 rounded-2xl bg-muted-area/50 border border-border-theme space-y-1">
              <span className="text-[10px] font-black text-muted-text uppercase tracking-wider">प्रमाणपत्र सङ्ख्या</span>
              <div className="text-2xl font-black text-amber-500">
                {summary.certificatesIssued}
              </div>
              <p className="text-[11px] text-muted-text font-medium">डिजिटल प्रमाणीकृत</p>
            </div>

            <div className="p-4 rounded-2xl bg-muted-area/50 border border-border-theme space-y-1">
              <span className="text-[10px] font-black text-muted-text uppercase tracking-wider">प्रतिष्ठा अङ्क (Reputation)</span>
              <div className="text-2xl font-black text-indigo-500">
                +{summary.coursesCompleted * 75}
              </div>
              <p className="text-[11px] text-muted-text font-medium">ReputationOS मा जोडिएको</p>
            </div>
          </div>
        </div>

        {/* Results List Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-card-foreground flex items-center gap-2">
              <Award size={20} className="text-amber-500" />
              <span>तपाईंको पुरा भएका परीक्षा र नतिजाहरू ({records.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="bg-card border border-border-theme rounded-3xl p-12 text-center space-y-3">
              <RefreshCw size={24} className="animate-spin text-primary mx-auto" />
              <p className="text-xs text-muted-text font-bold">नतिजा लोड हुँदैछ...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="bg-card border border-border-theme rounded-3xl p-12 text-center space-y-4">
              <HelpCircle size={40} className="text-muted-text mx-auto opacity-50" />
              <div className="space-y-1">
                <h3 className="text-base font-black text-card-foreground">कुनै परीक्षा नतिजा भेटिएन</h3>
                <p className="text-xs text-muted-text max-w-md mx-auto">
                  तपाईंले अहिलेसम्म कुनै कोर्सको अन्तिम परीक्षा दिनुभएको छैन। कोर्स अध्ययन गरी परीक्षा उत्तीर्ण गर्नुहोस्।
                </p>
              </div>
              <Link
                to="/academy"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
              >
                <span>कोर्सहरू हेर्नुहोस्</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {records.map((rec) => (
                <div
                  key={rec.courseId}
                  className="bg-card border border-border-theme rounded-3xl p-6 space-y-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Top Bar: Title & Status */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-theme pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/20">
                          {rec.passed ? "उत्तीर्ण (Passed)" : "अनुत्तीर्ण"}
                        </span>
                        <span className="text-[11px] text-muted-text font-bold">
                          प्रयास सङ्ख्या: {rec.attemptsCount}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-card-foreground">
                        {rec.courseTitle}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-bold text-muted-text block">प्राप्ताङ्क ग्रेड</span>
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          {rec.grade} ({rec.percentage}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted-area/40 p-4 rounded-2xl border border-border-theme/60">
                    <div>
                      <span className="text-[10px] font-black text-muted-text uppercase tracking-wider block">श्रेणी (Leaderboard Rank)</span>
                      <span className="text-base font-black text-primary flex items-center gap-1 mt-0.5">
                        <Award size={16} className="text-amber-500" />
                        #{rec.rank} <span className="text-xs text-muted-text font-medium">/ {rec.totalStudents} विद्यार्थी</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-muted-text uppercase tracking-wider block">पर्सेन्टाइल (Percentile)</span>
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                        {rec.percentile}th Percentile
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-muted-text uppercase tracking-wider block">परीक्षा अवधि</span>
                      <span className="text-xs font-black text-card-foreground mt-1 flex items-center gap-1">
                        <Clock size={14} className="text-muted-text" />
                        {formatDuration(rec.durationSeconds)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-muted-text uppercase tracking-wider block">सही उत्तर संख्या</span>
                      <span className="text-xs font-black text-card-foreground mt-1 block">
                        {rec.score} / {rec.total} प्रश्नहरू मिलाएको
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      {rec.certificate && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black border border-amber-500/20">
                          <ShieldCheck size={14} />
                          <span>HMAC SHA256 डिजिटल प्रमाण</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => openLeaderboard(rec)}
                        className="px-3.5 py-2 rounded-xl bg-muted-area hover:bg-border-theme text-card-foreground text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <BarChart2 size={14} className="text-primary" />
                        <span>रैङ्किङ बोर्ड हेर्नुहोस्</span>
                      </button>

                      {rec.certificate && (
                        <Link
                          to={`/verify-certificate/${rec.certificate.certId}`}
                          target="_blank"
                          className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-black transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Award size={14} />
                          <span>प्रमाणपत्र प्रमाणीकरण (Verify Cert)</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* LEADERBOARD MODAL */}
      {selectedRecordForLeaderboard && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border-theme rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-theme pb-4">
              <div>
                <h3 className="text-base font-black text-card-foreground flex items-center gap-2">
                  <BarChart2 size={18} className="text-amber-500" />
                  <span>राष्ट्रिय उत्कृष्ट विद्यार्थी बोर्ड (Course Leaderboard)</span>
                </h3>
                <p className="text-xs text-muted-text mt-0.5">
                  कोर्स: {selectedRecordForLeaderboard.courseTitle}
                </p>
              </div>

              <button
                onClick={() => setSelectedRecordForLeaderboard(null)}
                className="w-8 h-8 rounded-full bg-muted-area hover:bg-border-theme text-card-foreground text-xs font-black flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingLeaderboard ? (
              <div className="py-12 text-center text-xs text-muted-text font-bold">
                डाटा लोड हुँदैछ...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-text font-bold">
                अहिलेसम्म कुनै रैङ्किङ डाटा उपलब्ध छैन।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border-theme text-muted-text font-bold">
                      <th className="py-2.5 px-3">स्थान (Rank)</th>
                      <th className="py-2.5 px-3">विद्यार्थी</th>
                      <th className="py-2.5 px-3">प्राप्ताङ्क (%)</th>
                      <th className="py-2.5 px-3">ग्रेड</th>
                      <th className="py-2.5 px-3">अवधि</th>
                      <th className="py-2.5 px-3">ब्याज</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-theme/50 font-medium text-card-foreground">
                    {leaderboard.map((item: any, idx: number) => {
                      const isMe = item.userId === user?.uid || item.userId === selectedRecordForLeaderboard.courseId;
                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-muted-area/50 transition-colors ${
                            isMe ? "bg-primary/10 font-bold text-primary" : ""
                          }`}
                        >
                          <td className="py-2.5 px-3 font-black">
                            #{item.rank}
                          </td>
                          <td className="py-2.5 px-3 font-bold">
                            {item.userName || "विद्यार्थी"} {isMe && "(तपाईं)"}
                          </td>
                          <td className="py-2.5 px-3 font-black text-emerald-600">
                            {item.percentage}%
                          </td>
                          <td className="py-2.5 px-3 font-black">
                            {item.grade}
                          </td>
                          <td className="py-2.5 px-3 text-muted-text">
                            {Math.round((item.durationSeconds || 0) / 60)} मिनेट
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black">
                              {item.topBadge || "Scholar"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
