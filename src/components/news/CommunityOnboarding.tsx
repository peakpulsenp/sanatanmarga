import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, Award, Shield, CheckCircle, ChevronRight, PenTool, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/src/lib/auth";
import { toast } from "sonner";

export default function CommunityOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleRegisterAsContributor = () => {
    if (!user) {
      toast.error("योगदानकर्ता बन्न पहिले लगइन गर्नुहोस्!");
      navigate("/login");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("बधाई छ! तपाईंको सनातन ज्ञान योगदानकर्ता आवेदन दर्ता भयो। समीक्षा पश्चात् तपाईंलाई सूचित गरिनेछ।");
    }, 1500);
  };

  return (
    <div className="bg-card rounded-[2.5rem] border border-border-theme p-8 lg:p-12 shadow-sm flex flex-col gap-10 overflow-hidden relative">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full filter blur-3xl pointer-events-none" />

      <div className="flex flex-col gap-2 relative z-10">
        <span className="text-xxs font-black text-primary tracking-[0.25em] uppercase flex items-center gap-1.5">
          <Users size={12} className="text-primary" /> हाम्रो डिजिटल चौतारी
        </span>
        <h3 className="text-2xl lg:text-3xl font-black text-card-foreground tracking-tight">
          सभ्यता निर्माणमा सहकार्य गरौं (Join the Movement)
        </h3>
        <p className="text-xs font-bold text-muted-text max-w-2xl leading-relaxed">
          सनातन मार्ग केवल एक समाचार पोर्टल होइन; यो नेपाली ज्ञान, चिन्तन, र समुदायलाई डिजिटल युगमा पुनर्जीवित गर्ने साझा अभियान हो।
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        {/* Card 1: Become a Member */}
        <motion.div
          className="bg-muted-area/10 border border-border-theme/60 rounded-3xl p-8 flex flex-col gap-6 h-full hover:border-primary/30 transition-all duration-300"
          whileHover={{ y: -5 }}
        >
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
            <Shield size={22} />
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-lg font-black text-card-foreground">सञ्जालको सदस्य बन्नुहोस्</h4>
            <p className="text-xs font-bold text-muted-text leading-relaxed">
              विशेष अनुसन्धान पत्रहरू पढ्न, सुरक्षित बुकमार्कहरू सिर्जना गर्न र ज्ञान सञ्जालमा रुचि अनुसारका ट्र्याकहरू सिफारिस पाउन सदस्यता लिनुहोस्।
            </p>
          </div>
          <div className="mt-auto">
            <Link
              to="/login"
              className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-black py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all"
            >
              <span>सदस्य बन्नुहोस्</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </motion.div>

        {/* Card 2: Join Chautari Discussions */}
        <motion.div
          className="bg-muted-area/10 border border-border-theme/60 rounded-3xl p-8 flex flex-col gap-6 h-full hover:border-accent/30 transition-all duration-300"
          whileHover={{ y: -5 }}
        >
          <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
            <Users size={22} />
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-lg font-black text-card-foreground">चौतारी बहसमा सहभागी बन्नुहोस्</h4>
            <p className="text-xs font-bold text-muted-text leading-relaxed">
              विभिन्न सामाजिक तथा सांस्कृतिक विषयहरूमा विचार व्यक्त गर्नुहोस्, प्रश्न सोध्नुहोस्, र प्रबुद्ध व्यक्तित्वहरूसँग बौद्धिक विमर्श गर्नुहोस्।
            </p>
          </div>
          <div className="mt-auto">
            <Link
              to="/community"
              className="w-full bg-accent hover:bg-accent/90 text-white text-xs font-black py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all"
            >
              <span>चौतारी प्रवेश</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </motion.div>

        {/* Card 3: Contribute Knowledge */}
        <motion.div
          className="bg-muted-area/10 border border-border-theme/60 rounded-3xl p-8 flex flex-col gap-6 h-full hover:border-sacred/30 transition-all duration-300"
          whileHover={{ y: -5 }}
        >
          <div className="w-12 h-12 bg-sacred/10 text-sacred rounded-2xl flex items-center justify-center">
            <PenTool size={22} />
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-lg font-black text-card-foreground">ज्ञान र इतिहास योगदान गर्नुहोस्</h4>
            <p className="text-xs font-bold text-muted-text leading-relaxed">
              आफ्नो स्थानीय क्षेत्रका मन्दिरहरू, रीतिथिति, धार्मिक ग्रन्थ वा अनुसन्धानहरूलाई डिजिटल ज्ञान सञ्जालमा समावेश गर्न स्वीकृत योगदानकर्ता बन्नुहोस्।
            </p>
          </div>
          <div className="mt-auto">
            <button
              onClick={handleRegisterAsContributor}
              disabled={loading}
              className="w-full bg-sacred hover:bg-sacred/90 text-white text-xs font-black py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>पठाउँदै...</span>
              ) : (
                <>
                  <span>योगदान सुरु गर्नुहोस्</span>
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
