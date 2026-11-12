import { MembershipTier } from "./articleModuleRegistry";
import type { PlaylistItem } from "./playlistEngine";
import { db, setDoc, safeOnSnapshot, isFirestoreNetworkDisabled, auth } from "@/src/lib/firebase";
import { doc } from "@/src/lib/firebase";

export interface SponsorAudioCampaign {
  id: string;
  sponsorName: string;
  sponsorLogoUrl?: string;
  audioTitle: string;
  audioUrl: string;
  duration?: number;
  startDate: string; // ISO or YYYY-MM-DD
  endDate: string; // ISO or YYYY-MM-DD
  active: boolean;
  priority: number; // 1 (low) - 10 (high)
  frequency: number; // e.g. 3 = insert after every 3 news articles
  targetAudience: 'all' | 'free' | 'member' | 'premium';
  targetPlacement: 'floating_player' | 'playlist' | 'article_reader' | 'all';
  maxPlaysPerSession?: number;
  maxPlaysPerUserPerDay?: number;
  skipAllowed: boolean;
  impressionsCount: number;
  playCount: number;
  createdAt: string;
}

const STORAGE_KEY_SPONSORS = "sanatan_listenos_sponsors_v1";

const SEED_SPONSORS: SponsorAudioCampaign[] = [
  {
    id: "sp-nepal-telecom-1",
    sponsorName: "Nepal Telecom (NTC)",
    sponsorLogoUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&auto=format&fit=crop",
    audioTitle: "नेपाल टेलिकम ५जी र डिजिटल नेपाल सन्देश",
    audioUrl: "https://actions.google.com/sounds/v1/ambiences/waves_crashing.ogg", // Sample audio stream
    duration: 15,
    startDate: "2026-01-01",
    endDate: "2027-12-31",
    active: true,
    priority: 8,
    frequency: 3,
    targetAudience: "free",
    targetPlacement: "all",
    maxPlaysPerSession: 3,
    maxPlaysPerUserPerDay: 10,
    skipAllowed: true,
    impressionsCount: 1420,
    playCount: 980,
    createdAt: new Date().toISOString()
  },
  {
    id: "sp-nabil-bank-1",
    sponsorName: "Nabil Bank Ltd",
    sponsorLogoUrl: "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=100&auto=format&fit=crop",
    audioTitle: "नबिल डिजिटल बैंकिङ र हरित ऊर्जा लगानी",
    audioUrl: "https://actions.google.com/sounds/v1/ambiences/gentle_stream.ogg",
    duration: 12,
    startDate: "2026-01-01",
    endDate: "2027-12-31",
    active: true,
    priority: 9,
    frequency: 3,
    targetAudience: "free",
    targetPlacement: "all",
    maxPlaysPerSession: 4,
    maxPlaysPerUserPerDay: 12,
    skipAllowed: false,
    impressionsCount: 2310,
    playCount: 1840,
    createdAt: new Date().toISOString()
  }
];

class SponsorAudioRegistry {
  private campaigns: SponsorAudioCampaign[] = [];
  private listeners: Set<(campaigns: SponsorAudioCampaign[]) => void> = new Set();
  private unsubFirestore: (() => void) | null = null;

  constructor() {
    this.loadCampaigns();
    this.initFirestoreSync();
  }

  private loadCampaigns(): void {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(STORAGE_KEY_SPONSORS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.campaigns = parsed;
            return;
          }
        }
      }
    } catch (e) {
      console.warn("[SponsorAudioRegistry] LocalStorage load failed, using seed:", e);
    }
    this.campaigns = [...SEED_SPONSORS];
    this.saveCampaigns();
  }

  private initFirestoreSync(): void {
    if (typeof window === "undefined") return;

    if (isFirestoreNetworkDisabled()) {
      console.info("[SponsorAudioRegistry] Continuity Mode active, skipping real-time firestore listener.");
      return;
    }

    // Real-time listener for Firestore document `listenos_config/sponsor_campaigns`
    try {
      const docRef = doc(db, "listenos_config", "sponsor_campaigns");
      this.unsubFirestore = safeOnSnapshot(docRef, (snapshot) => {
        if (snapshot && snapshot.exists()) {
          const data = snapshot.data();
          if (data && Array.isArray(data.campaigns)) {
            this.campaigns = data.campaigns;
            try {
              localStorage.setItem(STORAGE_KEY_SPONSORS, JSON.stringify(this.campaigns));
            } catch (e) {}
            this.notify();
          }
        }
      }, "sponsor_campaigns_realtime");
    } catch (err) {
      console.warn("[SponsorAudioRegistry] Firestore sync setup skipped:", err);
    }

    // Cross-tab broadcast listener
    try {
      window.addEventListener("storage", (e) => {
        if (e.key === STORAGE_KEY_SPONSORS && e.newValue) {
          try {
            this.campaigns = JSON.parse(e.newValue);
            this.notify();
          } catch (err) {}
        }
      });
    } catch (e) {}
  }

  private saveCampaigns(): void {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_SPONSORS, JSON.stringify(this.campaigns));
        window.dispatchEvent(new CustomEvent("listenos-sponsors-updated", { detail: this.campaigns }));
      }
    } catch (e) {
      console.warn("[SponsorAudioRegistry] Unable to save campaigns locally:", e);
    }

    // Only attempt Firestore write if network is enabled AND user has staff/admin permissions
    if (!isFirestoreNetworkDisabled()) {
      const currentUser = auth?.currentUser;
      const isStaff = currentUser && (
        currentUser.email === 'sagarrana@gmail.com' ||
        (currentUser as any).role === 'admin' ||
        (currentUser as any).role === 'super_admin' ||
        (currentUser as any).role === 'editor'
      );

      if (isStaff) {
        try {
          const docRef = doc(db, "listenos_config", "sponsor_campaigns");
          setDoc(docRef, { campaigns: this.campaigns, updatedAt: new Date().toISOString() }, { merge: true }).catch((err) => {
            console.warn("[SponsorAudioRegistry] Firestore sync doc write fallback:", err?.message);
          });
        } catch (err) {
          console.warn("[SponsorAudioRegistry] Firestore save skipped:", err);
        }
      }
    }

    this.notify();
  }

  private notify(): void {
    const list = this.getCampaigns();
    this.listeners.forEach((cb) => cb(list));
  }

  public subscribe(cb: (campaigns: SponsorAudioCampaign[]) => void): () => void {
    this.listeners.add(cb);
    cb(this.getCampaigns());
    return () => this.listeners.delete(cb);
  }

  public getCampaigns(): SponsorAudioCampaign[] {
    return [...this.campaigns];
  }

  public getActiveCampaigns(): SponsorAudioCampaign[] {
    const todayStr = new Date().toISOString().split('T')[0];
    return this.campaigns.filter((c) => {
      if (!c.active) return false;
      if (c.startDate && c.startDate > todayStr) return false;
      if (c.endDate && c.endDate < todayStr) return false;
      return true;
    });
  }

  /**
   * Fast toggle in Admin to disable/enable a sponsor campaign immediately
   */
  public toggleActive(id: string, active: boolean): void {
    this.campaigns = this.campaigns.map((c) =>
      c.id === id ? { ...c, active } : c
    );
    this.saveCampaigns();
  }

  public addCampaign(campaignData: Omit<SponsorAudioCampaign, 'id' | 'impressionsCount' | 'playCount' | 'createdAt'>): SponsorAudioCampaign {
    const newCampaign: SponsorAudioCampaign = {
      ...campaignData,
      id: `sp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      impressionsCount: 0,
      playCount: 0,
      createdAt: new Date().toISOString()
    };
    this.campaigns = [newCampaign, ...this.campaigns];
    this.saveCampaigns();
    return newCampaign;
  }

  public updateCampaign(id: string, updates: Partial<SponsorAudioCampaign>): void {
    this.campaigns = this.campaigns.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    this.saveCampaigns();
  }

  public deleteCampaign(id: string): void {
    this.campaigns = this.campaigns.filter((c) => c.id !== id);
    this.saveCampaigns();
  }

  public recordPlay(campaignId: string): void {
    this.campaigns = this.campaigns.map((c) =>
      c.id === campaignId ? { ...c, playCount: c.playCount + 1 } : c
    );
    this.saveCampaigns();
  }

  public recordImpression(campaignId: string): void {
    this.campaigns = this.campaigns.map((c) =>
      c.id === campaignId ? { ...c, impressionsCount: c.impressionsCount + 1 } : c
    );
    this.saveCampaigns();
  }

  /**
   * Evaluates active sponsor campaigns against membership entitlement and converts to PlaylistItem[]
   * CRITICAL INVARIANT: PREMIUM members get ZERO sponsor tracks (Sponsor-Free policy)
   */
  public getEligibleSponsorTracks(userTier: MembershipTier = 'free', placement: string = 'all'): PlaylistItem[] {
    // 1. Premium Membership = 100% Sponsor-Free
    if (userTier === 'premium') {
      return [];
    }

    const active = this.getActiveCampaigns();
    
    // Filter by target audience and placement
    const eligible = active.filter((c) => {
      if (placement !== 'all' && c.targetPlacement !== 'all' && c.targetPlacement !== placement) {
        return false;
      }
      if (c.targetAudience === 'free' && userTier !== 'free') return false;
      if (c.targetAudience === 'member' && userTier !== 'member' && userTier !== 'free') return false;
      return true;
    });

    // Sort by priority descending
    eligible.sort((a, b) => b.priority - a.priority);

    return eligible.map((c) => ({
      id: `sponsor-item-${c.id}`,
      articleId: `sponsor-art-${c.id}`,
      title: `[प्रायोजित सन्देश] ${c.audioTitle}`,
      category: `प्रायोजित (${c.sponsorName})`,
      contentSummary: `प्रायोजक: ${c.sponsorName} — ${c.audioTitle}`,
      duration: c.duration || 15,
      audioUrl: c.audioUrl,
      addedAt: new Date().toISOString(),
      isSponsor: true,
      sponsorName: c.sponsorName,
      sponsorLogoUrl: c.sponsorLogoUrl,
      sponsorCampaignId: c.id,
      skipAllowed: c.skipAllowed !== false
    }));
  }
}

export const sponsorAudioRegistry = new SponsorAudioRegistry();
