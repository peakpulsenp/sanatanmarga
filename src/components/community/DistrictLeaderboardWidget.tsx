import React, { useState } from "react";
import { Award, Trophy, MapPin, Sparkles, Crown, Shield, Star, Users } from "lucide-react";
import { REPUTATION_LEVELS } from "@/src/constants/permissions";

export default function DistrictLeaderboardWidget() {
  const [selectedDistrict, setSelectedDistrict] = useState("Kathmandu");

  const DISTRICT_LEADERBOARDS: Record<string, Array<{ name: string; pts: number; level: string; badge: string; avatar: string }>> = {
    Kathmandu: [
      { name: "रामेश्वर कोइराला", pts: 2450, level: "आचार्य (Acharya)", badge: "सभ्यता संरक्षक", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" },
      { name: "सुशीला श्रेष्ठ", pts: 1820, level: "संरक्षक (Guardian)", badge: "काठमाडौँ ब्युरो प्रमुख", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120" },
      { name: "दिनेश अधिकारी", pts: 1240, level: "विद्वान् (Scholar)", badge: "पशुपति अध्ययन क्लव", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120" },
    ],
    Kaski: [
      { name: "सुमन पोखरेल", pts: 1980, level: "संरक्षक (Guardian)", badge: "पोखरा उपत्यका समाचार", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=120" },
      { name: "आशा गुरुङ", pts: 1420, level: "विद्वान् (Scholar)", badge: "अन्नपूर्ण वातावरण ब्युरो", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120" },
    ],
    Morang: [
      { name: "अन्जिता क्षेत्री", pts: 1650, level: "संरक्षक (Guardian)", badge: "विराटनगर सांस्कृतिक ब्युरो", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120" },
      { name: "विकास राजवंशी", pts: 980, level: "संवाददाता (Reporter)", badge: "सप्तकोशी रिपोेर्टर", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120" },
    ]
  };

  const currentLeaderboard = DISTRICT_LEADERBOARDS[selectedDistrict] || DISTRICT_LEADERBOARDS["Kathmandu"];

  return (
    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold font-display text-foreground text-sm flex items-center gap-2">
            <Trophy className="text-amber-500" size={16} />
            <span>जिल्ला अनुसार उत्कृष्ट योगदानकर्ता (District Leaderboard)</span>
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            प्रमाणित चौतारी पोस्ट, नागरिक समाचार र ज्ञानकोष योगदानमा आधारित।
          </p>
        </div>

        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          className="p-1.5 rounded-xl border border-border bg-background text-xs font-bold text-foreground"
        >
          <option value="Kathmandu">काठमाडौँ (Kathmandu)</option>
          <option value="Kaski">कास्की (Kaski)</option>
          <option value="Morang">मोरङ (Morang)</option>
        </select>
      </div>

      <div className="space-y-2">
        {currentLeaderboard.map((user, idx) => (
          <div key={idx} className="p-3 rounded-xl border border-border bg-accent/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-amber-500/30" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center font-mono">
                  {idx + 1}
                </span>
              </div>
              <div>
                <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <span>{user.name}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">
                    {user.level}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground">{user.badge}</div>
              </div>
            </div>

            <div className="text-right">
              <div className="font-mono text-xs font-bold text-amber-500">{user.pts} pts</div>
              <div className="text-[9px] text-emerald-500 font-bold">सक्रिय योगदानकर्ता</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
