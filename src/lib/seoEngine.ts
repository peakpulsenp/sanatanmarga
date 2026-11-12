import { SeoMetadata, RoutePageType } from '../types/seo';

export const CANONICAL_HOST = 'https://sanatanmarga.com';
export const CANONICAL_DOMAIN = CANONICAL_HOST;

/**
 * Cleanly builds a canonical HTTPS production URL without tracking parameters or development hostnames.
 */
export function buildCanonicalUrl(pathname: string, queryParams?: Record<string, string>): string {
  let cleanPath = pathname || '/';
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }
  // Strip trailing slashes except for root
  if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
    cleanPath = cleanPath.slice(0, -1);
  }

  // Filter query parameters (keep only pagination if essential, strip utm/sort/filter)
  let queryString = '';
  if (queryParams) {
    const allowedKeys = ['page'];
    const filtered = Object.keys(queryParams)
      .filter(k => allowedKeys.includes(k) && queryParams[k])
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`);
    if (filtered.length > 0) {
      queryString = '?' + filtered.join('&');
    }
  }

  return `${CANONICAL_HOST}${cleanPath}${queryString}`;
}

/**
 * Determines route indexability policy based on route pathname and item status.
 */
export function isIndexableRoute(pathname: string, status?: string): boolean {
  if (status && (status === 'draft' || status === 'review' || status === 'archived' || status === 'private')) {
    return false;
  }

  const path = (pathname || '').toLowerCase();
  
  const noindexPrefixes = [
    '/admin',
    '/editor',
    '/dashboard',
    '/login',
    '/signup',
    '/account',
    '/settings',
    '/draft',
    '/review',
    '/preview',
    '/search',
    '/global-search',
    '/chautari',
    '/my-sanatan',
    '/notifications',
    '/queue',
    '/offline-queue',
    '/diagnostics',
    '/test',
    '/smoke-test',
    '/offline',
    '/api/'
  ];

  for (const prefix of noindexPrefixes) {
    if (path === prefix || path.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`)) {
      return false;
    }
  }

  return true;
}

/**
 * Generates deterministic SEO title per route type.
 */
export function generatePageTitle(
  type: RoutePageType | string,
  title?: string,
  categoryOrContext?: string,
  authorName?: string
): string {
  if (type === 'home' || type === 'homepage') {
    return 'SanatanMarga — Sanatan Dharma, News, Knowledge & Himalayan Civilization';
  }

  const cleanTitle = (title || '').trim();

  switch (type) {
    case 'news_article':
    case 'news':
    case 'article':
      return cleanTitle ? `${cleanTitle} | SanatanMarga` : 'News & Journal | SanatanMarga';
    case 'blog_post':
    case 'blog':
      return cleanTitle ? `${cleanTitle} | Sanatan Blog | SanatanMarga` : 'Sanatan Blog | SanatanMarga';
    case 'sgis_manuscript':
    case 'sgis':
      return cleanTitle ? `${cleanTitle} | Saraswati Grantha Intelligence System | SanatanMarga` : 'SGIS Library | SanatanMarga';
    case 'category':
      return cleanTitle ? `${cleanTitle} — Sanatan Dharma Articles & Knowledge | SanatanMarga` : 'Categories | SanatanMarga';
    case 'author':
      return authorName || cleanTitle ? `${authorName || cleanTitle} — Articles & Research | SanatanMarga` : 'Authors & Scholars | SanatanMarga';
    case 'topic_hub':
    case 'topic':
      return cleanTitle ? `${cleanTitle} — Sanatan Dharma & Himalayan Knowledge Hub | SanatanMarga` : 'Sanatan Knowledge Hubs | SanatanMarga';
    case 'nepal_hub':
      return cleanTitle ? `${cleanTitle} | Nepal Hub | SanatanMarga` : 'Nepal Hub — Himalayan Culture & Heritage | SanatanMarga';
    case 'events':
    case 'event':
      return cleanTitle ? `${cleanTitle} | Events | SanatanMarga` : 'Festivals & Sacred Calendar | SanatanMarga';
    case 'static_page':
      return cleanTitle ? `${cleanTitle} | SanatanMarga` : 'SanatanMarga';
    default:
      return cleanTitle ? `${cleanTitle} | SanatanMarga` : 'SanatanMarga';
  }
}

/**
 * Safe meta description extractor with multi-tier fallback.
 */
export function generateMetaDescription(
  explicitSeoDescription?: string,
  excerpt?: string,
  content?: string,
  fallback = 'SanatanMarga is an authoritative platform for Sanatan Dharma, Vedic philosophy, news, SGIS manuscript preservation, and Himalayan civilization.'
): string {
  if (explicitSeoDescription && explicitSeoDescription.trim().length > 10) {
    return truncateDescription(explicitSeoDescription.trim());
  }
  if (excerpt && excerpt.trim().length > 10) {
    return truncateDescription(excerpt.trim());
  }
  if (content && content.trim().length > 20) {
    const cleanText = content.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
    if (cleanText.length > 20) {
      return truncateDescription(cleanText);
    }
  }
  return fallback;
}

function truncateDescription(text: string, maxLen = 160): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3).trim() + '...';
}

/**
 * Structured Data (JSON-LD) Generators
 */

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    '@id': `${CANONICAL_HOST}/#organization`,
    name: 'SanatanMarga',
    alternateName: 'सनातन मार्ग',
    url: CANONICAL_HOST,
    logo: {
      '@type': 'ImageObject',
      url: `${CANONICAL_HOST}/logo.png`,
      width: 512,
      height: 512,
      caption: 'SanatanMarga Logo'
    },
    description: 'SanatanMarga is a premier digital news, scholarship, and manuscript preservation platform for Sanatan Dharma and Himalayan culture.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Kathmandu',
      addressCountry: 'NP'
    },
    sameAs: [
      'https://facebook.com/sanatanmarga',
      'https://twitter.com/sanatanmarga',
      'https://youtube.com/@sanatanmarga'
    ]
  };
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${CANONICAL_HOST}/#website`,
    name: 'SanatanMarga',
    url: CANONICAL_HOST,
    publisher: {
      '@id': `${CANONICAL_HOST}/#organization`
    },
    inLanguage: ['ne-NP', 'en-US'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${CANONICAL_HOST}/latest?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

export function generateNewsArticleSchema(article: {
  id: string;
  title: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  authorName?: string;
  authorId?: string;
  createdAt: string;
  updatedAt?: string;
  categoryName?: string;
  slug?: string;
}) {
  const canonicalUrl = buildCanonicalUrl(`/article/${article.slug || article.id}`);
  const publishDate = new Date(article.createdAt).toISOString();
  const modifiedDate = new Date(article.updatedAt || article.createdAt).toISOString();
  const authorName = article.authorName && article.authorName.trim() !== '' ? article.authorName : 'SanatanMarga Editorial Desk';
  const authorUrl = article.authorId ? buildCanonicalUrl(`/blog/author/${article.authorId}`) : `${CANONICAL_HOST}/authors`;

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    '@id': `${canonicalUrl}#article`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl
    },
    headline: article.title,
    description: generateMetaDescription(undefined, article.excerpt, article.content),
    image: article.featuredImage ? [article.featuredImage] : [`${CANONICAL_HOST}/logo.png`],
    datePublished: publishDate,
    dateModified: modifiedDate,
    author: {
      '@type': 'Person',
      name: authorName,
      url: authorUrl
    },
    publisher: {
      '@id': `${CANONICAL_HOST}/#organization`
    },
    articleSection: article.categoryName || 'समाचार',
    inLanguage: 'ne-NP'
  };
}

export function generateBlogPostingSchema(post: {
  id: string;
  title: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  authorName?: string;
  authorId?: string;
  createdAt: string;
  updatedAt?: string;
  categoryName?: string;
  slug?: string;
}) {
  const canonicalUrl = buildCanonicalUrl(`/blog/post/${post.slug || post.id}`);
  const publishDate = new Date(post.createdAt).toISOString();
  const modifiedDate = new Date(post.updatedAt || post.createdAt).toISOString();
  const authorName = post.authorName || 'Sanatan Blog Scholar';
  const authorUrl = post.authorId ? buildCanonicalUrl(`/blog/author/${post.authorId}`) : `${CANONICAL_HOST}/authors`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${canonicalUrl}#post`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl
    },
    headline: post.title,
    description: generateMetaDescription(undefined, post.excerpt, post.content),
    image: post.featuredImage ? [post.featuredImage] : [`${CANONICAL_HOST}/logo.png`],
    datePublished: publishDate,
    dateModified: modifiedDate,
    author: {
      '@type': 'Person',
      name: authorName,
      url: authorUrl
    },
    publisher: {
      '@id': `${CANONICAL_HOST}/#organization`
    },
    articleSection: post.categoryName || 'Sanatan Philosophy',
    inLanguage: 'ne-NP'
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; item: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: crumb.name,
      item: crumb.item.startsWith('http') ? crumb.item : `${CANONICAL_HOST}${crumb.item}`
    }))
  };
}

export function generatePersonSchema(person: {
  name: string;
  username: string;
  bio?: string;
  photo?: string;
  jobTitle?: string;
}) {
  const url = buildCanonicalUrl(`/blog/author/${person.username}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${url}#person`,
    name: person.name,
    url: url,
    image: person.photo || `${CANONICAL_HOST}/logo.png`,
    jobTitle: person.jobTitle || 'SanatanMarga Scholar & Editor',
    description: person.bio || 'Scholar, researcher and editor contributing to SanatanMarga digital repository.',
    worksFor: {
      '@id': `${CANONICAL_HOST}/#organization`
    }
  };
}

export function generateSgisSchema(manuscript: {
  id: string;
  title: string;
  script?: string;
  language?: string;
  summary?: string;
}) {
  const url = buildCanonicalUrl(`/sgis/text/${manuscript.id}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'Manuscript',
    '@id': `${url}#manuscript`,
    name: manuscript.title,
    url: url,
    description: manuscript.summary || `SGIS Manuscript: ${manuscript.title} (${manuscript.script || 'Devanagari'})`,
    inLanguage: manuscript.language || 'sa',
    publisher: {
      '@id': `${CANONICAL_HOST}/#organization`
    }
  };
}

