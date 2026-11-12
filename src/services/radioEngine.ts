import { PlaylistItem } from "./playlistEngine";
import type { 
  RadioStation, 
  RadioProgram, 
  RadioBroadcast, 
  RadioScheduleSlot, 
  RadioSoundBranding, 
  RadioSnapshotData,
  RadioSettings,
  RadioBulletin,
  RadioBreakingAlert,
  RadioAnalytics,
  RadioVoiceProfile,
  RadioSponsorInfo
} from "../types/radio";

const RADIO_CACHE_KEY = "sanatan_radio_snapshot_v2";

export const SANATAN_RADIO_TAGLINE_NE = "नेपालको सभ्यतागत डिजिटल प्रसारण नेटवर्क";
export const SANATAN_RADIO_TAGLINE_EN = "Nepal's Civilizational Digital Broadcast Network";

export const DEFAULT_RADIO_STATION: RadioStation = {
  id: "sanatan-radio-main",
  nameNe: "सनातन रेडियो",
  nameEn: "Sanatan Radio",
  taglineNe: `${SANATAN_RADIO_TAGLINE_NE} — नेपालको आवाज, ज्ञान, संस्कृति र सनातन सभ्यताको रेडियो`,
  taglineEn: `${SANATAN_RADIO_TAGLINE_EN} — The Voice of Nepal's News, Knowledge, Culture & Civilization`,
  liveStreamUrl: "https://stream.zeno.fm/f32r4hbf684uv", // High Quality Public Stream Endpoint
  lowDataStreamUrl: "https://stream.zeno.fm/f32r4hbf684uv", // Low-Data Mobile Stream
  streamFormat: "mp3",
  isLiveBroadcasting: true,
  stationIntroNe: "तपाईं सुनिरहनुभएको छ — सनातन रेडियो, नेपालको सभ्यतागत डिजिटल प्रसारण नेटवर्क।",
  stationIntroEn: "You are listening to Sanatan Radio — Nepal's Civilizational Digital Broadcast Network.",
  updatedAt: new Date().toISOString()
};

export const DEFAULT_RADIO_BRANDING: RadioSoundBranding = {
  id: "main-branding",
  stationIntroNe: DEFAULT_RADIO_STATION.stationIntroNe!,
  stationIntroEn: DEFAULT_RADIO_STATION.stationIntroEn!,
  introEnabled: true,
  sonicLogoEnabled: true,
  breakingStingEnabled: true,
  sponsorEnabled: true,
  soundFrequencyMinutes: 20
};

export const DEFAULT_RADIO_SETTINGS: RadioSettings = {
  stationId: "sanatan-radio-main",
  autoPlayLiveStream: false,
  enableSonicBranding: true,
  enableAIBulletins: true,
  enableBreakingInterrupts: true,
  ttsVoiceNe: "Aoede",
  ttsVoiceEn: "Aoede",
  defaultVoiceProfile: "news_anchor",
  sponsorFrequencyMinutes: 30,
  maxAdsPerHour: 4,
  maxQueueSize: 50,
  updatedAt: new Date().toISOString()
};

export const DEFAULT_RADIO_ANALYTICS: RadioAnalytics = {
  currentListenersCount: 1240,
  peakListenersCount: 3890,
  totalPlaysCount: 48920,
  totalListenDurationSeconds: 894000,
  averageSessionMinutes: 24.5,
  completionRatePercent: 88.4,
  streamFailuresCount: 0,
  playsByBroadcastType: {
    live_stream: 32000,
    bulletin: 9500,
    podcast: 4200,
    station_id: 3220
  },
  topPrograms: [
    { programId: "prg-prabhat", titleNe: "प्रभात प्रभात जागरण र वेदवाणी", playsCount: 12400 },
    { programId: "prg-bulletin-midday", titleNe: "मध्याह्न राष्ट्रिय समाचार बुलेटिन", playsCount: 10800 },
    { programId: "prg-civilization-dialogue", titleNe: "सनातन सभ्यता र वर्तमान बहस", playsCount: 8900 }
  ],
  topDistricts: [
    { district: "काठमाडौँ", listenersCount: 420 },
    { district: "पोखरा", listenersCount: 180 },
    { district: "जनकपुरधाम", listenersCount: 140 },
    { district: "विराटनगर", listenersCount: 110 },
    { district: "बुटवल", listenersCount: 95 }
  ],
  updatedAt: new Date().toISOString()
};

export class RadioEngine {

  /**
   * Generates real-time broadcast clock formatted strings for live station headers
   */
  public static getBroadcastClock(now: Date = new Date()): {
    timeStr24: string;
    timeStr12: string;
    timeStrNe: string;
    dayNameNe: string;
    dayNameEn: string;
    dateStrNe: string;
    dateStrEn: string;
  } {
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");

    const timeStr24 = `${hours.toString().padStart(2, "0")}:${minutes}:${seconds}`;
    
    const ampm = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    const timeStr12 = `${hours12.toString().padStart(2, "0")}:${minutes}:${seconds} ${ampm}`;

    // Convert digits to Nepali numerals
    const convertToNe = (str: string) => {
      const neDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
      return str.replace(/\d/g, (d) => neDigits[parseInt(d)]);
    };

    const periodNe = hours < 6 ? "राति" : hours < 12 ? "बिहान" : hours < 16 ? "दिउँसो" : hours < 19 ? "साँझ" : "राति";
    const timeStrNe = `${periodNe} ${convertToNe(`${hours12.toString().padStart(2, "0")}:${minutes}:${seconds}`)}`;

    const dayNamesNe = ["आइतबार", "सोमबार", "मङ्गलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"];
    const dayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const dayOfWeek = now.getDay();
    const dayNameNe = dayNamesNe[dayOfWeek];
    const dayNameEn = dayNamesEn[dayOfWeek];

    const dateStrEn = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const dateStrNe = convertToNe(dateStrEn);

    return {
      timeStr24,
      timeStr12,
      timeStrNe,
      dayNameNe,
      dayNameEn,
      dateStrNe,
      dateStrEn
    };
  }

  /**
   * Fetches full radio station snapshot data from /api/radio-data
   * Utilizes SnapshotOS & local localStorage cache for offline resilience.
   */
  public static async fetchSnapshot(): Promise<RadioSnapshotData> {
    try {
      const res = await fetch("/api/radio-data");
      if (res.ok) {
        const data: RadioSnapshotData = await res.json();
        if (data && data.station) {
          try {
            localStorage.setItem(RADIO_CACHE_KEY, JSON.stringify(data));
          } catch (e) {
            // Ignore storage limit
          }
          return data;
        }
      }
    } catch (err) {
      console.warn("[RadioEngine] Network fetch failed for /api/radio-data, using local offline cache:", err);
    }

    // Cached fallback
    const cached = localStorage.getItem(RADIO_CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }

    // Default fallback structure
    return {
      station: DEFAULT_RADIO_STATION,
      programs: [
        {
          id: "prg-prabhat",
          titleNe: "प्रभात प्रभात जागरण र वेदवाणी",
          titleEn: "Morning Sunrise & Vedic Chants",
          slug: "morning-sunrise",
          descriptionNe: "प्रातःकालीन मङ्गल ध्वनि, वैदिक ऋचा, र दैनिक प्रभात समाचार समीक्षा।",
          descriptionEn: "Morning spiritual chants, Vedic hymns, and daily early news roundup.",
          hostNameNe: "आचार्य सुदर्शन घिमिरे",
          hostNameEn: "Acharya Sudarshan Ghimire",
          category: "संस्कृति र समाचार",
          scheduleMetadata: "दैनिक बिहान ०६:०० - ०७:३०",
          durationMinutes: 90,
          isFeatured: true,
          voiceProfile: "spiritual",
          updatedAt: new Date().toISOString()
        },
        {
          id: "prg-bulletin-midday",
          titleNe: "मध्याह्न राष्ट्रिय समाचार बुलेटिन",
          titleEn: "Midday National News Bulletin",
          slug: "midday-bulletin",
          descriptionNe: "देशभरका ७७ जिल्लाका मुख्य समाचार, विकास र नागरिक संवादको विस्तृत बुलेटिन।",
          descriptionEn: "Comprehensive midday news bulletin covering 77 districts of Nepal.",
          hostNameNe: "सान्त्वना शर्मा",
          hostNameEn: "Santwana Sharma",
          category: "राष्ट्रिय समाचार",
          scheduleMetadata: "दैनिक दिउँसो १२:०० - १२:३०",
          durationMinutes: 30,
          isFeatured: true,
          voiceProfile: "news_anchor",
          updatedAt: new Date().toISOString()
        },
        {
          id: "prg-civilization-dialogue",
          titleNe: "सनातन सभ्यता र वर्तमान बहस",
          titleEn: "Civilizational Heritage & Modern Debates",
          slug: "civilization-debates",
          descriptionNe: "नेपालको मौलिक दर्शन, पूर्वीय अर्थशास्त्र र सभ्यताको आधुनिक महत्त्वबारे संवाद।",
          descriptionEn: "In-depth discourse on Eastern philosophy, civilization, and contemporary Nepal.",
          hostNameNe: "डा. रामचन्द्र पोखरेल",
          hostNameEn: "Dr. Ramchandra Pokharel",
          category: "दर्शन र विचार",
          scheduleMetadata: "साँझ ०७:०० - ०८:००",
          durationMinutes: 60,
          isFeatured: true,
          voiceProfile: "narrator",
          updatedAt: new Date().toISOString()
        }
      ],
      schedule: [
        { id: "slot-1", programId: "prg-prabhat", programTitleNe: "प्रभात प्रभात जागरण र वेदवाणी", programTitleEn: "Morning Sunrise", hostNameNe: "आचार्य सुदर्शन", dayOfWeek: -1, startTime: "06:00", endTime: "07:30", durationMinutes: 90, broadcastType: "LIVE", isEnabled: true },
        { id: "slot-2", programId: "prg-bulletin-midday", programTitleNe: "मध्याह्न राष्ट्रिय समाचार बुलेटिन", programTitleEn: "Midday News", hostNameNe: "सान्त्वना शर्मा", dayOfWeek: -1, startTime: "12:00", endTime: "12:30", durationMinutes: 30, broadcastType: "BULLETIN", isEnabled: true },
        { id: "slot-3", programId: "prg-civilization-dialogue", programTitleNe: "सनातन सभ्यता र वर्तमान बहस", programTitleEn: "Civilization Debates", hostNameNe: "डा. रामचन्द्र", dayOfWeek: -1, startTime: "19:00", endTime: "20:00", durationMinutes: 60, broadcastType: "RECORDED", isEnabled: true }
      ],
      broadcasts: [],
      bulletins: [],
      soundBranding: DEFAULT_RADIO_BRANDING,
      settings: DEFAULT_RADIO_SETTINGS,
      analytics: DEFAULT_RADIO_ANALYTICS,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Resolves currently active program based on weekly schedule and current time
   * Calculates live progress percentage and remaining duration!
   */
  public static getCurrentProgramSlot(
    schedule: RadioScheduleSlot[],
    programs: RadioProgram[],
    now: Date = new Date()
  ): { 
    slot?: RadioScheduleSlot; 
    program?: RadioProgram;
    progressPercent: number;
    remainingMinutes: number;
    elapsedMinutes: number;
  } {
    if (!schedule || schedule.length === 0) {
      return { progressPercent: 0, remainingMinutes: 0, elapsedMinutes: 0 };
    }

    const currentDay = now.getDay(); // 0 = Sun
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const currentTimeStr = `${hours}:${minutes}`;

    const activeSlot = schedule.find((slot) => {
      if (!slot.isEnabled) return false;
      if (slot.dayOfWeek !== -1 && slot.dayOfWeek !== currentDay) return false;
      return currentTimeStr >= slot.startTime && currentTimeStr < slot.endTime;
    });

    if (activeSlot) {
      const prog = programs.find((p) => p.id === activeSlot.programId);

      // Calculate progress percentage
      const [startH, startM] = activeSlot.startTime.split(":").map(Number);
      const [endH, endM] = activeSlot.endTime.split(":").map(Number);

      const startTotalMin = startH * 60 + startM;
      const endTotalMin = endH * 60 + endM;
      const currentTotalMin = now.getHours() * 60 + now.getMinutes();

      const totalDuration = Math.max(1, endTotalMin - startTotalMin);
      const elapsedMinutes = Math.max(0, currentTotalMin - startTotalMin);
      const remainingMinutes = Math.max(0, totalDuration - elapsedMinutes);
      const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMinutes / totalDuration) * 100)));

      return {
        slot: activeSlot,
        program: prog,
        progressPercent,
        remainingMinutes,
        elapsedMinutes
      };
    }

    return { progressPercent: 0, remainingMinutes: 0, elapsedMinutes: 0 };
  }

  /**
   * Calculates the next upcoming scheduled program for today
   */
  public static getNextProgramSlot(
    schedule: RadioScheduleSlot[],
    programs: RadioProgram[],
    now: Date = new Date()
  ): {
    nextSlot?: RadioScheduleSlot;
    nextProgram?: RadioProgram;
    startsInMinutes: number;
  } {
    if (!schedule || schedule.length === 0) return { startsInMinutes: 0 };

    const currentDay = now.getDay();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const currentTimeStr = `${hours}:${minutes}`;

    const currentTotalMin = now.getHours() * 60 + now.getMinutes();

    const upcomingSlots = schedule
      .filter((s) => s.isEnabled && (s.dayOfWeek === -1 || s.dayOfWeek === currentDay) && s.startTime > currentTimeStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (upcomingSlots.length > 0) {
      const nextSlot = upcomingSlots[0];
      const nextProgram = programs.find((p) => p.id === nextSlot.programId);

      const [startH, startM] = nextSlot.startTime.split(":").map(Number);
      const startTotalMin = startH * 60 + startM;
      const startsInMinutes = Math.max(0, startTotalMin - currentTotalMin);

      return {
        nextSlot,
        nextProgram,
        startsInMinutes
      };
    }

    return { startsInMinutes: 0 };
  }

  /**
   * Detects schedule collisions (overlapping time slots on the same day)
   */
  public static detectScheduleCollisions(schedule: RadioScheduleSlot[]): string[] {
    const warnings: string[] = [];
    if (!schedule || schedule.length < 2) return warnings;

    const enabledSlots = schedule.filter((s) => s.isEnabled);

    for (let i = 0; i < enabledSlots.length; i++) {
      for (let j = i + 1; j < enabledSlots.length; j++) {
        const a = enabledSlots[i];
        const b = enabledSlots[j];

        const sameDay = a.dayOfWeek === b.dayOfWeek || a.dayOfWeek === -1 || b.dayOfWeek === -1;
        if (!sameDay) continue;

        if (a.startTime < b.endTime && a.endTime > b.startTime) {
          const dayName = a.dayOfWeek === -1 ? "सबै दिन (All Days)" : `Day ${a.dayOfWeek}`;
          warnings.push(
            `तालिका जुध्यो (Schedule Collision) [${dayName}]: "${a.programTitleNe}" (${a.startTime}-${a.endTime}) र "${b.programTitleNe}" (${b.startTime}-${b.endTime}) एउटै समयमा परेका छन्।`
          );
        }
      }
    }

    return warnings;
  }

  /**
   * Creates an audio Station Identification PlaylistItem
   */
  public static getStationIdPlaylistItem(
    station: RadioStation = DEFAULT_RADIO_STATION,
    branding: RadioSoundBranding = DEFAULT_RADIO_BRANDING
  ): PlaylistItem {
    return {
      id: `radio-station-id-${Date.now()}`,
      articleId: "station-id",
      title: "सनातन रेडियो — स्टेशन पहिचान",
      category: "Station Identification",
      imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop",
      contentSummary: branding.stationIntroNe || station.stationIntroNe || "यो सनातन मार्ग डिजिटल रेडियो हो।",
      audioUrl: branding.stationIdNeUrl || station.stationIntroAudioUrl,
      addedAt: new Date().toISOString(),
      slug: "station-id"
    };
  }

  /**
   * Injects RevenueOS Radio Sponsorship announcement prior to sponsored program
   */
  public static getSponsorAnnouncementItem(sponsor: RadioSponsorInfo): PlaylistItem {
    const textNe = `यो कार्यक्रम ${sponsor.sponsorNameNe || "हाम्रो प्रायोजक"} द्वारा प्रायोजित छ। ${sponsor.sponsorTaglineNe || ""}`;
    return {
      id: `radio-sponsor-${Date.now()}`,
      articleId: sponsor.campaignId || "sponsor-announcement",
      title: `RevenueOS रेडियो विज्ञापन — ${sponsor.sponsorNameNe || "प्रायोजक"}`,
      category: "RevenueOS Sponsorship",
      imageUrl: sponsor.sponsorLogoUrl || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop",
      contentSummary: textNe,
      audioUrl: sponsor.sponsorAudioUrl,
      addedAt: new Date().toISOString(),
      slug: "sponsor-announcement"
    };
  }

  /**
   * Formats a RadioBroadcast into a standard PlaylistItem for MediaOSContext
   */
  public static broadcastToPlaylistItem(
    broadcast: RadioBroadcast,
    stationName = "सनातन रेडियो"
  ): PlaylistItem {
    return {
      id: `radio-bc-${broadcast.id}`,
      articleId: broadcast.articleId || `bc-${broadcast.id}`,
      title: broadcast.titleNe || broadcast.titleEn,
      category: broadcast.category || stationName,
      district: broadcast.district,
      imageUrl: broadcast.coverImageUrl || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop",
      contentSummary: broadcast.summaryNe || broadcast.summaryEn || broadcast.titleNe,
      duration: broadcast.durationSeconds,
      audioUrl: broadcast.audioUrl || broadcast.streamUrl,
      addedAt: broadcast.publishedAt || new Date().toISOString(),
      slug: broadcast.id
    };
  }

  /**
   * Formats RadioStation live stream into a PlaylistItem for MediaOSContext
   */
  public static stationToPlaylistItem(
    station: RadioStation,
    currentProgramTitle?: string
  ): PlaylistItem {
    const programText = currentProgramTitle ? ` — ${currentProgramTitle}` : "";
    return {
      id: `radio-station-${station.id}`,
      articleId: station.id,
      title: `${station.nameNe}${programText}`,
      category: "सनातन डिजिटल रेडियो (LIVE)",
      imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop",
      contentSummary: `${station.taglineNe}। ${station.taglineEn}`,
      audioUrl: station.liveStreamUrl,
      addedAt: new Date().toISOString(),
      slug: "radio-live"
    };
  }
}
