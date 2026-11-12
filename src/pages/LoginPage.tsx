import { useState, FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, ChevronLeft, UserPlus, User } from "lucide-react";
import { signInWithPopup } from "@/src/lib/authClient";
import { auth, googleProvider, db, getDocWithCacheFallback } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { useLanguage } from "@/src/context/LanguageContext";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import LogoImage from "@/src/components/ui/LogoImage";
import { logActivity } from "@/src/lib/activityLogger";

import { useTheme } from "@/src/components/StyleProvider";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { siteSettings } = useTheme();
  const { language } = useLanguage();
  const logoUrl = siteSettings.logoUrl;
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      const isStaff = ['super_admin', 'admin', 'chief_editor', 'editor', 'moderator'].includes(user.role);
      if (isStaff) {
        navigate("/admin");
      } else {
        navigate(`/profile/${user.uid}`);
      }
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        // Navigation is handled by the useEffect above
      } else {
        if (!displayName) {
          setError(language === 'en' ? "Please enter your name." : "कृपया आफ्नो नाम राख्नुहोस्।");
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName);
        setSuccess(language === 'en' ? "Account created successfully! Please verify your email." : "खाता सफलतापूर्वक सिर्जना गरियो! कृपया आफ्नो इमेल पुष्टि गर्नुहोस्।");
        setIsLogin(true);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError(language === 'en' ? "This email is already in use." : "यो इमेल पहिले नै प्रयोगमा छ।");
      } else if (err.code === 'auth/weak-password') {
        setError(language === 'en' ? "Password must be at least 6 characters." : "पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ।");
      } else if (err.message?.includes('Quota exceeded')) {
        setError(language === 'en' ? "System quota exceeded. Please try again later." : "सिस्टम कोटा सकिएको छ। तपाईँ केही समयपछि पुन: प्रयास गर्न सक्नुहुन्छ।");
      } else {
        setError(isLogin 
          ? (language === 'en' ? "Invalid email or password." : "इमेल वा पासवर्ड मिलेन।") 
          : (language === 'en' ? "Failed to create account. Please try again." : "खाता सिर्जना गर्दा समस्या आयो।"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // Navigation is handled by the useEffect above
    } catch (err: any) {
      console.error("Google login error:", err);
      if (err.message?.includes('Quota exceeded')) {
        setError(language === 'en' ? "Google login error: System quota exceeded. Please try again later." : "गुगल लगइनमा समस्या आयो: सिस्टम कोटा सकिएको छ। केही समयपछि पुन: प्रयास गर्नुहोस्।");
      } else {
        setError(language === 'en' ? `Google login error: ${err.message || "Unknown error"}` : `गुगल लगइनमा समस्या आयो: ${err.message || "अज्ञात त्रुटि"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
      <Header />
      
      <main className="flex-grow flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md bg-card rounded-[2.5rem] shadow-2xl shadow-muted-area/50 overflow-hidden border border-border-theme">
          <div className="p-10 flex flex-col gap-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 bg-muted-area rounded-3xl p-2 shadow-sm border border-border-theme overflow-hidden">
                <LogoImage 
                  src={logoUrl} 
                  alt="Sanatan Marga Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-black text-card-foreground tracking-tight leading-tight">
                  {isLogin 
                    ? (language === 'en' ? "Welcome Back!" : "स्वागत छ!") 
                    : (language === 'en' ? "Create Account" : "नयाँ खाता")}
                </h2>
                <p className="text-sm font-medium text-muted-text">
                  {isLogin 
                    ? (language === 'en' ? "Log in to your account" : "तपाईंको खातामा लगइन गर्नुहोस्") 
                    : (language === 'en' ? "Register today and stay updated with latest news" : "आजै दर्ता गर्नुहोस् र समाचारमा अपडेट रहनुहोस्")}
                </p>
              </div>
            </div>

            {isLogin && (
              <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-xxs font-bold text-muted-text uppercase tracking-widest text-center">
                  {language === 'en' ? "Local demo accounts · any password" : "स्थानीय डेमो खाता · जुनसुकै पासवर्ड"}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { email: "admin@sanatanmarga.com", label: language === 'en' ? "Admin" : "एडमिन" },
                    { email: "editor@sanatanmarga.com", label: language === 'en' ? "Editor" : "सम्पादक" },
                    { email: "reader@sanatanmarga.com", label: language === 'en' ? "Reader" : "पाठक" },
                  ].map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => {
                        setEmail(account.email);
                        setPassword("demo1234");
                        setError(null);
                      }}
                      className="rounded-xl border border-border-theme bg-card px-2 py-2 text-xs font-bold text-card-foreground hover:border-primary/40 hover:text-primary transition-colors"
                    >
                      {account.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl text-sm font-bold text-center border border-red-500/20">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 text-green-500 p-4 rounded-2xl text-sm font-bold text-center border border-green-500/20">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {!isLogin && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-muted-text uppercase tracking-widest ml-1">
                    {language === 'en' ? "Full Name" : "पूरा नाम"}
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" size={18} />
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={language === 'en' ? "Your Name" : "तपाईंको नाम"}
                      className="w-full bg-muted-area border border-border-theme rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-card-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-muted-text uppercase tracking-widest ml-1">
                  {language === 'en' ? "Email" : "इमेल"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full bg-muted-area border border-border-theme rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-card-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-muted-text uppercase tracking-widest ml-1">
                  {language === 'en' ? "Password" : "पासवर्ड"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-muted-area border border-border-theme rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-card-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Link to="/forgot-password" title="Forgot Password" className="text-xs font-bold text-primary hover:underline">
                    {language === 'en' ? "Forgot password?" : "पासवर्ड बिर्सनुभयो?"}
                  </Link>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                {loading 
                  ? (language === 'en' ? "Processing..." : "प्रक्रियामा छ...") 
                  : (isLogin 
                      ? (language === 'en' ? "Log In" : "लगइन गर्नुहोस्") 
                      : (language === 'en' ? "Create Account" : "खाता सिर्जना गर्नुहोस्"))}
              </button>
            </form>

            <div className="text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-bold text-muted-text hover:text-primary transition-colors"
              >
                {isLogin 
                  ? (language === 'en' ? "Don't have an account? Sign up" : "नयाँ खाता सिर्जना गर्नुहोस्?") 
                  : (language === 'en' ? "Already have an account? Log In" : "पहिले नै खाता छ? लगइन गर्नुहोस्")}
              </button>
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px bg-border-theme flex-grow"></div>
              <span className="text-xxs font-bold text-muted-text/50 uppercase tracking-widest">
                {language === 'en' ? "or" : "अथवा"}
              </span>
              <div className="h-px bg-border-theme flex-grow"></div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-card border border-border-theme text-card-foreground py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-muted-area transition-all disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              {language === 'en' 
                ? `Continue with Google` 
                : `गुगलबाट ${isLogin ? "लगइन" : "दर्ता"} गर्नुहोस्`}
            </button>
          </div>

          <div className="bg-muted-area p-6 text-center border-t border-border-theme">
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-muted-text hover:text-primary transition-colors">
              <ChevronLeft size={14} />
              {language === 'en' ? "Back to Homepage" : "गृहपृष्ठमा फर्कनुहोस्"}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
