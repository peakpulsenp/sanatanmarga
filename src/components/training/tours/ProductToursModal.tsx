import React, { useState, useEffect } from "react";
import { PRODUCT_TOURS, ProductTour, TourStep } from "./ToursData";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Compass, 
  CheckCircle2, 
  Play, 
  RotateCcw, 
  Lightbulb, 
  Layers, 
  ShieldCheck, 
  ExternalLink,
  Info
} from "lucide-react";

interface ProductToursModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTourId?: string | null;
}

export default function ProductToursModal({
  isOpen,
  onClose,
  initialTourId
}: ProductToursModalProps) {
  const [selectedTour, setSelectedTour] = useState<ProductTour | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Persistence of completed tours and in-progress steps
  const [completedTourIds, setCompletedTourIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("sm_tours_completed");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tourStepProgress, setTourStepProgress] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("sm_tours_progress");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("sm_tours_completed", JSON.stringify(completedTourIds));
    } catch (e) {
      console.warn("Could not save tour completions", e);
    }
  }, [completedTourIds]);

  useEffect(() => {
    try {
      localStorage.setItem("sm_tours_progress", JSON.stringify(tourStepProgress));
    } catch (e) {
      console.warn("Could not save tour progress", e);
    }
  }, [tourStepProgress]);

  // Handle initial tour launch if requested
  useEffect(() => {
    if (initialTourId) {
      const found = PRODUCT_TOURS.find(t => t.id === initialTourId || t.slug === initialTourId);
      if (found) {
        startTour(found);
      }
    }
  }, [initialTourId]);

  if (!isOpen) return null;

  const startTour = (tour: ProductTour) => {
    setSelectedTour(tour);
    const resumeStep = tourStepProgress[tour.id] || 0;
    setCurrentStepIndex(resumeStep < tour.steps.length ? resumeStep : 0);
  };

  const currentStep: TourStep | null = selectedTour ? selectedTour.steps[currentStepIndex] : null;

  const handleNextStep = () => {
    if (!selectedTour) return;
    if (currentStepIndex < selectedTour.steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setTourStepProgress(prev => ({ ...prev, [selectedTour.id]: nextIndex }));
    } else {
      // Completed tour!
      if (!completedTourIds.includes(selectedTour.id)) {
        setCompletedTourIds(prev => [...prev, selectedTour.id]);
      }
      setSelectedTour(null);
    }
  };

  const handlePrevStep = () => {
    if (!selectedTour) return;
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      setTourStepProgress(prev => ({ ...prev, [selectedTour.id]: prevIndex }));
    }
  };

  const handleSkipTour = () => {
    setSelectedTour(null);
  };

  const handleResetTour = (tourId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedTourIds(prev => prev.filter(id => id !== tourId));
    setTourStepProgress(prev => {
      const next = { ...prev };
      delete next[tourId];
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto">
      
      {/* MODE 1: Active Interactive Tour Overlay */}
      {selectedTour && currentStep ? (
        <div className="w-full max-w-4xl bg-card dark:bg-slate-950 border border-primary/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
          
          {/* Tour Active Header */}
          <div className="p-4 sm:p-6 bg-muted-area/60 dark:bg-zinc-900/80 border-b border-border-theme dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-black shrink-0">
                <Compass size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    Step {currentStepIndex + 1} of {selectedTour.steps.length}
                  </span>
                  <span className="text-xs text-muted-text hidden sm:inline">
                    {selectedTour.title}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-foreground dark:text-white mt-0.5">
                  {currentStep.title}
                </h3>
              </div>
            </div>

            <button
              onClick={handleSkipTour}
              className="p-2 rounded-xl text-muted-text hover:text-foreground hover:bg-muted-area transition-colors cursor-pointer"
              title="Close Tour"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tour Step Body: Interactive Visual Canvas with Spotlight */}
          <div className="p-6 space-y-6">
            
            {/* Spotlight UI Preview Canvas */}
            <div className="relative w-full h-72 sm:h-80 bg-slate-900 rounded-2xl border border-border-theme/80 dark:border-zinc-800 overflow-hidden shadow-inner flex flex-col">
              {/* Fake Application Chrome Bar */}
              <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-slate-300">https://sanatanmarga.org{currentStep.targetRoute}</span>
                </div>
                <span className="text-[11px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Target: {currentStep.elementName}
                </span>
              </div>

              {/* Dynamic Mockup Content View with Animated Highlight */}
              <div className="relative flex-1 p-6 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden">
                
                {/* Background UI Grid Representation */}
                <div className="w-full h-full opacity-30 flex flex-col gap-3 pointer-events-none">
                  <div className="h-6 w-1/3 bg-slate-700 rounded-lg" />
                  <div className="h-20 w-full bg-slate-800 rounded-xl" />
                  <div className="grid grid-cols-3 gap-3 flex-1">
                    <div className="bg-slate-800 rounded-xl" />
                    <div className="bg-slate-800 rounded-xl" />
                    <div className="bg-slate-800 rounded-xl" />
                  </div>
                </div>

                {/* Highlighted Bounding Box Overlay with Spotlight Effect */}
                <div 
                  className="absolute transition-all duration-500 ease-out border-2 border-primary bg-primary/20 backdrop-blur-[1px] rounded-2xl shadow-[0_0_35px_rgba(245,158,11,0.4)] flex flex-col justify-between p-3 ring-4 ring-primary/20 animate-pulse"
                  style={{
                    left: `${currentStep.highlightCoordinates.x}%`,
                    top: `${currentStep.highlightCoordinates.y}%`,
                    width: `${currentStep.highlightCoordinates.width}%`,
                    height: `${currentStep.highlightCoordinates.height}%`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-primary text-white px-2 py-0.5 rounded-md shadow-sm">
                      ACTIVE ELEMENT
                    </span>
                    <span className="text-[9px] font-mono text-white/80 hidden sm:inline">
                      {currentStep.targetSelectorHint}
                    </span>
                  </div>

                  <div className="text-white text-xs font-black truncate drop-shadow-md">
                    {currentStep.elementName} ({currentStep.elementNameNepali})
                  </div>
                </div>
              </div>
            </div>

            {/* Description & Pro-Tip Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">
                    {currentStep.titleNepali}
                  </span>
                </div>
                <p className="text-sm text-foreground dark:text-zinc-200 leading-relaxed font-medium">
                  {currentStep.description}
                </p>
                <p className="text-xs text-muted-text dark:text-zinc-400">
                  {currentStep.descriptionNepali}
                </p>
              </div>

              {/* Pro-Tip Box */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Lightbulb size={14} /> Professional Tip
                  </span>
                  <p className="text-xs text-foreground dark:text-zinc-200 leading-snug">
                    {currentStep.proTip}
                  </p>
                </div>
                <span className="text-[10px] text-muted-text italic mt-2">
                  {currentStep.proTipNepali}
                </span>
              </div>
            </div>

            {/* Step Progress Dots */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {selectedTour.steps.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex
                      ? "w-8 bg-primary"
                      : idx < currentStepIndex
                      ? "w-2 bg-primary/50"
                      : "w-2 bg-border-theme dark:bg-zinc-800"
                  }`}
                  title={`Jump to step ${idx + 1}`}
                />
              ))}
            </div>

          </div>

          {/* Tour Controls Footer */}
          <div className="p-4 sm:p-6 bg-muted-area/50 dark:bg-zinc-900/60 border-t border-border-theme dark:border-zinc-800 flex items-center justify-between">
            <button
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                currentStepIndex === 0 
                  ? "opacity-40 cursor-not-allowed text-muted-text" 
                  : "bg-card dark:bg-zinc-950 border border-border-theme text-foreground hover:bg-muted-area"
              }`}
            >
              <ChevronLeft size={16} />
              <span>Previous Step</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSkipTour}
                className="px-4 py-2 text-xs font-bold text-muted-text hover:text-foreground cursor-pointer"
              >
                Skip Tour
              </button>

              <button
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-black flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/20 cursor-pointer"
              >
                <span>{currentStepIndex === selectedTour.steps.length - 1 ? "Finish Tour" : "Next Step"}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* MODE 2: Tour Selection Catalog / Hub */
        <div className="w-full max-w-5xl bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
          
          {/* Header */}
          <div className="p-6 border-b border-border-theme dark:border-zinc-800 flex items-center justify-between bg-muted-area/40 dark:bg-zinc-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-black">
                <Compass size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                    Interactive Walkthroughs
                  </span>
                  <span className="text-xs text-muted-text">
                    • {completedTourIds.length} of {PRODUCT_TOURS.length} Completed
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground dark:text-white mt-0.5">
                  SanatanMarga Interactive Guided Product Tours
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-text hover:text-foreground hover:bg-muted-area dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body: Grid of all 8 Tours */}
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRODUCT_TOURS.map((tour) => {
                const isCompleted = completedTourIds.includes(tour.id);
                const currentProg = tourStepProgress[tour.id] || 0;

                return (
                  <div
                    key={tour.id}
                    onClick={() => startTour(tour)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                      isCompleted
                        ? "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50"
                        : currentProg > 0
                        ? "bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50"
                        : "bg-card dark:bg-slate-900/50 border-border-theme dark:border-zinc-800 hover:border-primary/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {tour.targetRole}
                        </span>

                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle2 size={11} /> Completed
                            </span>
                          ) : currentProg > 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              Step {currentProg + 1}/{tour.steps.length}
                            </span>
                          ) : null}

                          <span className="text-xs text-muted-text font-mono">
                            ~{tour.estimatedMinutes}m
                          </span>
                        </div>
                      </div>

                      <h3 className="text-base font-black text-foreground dark:text-white group-hover:text-primary transition-colors">
                        {tour.title}
                      </h3>
                      <p className="text-xs font-bold text-primary mt-0.5">
                        {tour.titleNepali}
                      </p>

                      <p className="text-xs text-muted-text dark:text-zinc-400 mt-2 leading-relaxed">
                        {tour.summary}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-border-theme/60 dark:border-zinc-800/80 flex items-center justify-between">
                      <span className="text-xs text-muted-text">
                        {tour.steps.length} Guided Steps
                      </span>

                      <div className="flex items-center gap-2">
                        {isCompleted && (
                          <button
                            onClick={(e) => handleResetTour(tour.id, e)}
                            className="p-1.5 rounded-lg text-muted-text hover:text-foreground hover:bg-muted-area transition-colors"
                            title="Reset tour progress"
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}

                        <span className="text-xs font-black text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span>{isCompleted ? "Retake Tour" : currentProg > 0 ? "Resume Tour" : "Start Tour"}</span>
                          <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Note */}
          <div className="p-4 sm:p-5 bg-muted-area/50 dark:bg-zinc-900/60 border-t border-border-theme dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-text">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-primary" />
              <span>Tour progress is automatically saved to your browser session.</span>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-card dark:bg-zinc-950 border border-border-theme text-foreground text-xs font-bold hover:bg-muted-area transition-colors cursor-pointer self-end sm:self-auto"
            >
              Close
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
