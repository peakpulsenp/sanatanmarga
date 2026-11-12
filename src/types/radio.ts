export type StreamFormat = 'hls' | 'aac' | 'mp3' | 'icecast' | 'custom';

export type BroadcastType = 
  | 'live_stream' 
  | 'bulletin' 
  | 'podcast' 
  | 'article_digest' 
  | 'program_episode' 
  | 'station_id' 
  | 'breaking_news';

export type RadioVoiceProfile = 
  | 'news_anchor'     // Serious, articulate female newsreader (Aoede)
  | 'narrator'        // Deep, engaging narrator (Puck)
  | 'spiritual'       // Resonant, calm spiritual voice (Fenrir)
  | 'business'        // Crisp professional (Kore)
  | 'youth'           // Energetic host (Puck)
  | 'english_anchor'; // Clear English news anchor (Aoede)

export type RadioAdInventory = 
  | 'radio_preroll'
  | 'radio_midroll'
  | 'radio_station_sponsor'
  | 'radio_program_sponsor'
  | 'radio_breaking_news_sponsor';

export interface RadioSponsorInfo {
  sponsorNameNe?: string;
  sponsorNameEn?: string;
  sponsorLogoUrl?: string;
  sponsorTaglineNe?: string;
  sponsorTaglineEn?: string;
  hasAudioSponsorAnnouncement?: boolean;
  sponsorAudioUrl?: string;
  campaignId?: string;
}

export interface RadioStation {
  id: string;
  nameNe: string;
  nameEn: string;
  taglineNe: string;
  taglineEn: string;
  liveStreamUrl?: string;
  backupStreamUrl?: string;
  lowDataStreamUrl?: string;
  streamFormat?: StreamFormat;
  isLiveBroadcasting: boolean;
  currentProgramId?: string;
  currentProgramTitleNe?: string;
  currentProgramTitleEn?: string;
  currentBroadcastId?: string;
  stationIntroNe?: string;
  stationIntroEn?: string;
  stationIntroAudioUrl?: string;
  updatedAt: string;
}

export interface RadioProgram {
  id: string;
  titleNe: string;
  titleEn: string;
  slug: string;
  descriptionNe: string;
  descriptionEn: string;
  hostNameNe: string;
  hostNameEn: string;
  category: string;
  district?: string;
  coverImageUrl?: string;
  scheduleMetadata?: string; // e.g. "बिहान ०६:०० - ०७:३० | Daily 6:00 AM"
  durationMinutes?: number;
  isFeatured: boolean;
  isArchived?: boolean;
  voiceProfile?: RadioVoiceProfile;
  sponsorInfo?: RadioSponsorInfo;
  episodeCount?: number;
  latestEpisodeId?: string;
  updatedAt: string;
}

export interface RadioBroadcast {
  id: string;
  titleNe: string;
  titleEn: string;
  type: BroadcastType;
  audioUrl: string;
  streamUrl?: string;
  programId?: string;
  programTitleNe?: string;
  programTitleEn?: string;
  articleId?: string;
  presenterNe?: string;
  presenterEn?: string;
  summaryNe?: string;
  summaryEn?: string;
  district?: string;
  category?: string;
  coverImageUrl?: string;
  durationSeconds?: number;
  publishedAt: string;
  isLive: boolean;
  isRecorded: boolean;
  isFeatured?: boolean;
  sponsorInfo?: {
    sponsorName?: string;
    sponsorTagline?: string;
  };
}

export interface RadioScheduleSlot {
  id: string;
  programId: string;
  programTitleNe: string;
  programTitleEn: string;
  hostNameNe?: string;
  hostNameEn?: string;
  dayOfWeek: number; // -1 for all days, 0 (Sun) to 6 (Sat)
  startTime: string; // "07:00"
  endTime: string;   // "08:00"
  durationMinutes: number;
  broadcastType: 'LIVE' | 'RECORDED' | 'BULLETIN';
  isEnabled: boolean;
  notes?: string;
  district?: string;
}

export interface RadioStationIdItem {
  id: string;
  titleNe: string;
  titleEn: string;
  textNe: string;
  textEn: string;
  audioUrl?: string;
  voiceProfile: RadioVoiceProfile;
}

export interface RadioSoundBranding {
  id: string;
  stationIntroNe: string;
  stationIntroEn: string;
  stationIntroAudioUrl?: string;
  sonicLogoUrl?: string;
  breakingNewsStingUrl?: string;
  stationIdNeUrl?: string;
  stationIdEnUrl?: string;
  sponsorAnnouncementUrl?: string;
  introEnabled: boolean;
  sonicLogoEnabled: boolean;
  breakingStingEnabled: boolean;
  sponsorEnabled: boolean;
  soundFrequencyMinutes: number; // default 15-30
}

export interface RadioBulletinSourceArticle {
  id: string;
  titleNe: string;
  titleEn?: string;
  publisher?: string;
}

export interface RadioBulletin {
  id: string;
  titleNe: string;
  titleEn: string;
  scriptNe: string;
  scriptEn: string;
  sourceArticleIds: string[];
  sourceArticles?: RadioBulletinSourceArticle[];
  audioUrl?: string;
  durationSeconds?: number;
  generatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  status: 'draft' | 'approved' | 'published';
  district?: string;
  category?: string;
  voiceProfile?: RadioVoiceProfile;
  sponsorInfo?: RadioSponsorInfo;
}

export interface RadioBreakingAlert {
  id: string;
  titleNe: string;
  titleEn: string;
  summaryNe: string;
  summaryEn?: string;
  audioUrl?: string;
  stingAudioUrl?: string;
  articleId?: string;
  district?: string;
  publishedAt: string;
  isVerified: boolean;
  isActive: boolean;
}

export interface RadioAnalytics {
  currentListenersCount: number;
  peakListenersCount: number;
  totalPlaysCount: number;
  totalListenDurationSeconds: number;
  averageSessionMinutes: number;
  completionRatePercent: number;
  streamFailuresCount: number;
  playsByBroadcastType: Record<string, number>;
  topPrograms: { programId: string; titleNe: string; playsCount: number }[];
  topDistricts: { district: string; listenersCount: number }[];
  updatedAt: string;
}

export interface RadioSettings {
  stationId: string;
  autoPlayLiveStream: boolean;
  enableSonicBranding: boolean;
  enableAIBulletins: boolean;
  enableBreakingInterrupts: boolean;
  ttsVoiceNe: 'Aoede' | 'Kore' | 'Fenrir' | 'Puck';
  ttsVoiceEn: 'Aoede' | 'Fenrir';
  defaultVoiceProfile: RadioVoiceProfile;
  sponsorFrequencyMinutes: number;
  maxAdsPerHour: number;
  maxQueueSize: number;
  updatedAt: string;
}

export interface RadioSnapshotData {
  station: RadioStation;
  programs: RadioProgram[];
  schedule: RadioScheduleSlot[];
  broadcasts: RadioBroadcast[];
  bulletins: RadioBulletin[];
  breakingAlerts?: RadioBreakingAlert[];
  stationIds?: RadioStationIdItem[];
  soundBranding: RadioSoundBranding;
  settings: RadioSettings;
  analytics?: RadioAnalytics;
  generatedAt: string;
}
