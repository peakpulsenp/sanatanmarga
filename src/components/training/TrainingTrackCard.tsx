import React from "react";
import { TrainingTrack } from "./TrainingData";
import { 
  Compass, 
  Eye, 
  Sparkles, 
  Radio, 
  GraduationCap, 
  Scroll, 
  ShoppingBag, 
  DollarSign, 
  ShieldCheck, 
  Sliders, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Award, 
  ArrowRight,
  Layers
} from "lucide-react";

interface TrainingTrackCardProps {
  track: TrainingTrack;
  completedLessons: string[];
  onSelectTrack: (track: TrainingTrack) => void;
  onOpenExam?: (certId: string) => void;
}

const ICON_MAP: Record<string, any> = {
  Compass,
  Eye,
  Sparkles,
  Radio,
  GraduationCap,
  Scroll,
  ShoppingBag,
  DollarSign,
  ShieldCheck,
  Sliders,
  BookOpen
};

export default function TrainingTrackCard({
  track,
  completedLessons,
  onSelectTrack,
  onOpenExam
}: TrainingTrackCardProps) {
  const IconComponent = ICON_MAP[track.iconName] || Compass;

  const trackLessonIds = track.lessons.map(l => l.id);
  const completedInTrack = trackLessonIds.filter(id => completedLessons.includes(id)).length;
  const isCompleted = trackLessonIds.length > 0 && completedInTrack === trackLessonIds.length;
  const progressPercent = trackLessonIds.length > 0 ? Math.round((completedInTrack / trackLessonIds.length) * 100) : 0;

  return (
    <div 
      className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:border-primary/40 group relative overflow-hidden"
    >
      {/* Subtle Background Accent Gradient */}
      <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${track.gradient} blur-3xl opacity-60 pointer-events-none rounded-full`} />

      <div>
        {/* Header Row: Track Number, Icon, and Level */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform">
              <IconComponent size={20} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-muted-text uppercase block">
                Track 0{track.number}
              </span>
              <span className="text-xs font-bold text-foreground dark:text-zinc-200">
                {track.level} Level
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-mono font-bold text-muted-text bg-muted-area dark:bg-zinc-900 px-2.5 py-1 rounded-full border border-border-theme dark:border-zinc-800">
              <Clock size={12} />
              {track.estimatedTime}
            </span>
          </div>
        </div>

        {/* Titles & Tagline */}
        <div className="space-y-1.5 mb-4">
          <span className="text-xs font-bold text-primary block">
            {track.titleNepali}
          </span>
          <h3 className="text-lg sm:text-xl font-black text-foreground dark:text-white group-hover:text-primary transition-colors leading-snug">
            {track.title}
          </h3>
          <p className="text-xs text-muted-text dark:text-zinc-400 line-clamp-2 leading-relaxed">
            {track.tagline}
          </p>
        </div>

        {/* Target Roles Pills */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {track.targetPersonas.slice(0, 3).map((role, idx) => (
            <span 
              key={idx}
              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted-area dark:bg-zinc-900 text-muted-text border border-border-theme dark:border-zinc-800"
            >
              {role}
            </span>
          ))}
          {track.targetPersonas.length > 3 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-muted-area dark:bg-zinc-900 text-muted-text">
              +{track.targetPersonas.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer Section: Progress & Actions */}
      <div className="pt-4 border-t border-border-theme/60 dark:border-zinc-800/80 space-y-3">
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-text">
            <span>Progress: {completedInTrack} of {track.lessons.length} lessons</span>
            <span className="font-mono">{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted-area dark:bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onSelectTrack(track)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-white text-xs font-black flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/20 cursor-pointer"
          >
            <span>{isCompleted ? "Review Track" : completedInTrack > 0 ? "Continue Learning" : "Start Track"}</span>
            <ArrowRight size={14} />
          </button>

          {track.associatedCertId && onOpenExam && (
            <button
              onClick={() => onOpenExam(track.associatedCertId!)}
              title="Take Certification Exam"
              className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer"
            >
              <Award size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
