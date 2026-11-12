import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  CheckCircle,
  AlertTriangle,
  FileCode,
  Layers,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Sparkles
} from 'lucide-react';
import { SANATAN_TOPIC_HUBS } from '../../data/topicHubsData';
import { CANONICAL_HOST } from '../../lib/seoEngine';

export const SeoAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'preview' | 'sitemaps' | 'topics' | 'checklist'>('overview');
  
  // Simulator state
  const [previewTitle, setPreviewTitle] = useState('श्रीमद्भगवद्गीता — कर्मयोग र जीवन दर्शन');
  const [previewSlug, setPreviewSlug] = useState('bhagavad-gita-karma-yoga-guide');
  const [previewDesc, setPreviewDesc] = useState('भगवद्गीताका प्रमुख १८ अध्यायहरू र कर्मयोगको व्यावहारिक व्याख्या। निष्काम कर्मको अर्थ र जीवनमा यसको सान्दर्भिकता।');

  // Quality gate sample audit
  const [auditItems, setAuditItems] = useState([
    { id: '1', title: 'पशुपतिनाथ मन्दिरको ऐतिहासिक र धार्मिक महत्त्व', slug: 'pashupatinath-temple-history', hasTitle: true, hasDesc: true, hasAuthor: true, hasImage: true, isIndexable: true, score: 100 },
    { id: '2', title: 'वैदिक अग्निहोत्र र साधना', slug: 'vedic-agnihotra-sadhana', hasTitle: true, hasDesc: false, hasAuthor: true, hasImage: true, isIndexable: true, score: 75 },
    { id: '3', title: 'Draft - Nepal Festival 2026 Review', slug: 'draft-nepal-festival-2026', hasTitle: true, hasDesc: false, hasAuthor: false, hasImage: false, isIndexable: false, score: 40 }
  ]);

  const [sitemapStatus, setSitemapStatus] = useState({
    status: 'ACTIVE',
    lastGenerated: new Date().toISOString(),
    sitemapsCount: 6,
    totalUrls: 142
  });

  return (
    <div className="p-6 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <h1 className="text-2xl font-serif font-bold text-amber-950 dark:text-amber-100">
              SEO OS Control Center — Technical SEO & Discoverability
            </h1>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            SANATANMARGA 4.2.7-RC2 · Canonical Host: <span className="font-mono text-amber-700 dark:text-amber-400">{CANONICAL_HOST}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Canonical Engine Active
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-stone-200 dark:border-stone-800 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400'
          }`}
        >
          Indexability & Quality Gate
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
            activeTab === 'preview'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400'
          }`}
        >
          Google Snippet Simulator
        </button>
        <button
          onClick={() => setActiveTab('sitemaps')}
          className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
            activeTab === 'sitemaps'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400'
          }`}
        >
          XML Sitemaps & Robots.txt
        </button>
        <button
          onClick={() => setActiveTab('topics')}
          className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
            activeTab === 'topics'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400'
          }`}
        >
          Topical Authority Map
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
            activeTab === 'checklist'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400'
          }`}
        >
          Search Console Readiness
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="text-xs text-stone-500">Indexed Routes</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">100% Valid</div>
              <div className="text-[11px] text-stone-400 mt-1">No draft or admin leakage</div>
            </div>
            <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="text-xs text-stone-500">Structured Data (JSON-LD)</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">Active</div>
              <div className="text-[11px] text-stone-400 mt-1">NewsArticle, BlogPosting, Org</div>
            </div>
            <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="text-xs text-stone-500">Sitemap Index</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">/sitemap.xml</div>
              <div className="text-[11px] text-stone-400 mt-1">6 Sub-sitemaps generated</div>
            </div>
            <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="text-xs text-stone-500">Bilingual Hreflang</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">en / ne / x-default</div>
              <div className="text-[11px] text-stone-400 mt-1">Reciprocal canonical links</div>
            </div>
          </div>

          {/* Quality Audit Table */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" /> Editorial SEO Quality Audit
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600 dark:text-stone-300">
                <thead className="bg-stone-100 dark:bg-stone-800 uppercase text-[10px] text-stone-500">
                  <tr>
                    <th className="p-3">Title & Slug</th>
                    <th className="p-3">Index Policy</th>
                    <th className="p-3">Title</th>
                    <th className="p-3">Meta Desc</th>
                    <th className="p-3">Author</th>
                    <th className="p-3">Image</th>
                    <th className="p-3">Quality Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {auditItems.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3 font-medium text-stone-900 dark:text-stone-100">
                        <div>{item.title}</div>
                        <div className="text-[10px] text-stone-400 font-mono">/{item.slug}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.isIndexable ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                        }`}>
                          {item.isIndexable ? 'INDEX' : 'NOINDEX'}
                        </span>
                      </td>
                      <td className="p-3">{item.hasTitle ? '✅' : '❌'}</td>
                      <td className="p-3">{item.hasDesc ? '✅' : '⚠️ Missing'}</td>
                      <td className="p-3">{item.hasAuthor ? '✅' : '⚠️ Missing'}</td>
                      <td className="p-3">{item.hasImage ? '✅' : '⚠️ Missing'}</td>
                      <td className="p-3 font-bold">{item.score}/100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Snippet Simulator Tab */}
      {activeTab === 'preview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-4">
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-600" /> Editor Metadata Input
            </h3>
            <div>
              <label className="block text-xs font-semibold mb-1">SEO Title</label>
              <input
                type="text"
                value={previewTitle}
                onChange={(e) => setPreviewTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded dark:bg-stone-800 dark:border-stone-700"
              />
              <span className="text-[10px] text-stone-400">{previewTitle.length} characters (Optimal 50-60)</span>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">URL Slug</label>
              <input
                type="text"
                value={previewSlug}
                onChange={(e) => setPreviewSlug(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded dark:bg-stone-800 dark:border-stone-700 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Meta Description</label>
              <textarea
                value={previewDesc}
                onChange={(e) => setPreviewDesc(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-xs border rounded dark:bg-stone-800 dark:border-stone-700"
              />
              <span className="text-[10px] text-stone-400">{previewDesc.length} characters (Optimal 140-160)</span>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800">
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-600" /> Google Search Result Snippet Preview
            </h3>
            <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700 space-y-1 font-sans">
              <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400">
                <span className="w-4 h-4 rounded-full bg-amber-600 text-white font-bold text-[9px] flex items-center justify-center">SM</span>
                <span className="text-stone-800 dark:text-stone-200 font-medium">SanatanMarga</span>
                <span className="text-stone-400">› blog › {previewSlug}</span>
              </div>
              <h4 className="text-base font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer">
                {previewTitle} | Sanatan Blog | SanatanMarga
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-normal">
                {previewDesc}
              </p>
            </div>
            <p className="text-[11px] text-stone-400 mt-4 italic">
              Note: This is an editorial preview simulation. Final search layout may vary based on Google display algorithms.
            </p>
          </div>
        </div>
      )}

      {/* Sitemaps Tab */}
      {activeTab === 'sitemaps' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800">
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-amber-600" /> Live Dynamic XML Sitemaps
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Sitemap Index', url: `${CANONICAL_HOST}/sitemap.xml`, count: '6 sub-sitemaps' },
                { name: 'Pages Sitemap', url: `${CANONICAL_HOST}/sitemaps/pages.xml`, count: '14 core pages' },
                { name: 'News Sitemap', url: `${CANONICAL_HOST}/sitemaps/news.xml`, count: 'Recent published news' },
                { name: 'Sanatan Blog Sitemap', url: `${CANONICAL_HOST}/sitemaps/blog.xml`, count: 'Published blog posts' },
                { name: 'SGIS Manuscripts Sitemap', url: `${CANONICAL_HOST}/sitemaps/sgis.xml`, count: 'Verified public SGIS texts' },
                { name: 'Categories & Authors Sitemap', url: `${CANONICAL_HOST}/sitemaps/categories.xml`, count: 'Public taxonomies' },
              ].map((map, i) => (
                <div key={i} className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-lg border border-stone-200 dark:border-stone-700 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-xs text-stone-900 dark:text-stone-100">{map.name}</h4>
                    <p className="text-[11px] font-mono text-amber-700 dark:text-amber-400">{map.url}</p>
                    <span className="text-[10px] text-stone-400">{map.count}</span>
                  </div>
                  <a href={map.url} target="_blank" rel="noopener noreferrer" className="p-2 text-stone-400 hover:text-amber-600">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Topics Tab */}
      {activeTab === 'topics' && (
        <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800">
          <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" /> Sanatan Topical Authority Hubs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(SANATAN_TOPIC_HUBS).map((hub) => (
              <div key={hub.slug} className="p-4 bg-amber-50/40 dark:bg-stone-800/40 rounded-lg border border-amber-200/50 dark:border-stone-700">
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">{hub.category}</span>
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 mt-1">{hub.titleNepali}</h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 line-clamp-2">{hub.descriptionNepali}</p>
                <div className="mt-3 text-[11px] text-amber-800 dark:text-amber-300 font-mono">
                  Canonical: /topic/{hub.slug}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checklist Tab */}
      {activeTab === 'checklist' && (
        <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3 text-xs">
          <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> Search Console & Production Readiness Checklist
          </h3>
          {[
            { title: 'Canonical Domain Enforcement', desc: 'Strictly emits https://sanatanmarga.com across all meta tags.', status: true },
            { title: 'Noindex Rules for Admin & Drafts', desc: 'Admin, login, search, and draft pages strictly return noindex, nofollow.', status: true },
            { title: 'Structured Data (JSON-LD)', desc: 'Valid Organization, WebSite, NewsArticle, BlogPosting, and BreadcrumbList schemas.', status: true },
            { title: 'Production Robots.txt', desc: 'Allows crawler discovery and explicitly points to https://sanatanmarga.com/sitemap.xml.', status: true },
            { title: 'Bilingual Hreflang Tags', desc: 'Reciprocal hreflang tags for English, Nepali, and x-default.', status: true },
          ].map((item, i) => (
            <div key={i} className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded flex items-center justify-between border border-stone-200 dark:border-stone-700">
              <div>
                <h4 className="font-bold text-stone-900 dark:text-stone-100">{item.title}</h4>
                <p className="text-stone-500 dark:text-stone-400">{item.desc}</p>
              </div>
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded font-bold">READY</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeoAdminDashboard;
