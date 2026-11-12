import { Calendar, Bell, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { LiveVideo } from "../../types/live";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface UpcomingLiveProps {
  scheduled: LiveVideo[];
}

export default function UpcomingLive({ scheduled }: UpcomingLiveProps) {
  const navigate = useNavigate();

  const handleRemindMe = (e: React.MouseEvent, video: LiveVideo) => {
    e.stopPropagation();
    toast.success(`"${video.title}" को लागि सूचना सेट गरियो! प्रसारण सुरु हुनासाथ तपाईंलाई सूचित गरिनेछ।`);
  };

  if (!scheduled || scheduled.length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 text-center">
        <p className="text-xs text-zinc-400">हाल कुनै आगामी कार्यक्रम तालिकामा छैन (No upcoming streams scheduled)</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wide">
              🕐 UPCOMING LIVE (आगामी प्रत्यक्ष कार्यक्रमहरू)
            </h3>
            <p className="text-[11px] text-zinc-400">Scheduled parliamentary sessions, press briefings & cultural broadcasts</p>
          </div>
        </div>
        <span className="text-xs font-mono text-purple-400 font-bold">
          {scheduled.length} Scheduled
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {scheduled.map((video) => (
          <div
            key={video.id}
            onClick={() => navigate(`/live/${video.id}`)}
            className="group bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl p-4 cursor-pointer transition-all space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold uppercase">
                  SCHEDULED
                </span>
                {video.scheduledAt && (
                  <span className="text-zinc-400 font-mono flex items-center gap-1">
                    <Clock size={11} className="text-amber-500" />
                    {new Date(video.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              <h4 className="text-xs font-black text-zinc-100 group-hover:text-amber-400 transition-colors line-clamp-2">
                {video.title}
              </h4>

              {(video.province || video.district) && (
                <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <MapPin size={12} className="text-amber-500" />
                  <span>{video.district || video.province}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-900 flex items-center justify-between">
              <span className="text-[10px] text-zinc-400">{video.broadcasterName || "सनातन मार्ग"}</span>
              <button
                onClick={(e) => handleRemindMe(e, video)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Bell size={12} />
                <span>Remind me</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
