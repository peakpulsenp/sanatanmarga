import React, { useEffect } from 'react';
import { RoutePageType } from '../../types/seo';
import {
  buildCanonicalUrl,
  isIndexableRoute,
  generatePageTitle,
  generateMetaDescription,
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateBreadcrumbSchema,
  generateNewsArticleSchema,
  generateBlogPostingSchema,
  CANONICAL_HOST
} from '../../lib/seoEngine';

interface SeoHeadProps {
  type: RoutePageType;
  title?: string;
  description?: string;
  excerpt?: string;
  content?: string;
  canonicalPath?: string;
  ogImage?: string;
  authorName?: string;
  authorId?: string;
  publishedTime?: string;
  modifiedTime?: string;
  categoryName?: string;
  articleId?: string;
  status?: string;
  breadcrumbs?: Array<{ name: string; item: string }>;
}

export const SeoHead: React.FC<SeoHeadProps> = ({
  type,
  title,
  description,
  excerpt,
  content,
  canonicalPath = typeof window !== 'undefined' ? window.location.pathname : '/',
  ogImage = `${CANONICAL_HOST}/logo.png`,
  authorName,
  authorId,
  publishedTime,
  modifiedTime,
  categoryName,
  articleId,
  status,
  breadcrumbs
}) => {
  useEffect(() => {
    // 1. Page Title
    const formattedTitle = generatePageTitle(type, title, categoryName, authorName);
    document.title = formattedTitle;

    // Helper to update or create meta tags
    const setMetaTag = (selector: string, attribute: string, attrVal: string, contentVal: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attribute, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', contentVal);
    };

    // Helper to update link tags
    const setLinkTag = (rel: string, hrefVal: string, hreflangVal?: string) => {
      const selector = hreflangVal ? `link[rel="${rel}"][hreflang="${hreflangVal}"]` : `link[rel="${rel}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        if (hreflangVal) el.setAttribute('hreflang', hreflangVal);
        document.head.appendChild(el);
      }
      el.setAttribute('href', hrefVal);
    };

    // 2. Meta Description
    const metaDesc = generateMetaDescription(description, excerpt, content);
    setMetaTag('meta[name="description"]', 'name', 'description', metaDesc);

    // 3. Robots
    const indexable = isIndexableRoute(canonicalPath, status);
    const robotsContent = indexable ? 'index, follow, max-image-preview:large' : 'noindex, nofollow';
    setMetaTag('meta[name="robots"]', 'name', 'robots', robotsContent);

    // 4. Canonical Link
    const canonicalUrl = buildCanonicalUrl(canonicalPath);
    setLinkTag('canonical', canonicalUrl);

    // 5. OpenGraph Tags
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', formattedTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', metaDesc);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', type === 'news_article' || type === 'blog_post' ? 'article' : 'website');
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'SanatanMarga');

    // 6. Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', formattedTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', metaDesc);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

    // 7. Hreflang Tags (Bilingual Support)
    setLinkTag('alternate', canonicalUrl, 'ne');
    setLinkTag('alternate', canonicalUrl, 'en');
    setLinkTag('alternate', canonicalUrl, 'x-default');

    // 8. JSON-LD Structured Data
    const schemas: any[] = [
      generateOrganizationSchema(),
      generateWebSiteSchema()
    ];

    if (breadcrumbs && breadcrumbs.length > 0) {
      schemas.push(generateBreadcrumbSchema(breadcrumbs));
    }

    if (type === 'news_article' && articleId && title) {
      schemas.push(generateNewsArticleSchema({
        id: articleId,
        title,
        excerpt,
        content,
        featuredImage: ogImage,
        authorName,
        authorId,
        createdAt: publishedTime || new Date().toISOString(),
        updatedAt: modifiedTime,
        categoryName
      }));
    } else if (type === 'blog_post' && articleId && title) {
      schemas.push(generateBlogPostingSchema({
        id: articleId,
        title,
        excerpt,
        content,
        featuredImage: ogImage,
        authorName,
        authorId,
        createdAt: publishedTime || new Date().toISOString(),
        updatedAt: modifiedTime,
        categoryName
      }));
    }

    let jsonLdScript = document.getElementById('sanatan-seo-jsonld');
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.id = 'sanatan-seo-jsonld';
      jsonLdScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(jsonLdScript);
    }
    jsonLdScript.textContent = JSON.stringify(schemas);

  }, [type, title, description, excerpt, content, canonicalPath, ogImage, authorName, authorId, publishedTime, modifiedTime, categoryName, articleId, status, breadcrumbs]);

  return null;
};

export default SeoHead;
