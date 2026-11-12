export type MediaAssetType = 'image' | 'video' | 'audio' | 'document' | 'other';
export type MediaPublicationState = 'draft' | 'published' | 'archived' | 'restricted';

export interface MediaAssetUsage {
  type: 'article' | 'nepal_hub' | 'knowledge_entity' | 'banner' | 'avatar' | 'community' | 'model' | 'radio' | 'live' | 'other';
  id: string;
  title: string;
  url?: string;
}

export interface MediaAsset {
  id: string;
  tenantId: string;
  category: string;
  assetType?: MediaAssetType;
  fileName: string;
  originalName: string;
  title?: string;
  titleNepali?: string;
  url: string;
  thumbnailUrl: string;
  objectKey: string;
  isR2?: boolean;
  mimeType: string;
  size: number; // in bytes
  width?: number;
  height?: number;
  duration?: number; // for audio/video in seconds
  bitrate?: number;
  pages?: number; // for documents (e.g. PDF)
  checksum?: string;
  tags: string[];
  altText: string;
  altTextNepali?: string;
  altTextEnglish?: string;
  caption?: string;
  sourceAttribution?: string;
  license?: string;
  uploadedBy: string;
  uploadedByRole?: string;
  status: 'processing' | 'ready' | 'archived';
  publicationState?: MediaPublicationState;
  createdAt: string; // ISO date string
  updatedAt?: string;
  usedIn?: MediaAssetUsage[];
}

export interface PresignRequest {
  tenantId?: string;
  category?: string;
  assetType?: MediaAssetType;
  fileName: string;
  mimeType: string;
  size?: number;
}

export interface PresignResponse {
  success: boolean;
  isR2: boolean;
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  bucket: string;
}

export interface MediaUploadPayload {
  tenantId?: string;
  category?: string;
  assetType?: MediaAssetType;
  fileName: string;
  originalName: string;
  title?: string;
  titleNepali?: string;
  url: string;
  thumbnailUrl?: string;
  objectKey: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  tags?: string[];
  altText?: string;
  altTextNepali?: string;
  altTextEnglish?: string;
  caption?: string;
  sourceAttribution?: string;
  uploadedBy?: string;
  publicationState?: MediaPublicationState;
  isR2?: boolean;
}

export interface MediaOSMetricRecord {
  value: number;
  provenance: 'measured' | 'estimated' | 'projected' | 'unconfigured';
  source: string;
  unit: string;
}

export interface MediaOSAnalytics {
  totalAssets: MediaOSMetricRecord;
  totalStorageBytes: MediaOSMetricRecord;
  totalImages: MediaOSMetricRecord;
  totalVideos: MediaOSMetricRecord;
  totalAudio: MediaOSMetricRecord;
  totalDocuments: MediaOSMetricRecord;
  totalRadioBulletins: MediaOSMetricRecord;
  totalLiveStreams: MediaOSMetricRecord;
  r2StoragePercent: MediaOSMetricRecord;
  aiMetadataEnrichedPercent: MediaOSMetricRecord;
  categoryBreakdown: Record<string, number>;
  mimeTypeBreakdown: Record<string, number>;
  recentUploadsCount: MediaOSMetricRecord;
}

