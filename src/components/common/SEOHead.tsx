import React from "react";
import * as pkg from "react-helmet-async";

const helmetMod: any = pkg;
const Helmet: any = helmetMod.Helmet || helmetMod;

export interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string | string[];
  image?: string;
  url?: string;
  type?: "website" | "article" | "event" | "profile" | "organization" | "newsarticle";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  noindex?: boolean;
  jsonLd?: object | object[];
}

const DEFAULT_SITE_NAME = "Sanatan Marga";
const DEFAULT_DOMAIN = "https://sanatanmarga.com";
const DEFAULT_TITLE = "Sanatan Marga | सत्य, तथ्य र निष्पक्ष - नेपालको अग्रणी डिजिटल समाचार तथा ज्ञान सञ्जाल";
const DEFAULT_DESCRIPTION = "सनातन मार्ग - नेपालको अग्रणी डिजिटल मिडिया तथा सांस्कृतिक पोर्टल। ताजा राष्ट्रिय-अन्तर्राष्ट्रिय समाचार, राजनीति, नेपाल हब पञ्चाङ्ग पात्रो, बजार भाउ, र सरस्वती ज्ञान सञ्जाल।";
const DEFAULT_IMAGE = `${DEFAULT_DOMAIN}/logo.png`;
const DEFAULT_KEYWORDS = [
  "सनातन मार्ग",
  "Sanatan Marga",
  "नेपाली समाचार",
  "Nepal News",
  "nepali patrika",
  "panchang",
  "nepal hub",
  "saraswati knowledge graph",
  "nepali news portal",
  "live news nepal",
  "rashifal"
];

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  section,
  tags = [],
  noindex = false,
  jsonLd
}) => {
  // Format title: "Article Title | Sanatan Marga" or fallback
  const pageTitle = title
    ? title.includes(DEFAULT_SITE_NAME)
      ? title
      : `${title} | ${DEFAULT_SITE_NAME}`
    : DEFAULT_TITLE;

  // Canonical URL construction
  const canonicalUrl = url
    ? url.startsWith("http")
      ? url
      : `${DEFAULT_DOMAIN}${url.startsWith("/") ? "" : "/"}${url}`
    : DEFAULT_DOMAIN;

  // Process keywords
  const processedKeywords = Array.isArray(keywords)
    ? keywords.join(", ")
    : keywords || DEFAULT_KEYWORDS.join(", ");

  // Ensure absolute image URL
  const absoluteImage = image
    ? image.startsWith("http")
      ? image
      : `${DEFAULT_DOMAIN}${image.startsWith("/") ? "" : "/"}${image}`
    : DEFAULT_IMAGE;

  return (
    <Helmet>
      {/* Basic HTML Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={description} />
      {processedKeywords && <meta name="keywords" content={processedKeywords} />}
      
      {/* Robots Directive */}
      <meta
        name="robots"
        content={
          noindex
            ? "noindex, nofollow"
            : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        }
      />

      {/* Canonical Link */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:site_name" content={DEFAULT_SITE_NAME} />
      <meta property="og:type" content={type === "newsarticle" ? "article" : type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:locale" content="ne_NP" />

      {/* Article Specific Meta Tags */}
      {(type === "article" || type === "newsarticle") && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map((tag, idx) => (
            <meta key={`tag-${idx}`} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@sanatanmarga" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />

      {/* Custom JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(jsonLd) ? jsonLd : jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
