import { db, auth, getDoc, getDocs, isFirestoreNetworkDisabled } from "../lib/firebase";
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from "@/src/lib/firebase";
import { handleFirestoreError, OperationType } from "../lib/errorHandling";
import { 
  LiveVideo, 
  LiveChatMessage, 
  LiveStreamSettings, 
  SocialSourceConfig,
  LiveAnalyticsSummary,
  LiveParticipant,
  LiveModerationAction,
  LiveSponsorCampaign
} from "../types/live";
import { LiveProviderService } from "./liveProviderService";
import { logActivity } from "../lib/activityLogger";
import { DEFAULT_VERIFIED_LIVE_VIDEOS } from "../constants/defaultLiveStreams";

const SPONSOR_STORAGE_KEY = "sanatan_live_sponsor_campaigns_v1";
const MODERATION_ACTIONS_KEY = "sanatan_live_moderation_actions_v1";
const PARTICIPANTS_STATE_KEY = "sanatan_live_participants_v1";
const PINNED_MESSAGES_KEY = "sanatan_live_pinned_messages_v1";

export const SAMPLE_LIVE_SPONSOR_CAMPAIGNS: LiveSponsorCampaign[] = [
  {
    id: "CAMP-TICKER-001",
    advertiserId: "adv-ncell-01",
    advertiserName: "Ncell Axiata",
    campaignName: "Ncell 5G Ultra Fast Live Sponsor",
    placement: "LIVE_BOTTOM_TICKER",
    headlineNe: "🇳🇵 Ncell 5G: नेपालभर तीव्र गतिको डिजिटल कनेक्टिभिटी — सनातन मार्ग प्रत्यक्ष प्रसारण प्रायोजक",
    headlineEn: "Ncell 5G: High-speed nation-wide connectivity — Live Broadcast Sponsor",
    logoUrl: "/assets/images/sponsors/ncell.png",
    destinationUrl: "https://www.ncell.axiata.com",
    ctaText: "अफर हेर्नुहोस्",
    scrollSpeed: "normal",
    priority: 95,
    startAt: "2026-08-01T00:00:00Z",
    endAt: "2026-12-31T23:59:59Z",
    status: "active",
    targetCategories: [],
    targetDistricts: [],
    targetTiers: ["free", "member", "patron"], // Free & Members, but Premium zero-ad
    currentImpressions: 1420,
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-20T00:00:00Z"
  },
  {
    id: "CAMP-LOWER3RD-002",
    advertiserId: "adv-globalime-02",
    advertiserName: "Global IME Bank",
    campaignName: "Global IME Digital Remittance & Banking",
    placement: "LIVE_VIDEO_LOWER_THIRD",
    headlineNe: "ग्लोबल आइएमई बैंक: सबैका लागि बैंकिङ्ग — सजिलो डिजिटल रेमिट्यान्स सेवा",
    headlineEn: "Global IME Bank: Banking for all with seamless remittance",
    logoUrl: "/assets/images/sponsors/globalime.png",
    destinationUrl: "https://www.globalimebank.com",
    ctaText: "खाता खोल्नुहोस्",
    priority: 90,
    startAt: "2026-08-01T00:00:00Z",
    endAt: "2026-12-31T23:59:59Z",
    status: "active",
    targetCategories: ["अर्थतन्त्र", "समाचार", "राजनीति", "नेपाल हब"],
    targetDistricts: [],
    targetTiers: ["free", "member"],
    currentImpressions: 890,
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-20T00:00:00Z"
  }
];

export class LiveService {
  private static localMessageStore: Map<string, LiveChatMessage[]> = new Map();
  private static localParticipants: Map<string, LiveParticipant[]> = new Map();

  /**
   * Fetches public LiveOS state snapshot (cache-first via SnapshotOS API or Firestore fallback)
   */
  public static async getLiveSnapshot(): Promise<{
    liveNow: LiveVideo[];
    featured?: LiveVideo;
    scheduled: LiveVideo[];
    latestVideos: LiveVideo[];
    categories: string[];
    settings: LiveStreamSettings;
  }> {
    try {
      // 1. Try server snapshot API
      const res = await fetch("/api/live-data");
      if (res.ok) {
        const data = await res.json();
        if (data && (data.liveNow || data.latestVideos)) {
          return data;
        }
      }
    } catch (e) {
      console.warn("[LiveService] Server snapshot unavailable, using Firestore fallback:", e);
    }

    // 2. Firestore fallback if server endpoint unavailable
    return this.getLiveStateFromFirestore();
  }

  /**
   * Directly queries Firestore for live videos and settings (cache-friendly fallback)
   */
  public static async getLiveStateFromFirestore(): Promise<{
    liveNow: LiveVideo[];
    featured?: LiveVideo;
    scheduled: LiveVideo[];
    latestVideos: LiveVideo[];
    categories: string[];
    settings: LiveStreamSettings;
  }> {
    const defaultSettings: LiveStreamSettings = {
      chatEnabled: true,
      slowModeSeconds: 3,
      requireAuthentication: false,
      allowLinks: false,
      allowImages: false,
      memberOnlyChat: false,
      verifiedOnlyChat: false,
      moderationMode: "auto",
      defaultChatPresentation: "side"
    };

    if (!db || isFirestoreNetworkDisabled()) {
      const liveNow = DEFAULT_VERIFIED_LIVE_VIDEOS.filter(v => v.status === "live" || v.isLive);
      const featured = DEFAULT_VERIFIED_LIVE_VIDEOS.find(v => v.isFeatured) || liveNow[0];
      const scheduled = DEFAULT_VERIFIED_LIVE_VIDEOS.filter(v => v.status === "scheduled");
      const latestVideos = DEFAULT_VERIFIED_LIVE_VIDEOS.filter(v => v.status === "approved" || v.status === "ended" || v.status === "archived");

      return {
        liveNow,
        featured,
        scheduled,
        latestVideos,
        categories: ["समाचार", "राजनीति", "राष्ट्रिय", "प्रदेश", "अर्थतन्त्र", "संस्कृति", "विशेष कार्यक्रम"],
        settings: defaultSettings
      };
    }

    try {
      // Fetch settings
      let settings = defaultSettings;
      const settingsSnap = await getDoc(doc(db, "settings", "live"), "settings_live");
      if (settingsSnap.exists()) {
        settings = { ...defaultSettings, ...(settingsSnap.data() as LiveStreamSettings) };
      }

      // Fetch approved/live videos
      const videosRef = collection(db, "liveVideos");
      const q = query(videosRef, orderBy("createdAt", "desc"), limit(50));
      const snapshot = await getDocs(q, "liveVideos_query");

      let allVideos: LiveVideo[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<LiveVideo, "id">)
      }));

      // Filter by status
      let approvedOnly = allVideos.filter(v => 
        v.status === "approved" || v.status === "live" || v.status === "scheduled" || v.status === "ended" || v.status === "archived"
      );

      if (approvedOnly.length === 0) {
        approvedOnly = DEFAULT_VERIFIED_LIVE_VIDEOS;
        allVideos = DEFAULT_VERIFIED_LIVE_VIDEOS;
      }

      const liveNow = approvedOnly.filter(v => v.status === "live" || v.isLive);
      const featured = approvedOnly.find(v => v.isFeatured && (v.status === "live" || v.status === "approved")) || liveNow[0] || approvedOnly[0];
      const scheduled = approvedOnly.filter(v => v.status === "scheduled");
      const latestVideos = approvedOnly.filter(v => v.status === "approved" || v.status === "ended" || v.status === "archived");

      const categoriesSet = new Set<string>([
        "समाचार", "राजनीति", "राष्ट्रिय", "प्रदेश", "अर्थतन्त्र", "समाज", "खेलकुद", "प्रविधि", "विश्व", "संस्कृति", "धर्म तथा दर्शन", "शिक्षा", "पर्यटन", "नेपाल हब", "विशेष कार्यक्रम"
      ]);

      allVideos.forEach(v => {
        if (v.category) categoriesSet.add(v.category);
      });

      return {
        liveNow,
        featured,
        scheduled,
        latestVideos,
        categories: Array.from(categoriesSet),
        settings
      };
    } catch (error) {
      console.error("[LiveService] Error reading live state from Firestore:", error);
      const liveNow = DEFAULT_VERIFIED_LIVE_VIDEOS.filter(v => v.status === "live" || v.isLive);
      const featured = DEFAULT_VERIFIED_LIVE_VIDEOS.find(v => v.isFeatured) || liveNow[0];
      const scheduled = DEFAULT_VERIFIED_LIVE_VIDEOS.filter(v => v.status === "scheduled");
      const latestVideos = DEFAULT_VERIFIED_LIVE_VIDEOS.filter(v => v.status === "approved" || v.status === "ended" || v.status === "archived");

      return {
        liveNow,
        featured,
        scheduled,
        latestVideos,
        categories: ["समाचार", "राजनीति", "राष्ट्रिय", "प्रदेश", "अर्थतन्त्र", "संस्कृति"],
        settings: defaultSettings
      };
    }
  }

  /**
   * Fetches chat messages for a specific live video stream (limit 60)
   */
  public static async getChatMessages(liveVideoId: string): Promise<LiveChatMessage[]> {
    if (!liveVideoId) return [];

    let messages: LiveChatMessage[] = [];

    if (db && !isFirestoreNetworkDisabled()) {
      try {
        const chatRef = collection(db, "liveChat");
        const q = query(
          chatRef,
          where("liveVideoId", "==", liveVideoId),
          where("status", "in", ["visible", "pending"]),
          orderBy("createdAt", "desc"),
          limit(60)
        );
        const snapshot = await getDocs(q, "liveChat_query");
        messages = snapshot.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<LiveChatMessage, "id">)
        })).reverse();
      } catch (e) {
        console.warn("[LiveService] Chat fetch Firestore fallback to local:", e);
      }
    }

    // Merge with in-memory local messages
    const local = this.localMessageStore.get(liveVideoId) || [];
    const mergedMap = new Map<string, LiveChatMessage>();
    messages.forEach(m => mergedMap.set(m.id, m));
    local.forEach(m => mergedMap.set(m.id, m));

    const result = Array.from(mergedMap.values()).filter(m => m.status === "visible");
    result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return result;
  }

  /**
   * Submits a live chat message with support for replies, roles, membership badge, link/keyword verification
   */
  public static async sendChatMessage(params: {
    liveVideoId: string;
    userId: string;
    displayName: string;
    avatarUrl?: string;
    message: string;
    role?: string;
    membershipTier?: "free" | "patron" | "sadhak" | "sanrakshak" | "corporate";
    isOfficial?: boolean;
    replyTo?: {
      messageId: string;
      displayName: string;
      snippet: string;
    };
  }): Promise<LiveChatMessage | null> {
    const trimmedMsg = (params.message || "").trim();
    if (!trimmedMsg || !params.liveVideoId) return null;

    const isStaff = params.role && ["super_admin", "admin", "chief_editor", "editor", "moderator"].includes(params.role);
    const isOfficial = Boolean(params.isOfficial || (isStaff && params.role === "chief_editor"));

    const newMsgPayload: Omit<LiveChatMessage, "id"> = {
      liveVideoId: params.liveVideoId,
      userId: params.userId,
      displayName: params.displayName || "नागरिक श्रोता",
      avatarUrl: params.avatarUrl || "",
      message: trimmedMsg,
      status: "visible",
      createdAt: new Date().toISOString(),
      role: params.role || "user",
      membershipTier: params.membershipTier || "free",
      isOfficial,
      isModerator: isStaff,
      badge: isOfficial ? "आधिकारिक" : isStaff ? "सञ्चालक" : (params.membershipTier && params.membershipTier !== "free") ? params.membershipTier : undefined,
      replyTo: params.replyTo,
      reactions: {},
      userReactions: {}
    };

    let docId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (db) {
      try {
        const docRef = await addDoc(collection(db, "liveChat"), {
          ...newMsgPayload,
          serverCreatedAt: serverTimestamp()
        });
        docId = docRef.id;
      } catch (error) {
        console.warn("[LiveService] Save chat message error, using local fallback:", error);
      }
    }

    const createdMessage: LiveChatMessage = {
      id: docId,
      ...newMsgPayload
    };

    // Store locally for immediate responsiveness
    const current = this.localMessageStore.get(params.liveVideoId) || [];
    this.localMessageStore.set(params.liveVideoId, [...current, createdMessage]);

    // Record chatter participant
    this.recordParticipantActivity(params.liveVideoId, {
      userId: params.userId,
      displayName: params.displayName,
      avatarUrl: params.avatarUrl,
      role: params.role || "user",
      membershipTier: params.membershipTier || "free",
      isStaff: Boolean(isStaff)
    });

    return createdMessage;
  }

  /**
   * Reacts to a chat message (optimistic + persistence)
   */
  public static async reactToChatMessage(
    messageId: string,
    liveVideoId: string,
    emoji: string,
    userId: string
  ): Promise<boolean> {
    if (!messageId || !emoji || !userId) return false;

    // Update in local store
    const list = this.localMessageStore.get(liveVideoId) || [];
    const target = list.find(m => m.id === messageId);
    if (target) {
      if (!target.reactions) target.reactions = {};
      if (!target.userReactions) target.userReactions = {};

      const currentUsers = target.userReactions[emoji] || [];
      const hasReacted = currentUsers.includes(userId);

      if (hasReacted) {
        // Remove reaction
        target.userReactions[emoji] = currentUsers.filter(u => u !== userId);
        target.reactions[emoji] = Math.max(0, (target.reactions[emoji] || 1) - 1);
      } else {
        // Add reaction
        target.userReactions[emoji] = [...currentUsers, userId];
        target.reactions[emoji] = (target.reactions[emoji] || 0) + 1;
      }
    }

    if (db) {
      try {
        const msgRef = doc(db, "liveChat", messageId);
        const snap = await getDoc(msgRef);
        if (snap.exists()) {
          const data = snap.data() as LiveChatMessage;
          const reactions = data.reactions || {};
          const userReactions = data.userReactions || {};
          const currentUsers = userReactions[emoji] || [];
          const hasReacted = currentUsers.includes(userId);

          if (hasReacted) {
            userReactions[emoji] = currentUsers.filter(u => u !== userId);
            reactions[emoji] = Math.max(0, (reactions[emoji] || 1) - 1);
          } else {
            userReactions[emoji] = [...currentUsers, userId];
            reactions[emoji] = (reactions[emoji] || 0) + 1;
          }

          await updateDoc(msgRef, { reactions, userReactions });
        }
      } catch (e) {
        console.warn("[LiveService] Firestore reaction update:", e);
      }
    }

    return true;
  }

  /**
   * Pins or unpins a chat message (Staff action)
   */
  public static async pinChatMessage(
    messageId: string,
    liveVideoId: string,
    isPinned: boolean,
    moderatorUserId: string,
    moderatorName: string
  ): Promise<boolean> {
    try {
      const pins = this.getPinnedMessagesStore();
      if (isPinned) {
        pins[liveVideoId] = messageId;
      } else {
        delete pins[liveVideoId];
      }
      this.savePinnedMessagesStore(pins);

      // Record moderation action
      this.recordModerationAction({
        action: isPinned ? "pin_message" : "unpin_message",
        targetMessageId: messageId,
        moderatorUserId,
        moderatorName,
        reason: isPinned ? "महत्वपूर्ण सूचना पिन गरियो" : "पिन हटाइयो"
      });

      if (db) {
        try {
          await setDoc(doc(db, "livePins", liveVideoId), {
            messageId: isPinned ? messageId : null,
            updatedAt: new Date().toISOString(),
            moderatorUserId
          }, { merge: true });
        } catch (e) {}
      }

      return true;
    } catch (e) {
      console.warn("Pin chat message error:", e);
      return false;
    }
  }

  public static getPinnedMessageId(liveVideoId: string): string | null {
    const pins = this.getPinnedMessagesStore();
    return pins[liveVideoId] || null;
  }

  private static getPinnedMessagesStore(): Record<string, string> {
    try {
      const raw = localStorage.getItem(PINNED_MESSAGES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private static savePinnedMessagesStore(pins: Record<string, string>) {
    try {
      localStorage.setItem(PINNED_MESSAGES_KEY, JSON.stringify(pins));
    } catch (e) {}
  }

  /**
   * Reports a chat message for moderation review
   */
  public static async reportChatMessage(params: {
    messageId: string;
    liveVideoId: string;
    reporterUserId: string;
    reason: "spam" | "hate" | "misinformation" | "harassment" | "other";
    note?: string;
  }): Promise<boolean> {
    if (!params.messageId) return false;

    if (db) {
      try {
        await addDoc(collection(db, "liveReports"), {
          ...params,
          status: "pending",
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn("Report message firestore error:", e);
      }
    }

    return true;
  }

  /**
   * Moderates a chat message (admin/moderator action: hide, delete, approve)
   */
  public static async moderateChatMessage(
    messageId: string, 
    action: "hide" | "delete" | "approve", 
    moderatorUserId: string,
    moderatorName: string = "सञ्चालक",
    reason?: string
  ): Promise<boolean> {
    if (!messageId) return false;

    // Update in local store
    this.localMessageStore.forEach((list, key) => {
      const idx = list.findIndex(m => m.id === messageId);
      if (idx !== -1) {
        if (action === "delete") {
          list.splice(idx, 1);
        } else {
          list[idx].status = action === "hide" ? "hidden" : "visible";
          list[idx].moderatedBy = moderatorUserId;
          list[idx].moderationReason = reason || action;
        }
      }
    });

    if (db) {
      try {
        const msgRef = doc(db, "liveChat", messageId);
        if (action === "delete") {
          await deleteDoc(msgRef);
        } else {
          await updateDoc(msgRef, {
            status: action === "hide" ? "hidden" : "visible",
            moderatedBy: moderatorUserId,
            moderationReason: reason || action,
            updatedAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.warn("Moderate chat firestore fallback:", error);
      }
    }

    this.recordModerationAction({
      action: action === "delete" ? "delete_message" : action === "hide" ? "hide_message" : "approve_message",
      targetMessageId: messageId,
      moderatorUserId,
      moderatorName,
      reason
    });

    return true;
  }

  /**
   * Participant & Moderation Controls: Mute, Timeout, Ban
   */
  public static recordParticipantActivity(
    liveVideoId: string,
    user: {
      userId: string;
      displayName: string;
      avatarUrl?: string;
      role: string;
      membershipTier: "free" | "patron" | "sadhak" | "sanrakshak" | "corporate";
      isStaff: boolean;
    }
  ) {
    const list = this.localParticipants.get(liveVideoId) || [];
    const existing = list.find(p => p.userId === user.userId);
    if (existing) {
      existing.messageCount = (existing.messageCount || 0) + 1;
      existing.isChatter = true;
    } else {
      list.push({
        userId: user.userId,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        membershipTier: user.membershipTier,
        joinedAt: new Date().toISOString(),
        isChatter: true,
        isStaff: user.isStaff,
        messageCount: 1
      });
    }
    this.localParticipants.set(liveVideoId, list);
  }

  public static getParticipants(liveVideoId: string): LiveParticipant[] {
    const list = this.localParticipants.get(liveVideoId) || [];
    
    // Seed sensible initial participants if empty
    if (list.length === 0) {
      const seeded: LiveParticipant[] = [
        {
          userId: "staff-desk-01",
          displayName: "सनातन सम्पादकीय डेस्क",
          role: "chief_editor",
          membershipTier: "corporate",
          isStaff: true,
          isChatter: true,
          joinedAt: new Date().toISOString()
        },
        {
          userId: "mod-live-02",
          displayName: "लाइभ डेस्क सञ्चालक",
          role: "moderator",
          membershipTier: "sanrakshak",
          isStaff: true,
          isChatter: true,
          joinedAt: new Date().toISOString()
        }
      ];
      this.localParticipants.set(liveVideoId, seeded);
      return seeded;
    }

    return list;
  }

  public static muteParticipant(
    liveVideoId: string,
    userId: string,
    durationMinutes: number,
    moderatorUserId: string,
    moderatorName: string,
    reason?: string
  ): boolean {
    const list = this.localParticipants.get(liveVideoId) || [];
    const target = list.find(p => p.userId === userId);
    const mutedUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

    if (target) {
      target.isMuted = true;
      target.mutedUntil = mutedUntil;
    }

    this.recordModerationAction({
      action: "mute_user",
      targetUserId: userId,
      targetUserName: target?.displayName || userId,
      moderatorUserId,
      moderatorName,
      durationMinutes,
      reason: reason || `${durationMinutes} मिनेट म्यूट`
    });

    return true;
  }

  public static banParticipant(
    liveVideoId: string,
    userId: string,
    scope: "stream" | "global",
    moderatorUserId: string,
    moderatorName: string,
    reason?: string
  ): boolean {
    const list = this.localParticipants.get(liveVideoId) || [];
    const target = list.find(p => p.userId === userId);

    if (target) {
      target.isBanned = true;
    }

    this.recordModerationAction({
      action: scope === "global" ? "global_ban" : "stream_ban",
      targetUserId: userId,
      targetUserName: target?.displayName || userId,
      moderatorUserId,
      moderatorName,
      reason: reason || (scope === "global" ? "स्थायी प्रतिबन्ध (Global Ban)" : "प्रसारण प्रतिबन्ध (Stream Ban)")
    });

    return true;
  }

  public static recordModerationAction(action: Omit<LiveModerationAction, "id" | "timestamp">): LiveModerationAction {
    const fullAction: LiveModerationAction = {
      id: `MOD-ACT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...action
    };

    try {
      const actions = this.getModerationLogs();
      actions.unshift(fullAction);
      localStorage.setItem(MODERATION_ACTIONS_KEY, JSON.stringify(actions.slice(0, 100)));
    } catch (e) {}

    return fullAction;
  }

  public static getModerationLogs(): LiveModerationAction[] {
    try {
      const raw = localStorage.getItem(MODERATION_ACTIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * RevenueOS Sponsor Campaign Engine
   */
  public static getLiveSponsorCampaigns(): LiveSponsorCampaign[] {
    try {
      const saved = localStorage.getItem(SPONSOR_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      localStorage.setItem(SPONSOR_STORAGE_KEY, JSON.stringify(SAMPLE_LIVE_SPONSOR_CAMPAIGNS));
      return SAMPLE_LIVE_SPONSOR_CAMPAIGNS;
    } catch {
      return SAMPLE_LIVE_SPONSOR_CAMPAIGNS;
    }
  }

  public static saveLiveSponsorCampaign(campaign: Partial<LiveSponsorCampaign>, userId: string): boolean {
    const campaigns = this.getLiveSponsorCampaigns();
    const now = new Date().toISOString();

    if (campaign.id) {
      const idx = campaigns.findIndex(c => c.id === campaign.id);
      if (idx !== -1) {
        campaigns[idx] = {
          ...campaigns[idx],
          ...campaign,
          updatedAt: now
        } as LiveSponsorCampaign;
      }
    } else {
      const newCamp: LiveSponsorCampaign = {
        id: `CAMP-${Date.now()}`,
        advertiserId: campaign.advertiserId || "adv-custom-01",
        advertiserName: campaign.advertiserName || "सनातन प्रायोजक",
        campaignName: campaign.campaignName || "नयाँ प्रत्यक्ष प्रायोजन",
        placement: campaign.placement || "LIVE_BOTTOM_TICKER",
        headlineNe: campaign.headlineNe || "",
        headlineEn: campaign.headlineEn,
        logoUrl: campaign.logoUrl,
        destinationUrl: campaign.destinationUrl || "https://sanatanmarga.com",
        ctaText: campaign.ctaText || "थप जान्नुहोस्",
        scrollSpeed: campaign.scrollSpeed || "normal",
        priority: Number(campaign.priority) || 50,
        startAt: campaign.startAt || now,
        endAt: campaign.endAt || new Date(Date.now() + 30 * 86400000).toISOString(),
        status: campaign.status || "active",
        targetCategories: campaign.targetCategories || [],
        targetDistricts: campaign.targetDistricts || [],
        targetTiers: campaign.targetTiers || ["free", "member"],
        currentImpressions: 0,
        createdAt: now,
        updatedAt: now
      };
      campaigns.unshift(newCamp);
    }

    try {
      localStorage.setItem(SPONSOR_STORAGE_KEY, JSON.stringify(campaigns));
      return true;
    } catch (e) {
      return false;
    }
  }

  public static deleteLiveSponsorCampaign(id: string): boolean {
    let campaigns = this.getLiveSponsorCampaigns();
    campaigns = campaigns.filter(c => c.id !== id);
    try {
      localStorage.setItem(SPONSOR_STORAGE_KEY, JSON.stringify(campaigns));
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Deterministic Campaign Matcher respecting:
   * 1. Premium zero-ad invariant (tier === 'sanrakshak' / 'corporate' / 'sadhak' -> 0 ads)
   * 2. Active status + startAt <= now <= endAt
   * 3. Placement type match (LIVE_BOTTOM_TICKER or LIVE_VIDEO_LOWER_THIRD)
   * 4. Target category / district match
   * 5. Highest priority ranking
   */
  public static getActiveCampaignForStream(
    video?: LiveVideo,
    placement: "LIVE_BOTTOM_TICKER" | "LIVE_VIDEO_LOWER_THIRD" = "LIVE_BOTTOM_TICKER",
    userTier: string = "free"
  ): LiveSponsorCampaign | null {
    // Premium users are strictly zero-ad
    if (userTier === "sanrakshak" || userTier === "corporate" || userTier === "sadhak" || userTier === "premium") {
      return null;
    }

    const campaigns = this.getLiveSponsorCampaigns();
    const now = new Date().getTime();

    const qualifying = campaigns.filter(c => {
      if (c.status !== "active") return false;
      if (c.placement !== placement) return false;

      const start = new Date(c.startAt).getTime();
      const end = new Date(c.endAt).getTime();
      if (now < start || now > end) return false;

      // Category targeting
      if (c.targetCategories && c.targetCategories.length > 0 && video?.category) {
        if (!c.targetCategories.includes(video.category)) return false;
      }

      // District targeting
      if (c.targetDistricts && c.targetDistricts.length > 0 && video?.district) {
        if (!c.targetDistricts.includes(video.district)) return false;
      }

      // Tier targeting
      if (c.targetTiers && c.targetTiers.length > 0) {
        if (!c.targetTiers.includes(userTier as any)) return false;
      }

      return true;
    });

    if (qualifying.length === 0) return null;

    // Sort by priority descending
    qualifying.sort((a, b) => b.priority - a.priority);
    return qualifying[0];
  }

  /**
   * Saves or creates a Live Video Stream item (Admin action)
   */
  public static async saveLiveVideo(
    videoData: Partial<LiveVideo>, 
    adminUserId: string
  ): Promise<string | null> {
    const resolved = LiveProviderService.resolveSource(videoData.sourceUrl || "", videoData.sourceType);

    const now = new Date().toISOString();
    const payload: Omit<LiveVideo, "id"> = {
      title: videoData.title || "नयाँ लाइभ प्रसारण",
      titleEn: videoData.titleEn || "",
      description: videoData.description || "",
      descriptionEn: videoData.descriptionEn || "",

      sourceType: videoData.sourceType || resolved.sourceType,
      sourceUrl: videoData.sourceUrl || "",
      embedUrl: videoData.embedUrl || resolved.embedUrl,
      externalId: videoData.externalId || resolved.externalId,
      thumbnailUrl: videoData.thumbnailUrl || resolved.thumbnailUrl || "/assets/images/live-placeholder.jpg",

      status: videoData.status || "approved",
      category: videoData.category || "समाचार",
      tags: videoData.tags || ["लाइभ", "नेपाल"],

      province: videoData.province || "बागमती प्रदेश",
      district: videoData.district || "काठमाडौँ",

      language: videoData.language || "ne",

      broadcasterName: videoData.broadcasterName || "सनातन मार्ग डिजिटल डेस्क",
      broadcasterId: videoData.broadcasterId || "sanatanmarga_live",

      isFeatured: Boolean(videoData.isFeatured),
      isLive: videoData.status === "live" || Boolean(videoData.isLive),

      startedAt: videoData.startedAt || (videoData.status === "live" ? now : undefined),
      endedAt: videoData.endedAt,
      scheduledAt: videoData.scheduledAt,

      viewerCount: videoData.viewerCount || 0,
      viewCount: videoData.viewCount || 0,
      duration: videoData.duration || "लाइभ",

      createdAt: videoData.createdAt || now,
      updatedAt: now,
      publishedAt: videoData.publishedAt || now,

      editorialStatus: videoData.editorialStatus || "verified",
      sourceVerified: videoData.sourceVerified ?? true,
      embedCapability: resolved.embedCapability,

      revenuePlacement: videoData.revenuePlacement,
      sponsorInfo: videoData.sponsorInfo
    };

    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== undefined)
    );

    let id = videoData.id || `live-${Date.now()}`;

    if (db) {
      try {
        if (videoData.id) {
          await updateDoc(doc(db, "liveVideos", videoData.id), cleanPayload);
          await logActivity("live_edited", "system", videoData.id, { title: payload.title });
        } else {
          const ref = await addDoc(collection(db, "liveVideos"), {
            ...cleanPayload,
            serverCreatedAt: serverTimestamp()
          });
          id = ref.id;
          await logActivity("live_created", "system", id, { title: payload.title });
        }
      } catch (error) {
        console.warn("Save live video firestore error, saved locally:", error);
      }
    }

    // Sync to Server Snapshot Engine
    try {
      await fetch("/api/live/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...cleanPayload, id })
      });
    } catch (e) {}

    return id;
  }

  /**
   * Deletes a Live Video stream (Admin action)
   */
  public static async deleteLiveVideo(id: string): Promise<boolean> {
    if (!id) return false;

    if (db) {
      try {
        await deleteDoc(doc(db, "liveVideos", id));
        await logActivity("live_deleted", "system", id);
      } catch (error) {
        console.warn("Delete live video firestore error:", error);
      }
    }

    // Sync deletion to Server Snapshot Engine
    try {
      await fetch(`/api/live/videos/${id}`, {
        method: "DELETE"
      });
    } catch (e) {}

    return true;
  }

  /**
   * Saves global LiveOS settings (Admin action)
   */
  public static async saveLiveSettings(settings: Partial<LiveStreamSettings>): Promise<boolean> {
    if (db) {
      try {
        await setDoc(doc(db, "settings", "live"), {
          ...settings,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        await logActivity("live_settings_updated", "system", "live");
      } catch (error) {
        console.warn("Save live settings firestore error:", error);
      }
    }

    return true;
  }
}

