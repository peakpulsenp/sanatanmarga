export type RoutePageType = 
  | 'home'
  | 'news_article'
  | 'blog_post'
  | 'sgis_manuscript'
  | 'category'
  | 'author'
  | 'tag'
  | 'topic_hub'
  | 'nepal_hub'
  | 'events'
  | 'static_page'
  | 'admin'
  | 'draft'
  | 'search'
  | 'private';

export interface SeoMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string; // e.g. "index, follow" or "noindex, nofollow"
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  authorName?: string;
  publishedTime?: string;
  modifiedTime?: string;
  categoryName?: string;
  language?: 'en' | 'ne' | 'both';
  jsonLd?: Record<string, any>[];
  breadcrumbs?: Array<{ name: string; item: string }>;
}

export interface TopicHub {
  slug: string;
  title: string;
  titleNepali: string;
  description: string;
  descriptionNepali: string;
  category: string;
  pillarEntity: string;
  keyQuestions: Array<{ question: string; questionNepali: string; answer: string; answerNepali: string }>;
  scripturalReferences: Array<{ text: string; verse?: string; citation: string }>;
  relatedTopics: string[];
  featuredImage: string;
  authoritativeSources: string[];
}

export interface SitemapItem {
  loc: string;
  lastmod: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  title?: string;
  publicationDate?: string;
}

export interface SeoQualityAudit {
  articleId: string;
  title: string;
  slug: string;
  hasTitle: boolean;
  hasDescription: boolean;
  hasAuthor: boolean;
  hasImage: boolean;
  hasCanonical: boolean;
  isIndexable: boolean;
  score: number; // 0-100
  warnings: string[];
}
