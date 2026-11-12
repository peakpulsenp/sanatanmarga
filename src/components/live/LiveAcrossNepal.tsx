import { useState } from "react";
import { MapPin, Radio, ChevronRight, Globe2 } from "lucide-react";
import { LiveVideo } from "../../types/live";
import { useNavigate } from "react-router-dom";

interface LiveAcrossNepalProps {
  videos: LiveVideo[];
}

const PROVINCES_DATA = [
  { name: "कोशी प्रदेश (Koshi)", districts: ["विराटनगर", "झापा", "मोरङ", "सुनसरी", "इलाम", "पाँचथर", "ताप्लेजुङ", "संखुवासभा", "भोजपुर", "धनकुटा", "तेह्रथुम", "ओखलढुंगा", "खोटाङ", "सोलुखुम्बु"] },
  { name: "मधेश प्रदेश (Madhesh)", districts: ["जनकपुर", "वीरगञ्ज", "धनुषा", "महोत्तरी", "सर्लाही", "रौतहट", "बारा", "सप्तरी", "सिरहा"] },
  { name: "बागमती प्रदेश (Bagmati)", districts: ["काठमाडौं", "ललितपुर", "भक्तपुर", "चितवन", "हेटौँडा", "काभreपलाञ्चोक", "सिन्धुपाल्चोक", "दोलखा", "रामेछाप", "सिन्धुली", "धादिङ", "नुवाकोट", "रसुवा"] },
  { name: "गण्डकी प्रदेश (Gandaki)", districts: ["पोखरा", "गोरखा", "तनहुँ", "स्याङ्जा", "कास्की", "मनाङ", "मुस्ताङ", "म्याग्दी", "पर्वत", "बाग्लुङ", "नवलपुर"] },
  { name: "लुम्बिनी प्रदेश (Lumbini)", districts: ["बुटवल", "भैरहवा", "नेपालगञ्ज", "दाङ", "रूपन्देही", "कपिलवस्तु", "पाल्पा", "गुल्मी", "अर्घाखाँची", "प्युठान", "रोल्पा", "पूर्वी रुकुम", "बर्दिया", "नवलपरासी पश्चिम"] },
  { name: "कर्णाली प्रदेश (Karnali)", districts: ["सुर्खेत", "जुम्ला", "हुम्ला", "मुगु", "डोल्पा", "कालिकोट", "दैलेख", "जाजरकोट", "सल्यान", "पश्चिम रुकुम"] },
  { name: "सुदूरपश्चिम प्रदेश (Sudurpashchim)", districts: ["धनगढी", "महेन्द्रनगर", "कैलाली", "कञ्चनपुर", "डडेल्धुरा", "बैतडी", "दार्चुला", "बझाङ", "बाजुरा", "अछाम", "डोटी"] }
];

export default function LiveAcrossNepal({ videos }: LiveAcrossNepalProps) {
  const [selectedProvince, setSelectedProvince] = useState(PROVINCES_DATA[2].name); // Default Bagmati
  const [selectedDistrict, setSelectedDistrict] = useState<string>("काठमाडौं");
  const navigate = useNavigate();

  const currentProvObj = PROVINCES_DATA.find(p => p.name === selectedProvince) || PROVINCES_DATA[2];

  // Filter videos matching selected district or province
  const filteredVideos = videos.filter(v => {
    if (!v.district && !v.province) return true;
    const matchDist = selectedDistrict ? v.district?.includes(selectedDistrict) : true;
    const matchProv = v.province?.includes(selectedProvince.split(" ")[0]);
    return matchDist || matchProv;
  });

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Globe2 size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wide">
              📍 LIVE ACROSS NEPAL (७७ जिल्ला लाइभ हब)
            </h3>
            <p className="text-[11px] text-zinc-400">Select province and district for localized live feeds & updates</p>
          </div>
        </div>

        {/* PROVINCE TABS */}
        <div className="flex flex-wrap gap-1.5">
          {PROVINCES_DATA.map(prov => (
            <button
              key={prov.name}
              onClick={() => {
                setSelectedProvince(prov.name);
                setSelectedDistrict(prov.districts[0]);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedProvince === prov.name
                  ? "bg-amber-500 text-black shadow-md"
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              }`}
            >
              {prov.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* DISTRICT CHIPS FOR SELECTED PROVINCE */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <span className="text-xs font-bold text-zinc-400 whitespace-nowrap flex items-center gap-1">
          <MapPin size={13} className="text-amber-500" /> जिल्लाहरू:
        </span>
        {currentProvObj.districts.map(dist => (
          <button
            key={dist}
            onClick={() => setSelectedDistrict(dist)}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedDistrict === dist
                ? "bg-red-600 text-white shadow"
                : "bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
            }`}
          >
            {dist}
          </button>
        ))}
      </div>

      {/* FILTERED LIVE / RECENT STREAMS FOR DISTRICT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
        {filteredVideos.slice(0, 3).map(video => (
          <div
            key={video.id}
            onClick={() => navigate(`/live/${video.id}`)}
            className="group bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl p-3 cursor-pointer transition-all space-y-2"
          >
            <div className="flex items-center justify-between text-[10px]">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                {video.category || "स्थानिय समाचार"}
              </span>
              <span className="text-zinc-400 flex items-center gap-1">
                <MapPin size={10} className="text-red-500" />
                {selectedDistrict}
              </span>
            </div>
            <h4 className="text-xs font-bold text-zinc-100 group-hover:text-amber-400 transition-colors line-clamp-2">
              {video.title}
            </h4>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-900">
              <span>{video.broadcasterName || selectedDistrict + " मिडिया"}</span>
              <span className="text-amber-400 font-bold flex items-center gap-0.5">
                हेरनुहोस् <ChevronRight size={12} />
              </span>
            </div>
          </div>
        ))}
        {filteredVideos.length === 0 && (
          <div className="col-span-full py-8 text-center text-xs text-zinc-400">
            {selectedDistrict} क्षेत्रबाट हाल कुनै प्रत्यक्ष प्रसारण उपलब्ध छैन। राष्ट्रिय फीडबाट प्रदर्शन गरिएको छ।
          </div>
        )}
      </div>
    </div>
  );
}
