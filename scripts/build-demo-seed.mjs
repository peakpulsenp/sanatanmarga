/**
 * Builds the local demo seed from the shipped SnapshotOS JSON files.
 * Run: node scripts/build-demo-seed.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const snapshots = path.join(root, "public", "snapshots");
const outDir = path.join(root, "public", "demo");

const now = Date.now();

const readJson = (rel, fallback = null) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(snapshots, rel), "utf8"));
  } catch {
    return fallback;
  }
};

const homepage = readJson("homepage.json", {});
const categoriesSnap = readJson("categories.json", {});
const latest = readJson("latest.json", {});
const breaking = readJson("breaking.json", {});
const trending = readJson("trending.json", {});
const media = readJson("media.json", {});
const adsSnap = readJson("ads.json", {});
const eventsUpcoming = readJson("events/upcoming.json", {});
const chautariRecent = readJson("chautari/recent.json", {});
const chautariTrending = readJson("chautari/trending.json", {});
const nepalLive = readJson("nepal_hub/live.json", {});
const markets = readJson("nepal_hub/markets.json", {});
const festivals = readJson("nepal_hub/festivals.json", {});
const districts = readJson("nepal_hub/districts.json", {});
const briefings = readJson("nepal_hub/briefings.json", {});
const siteJson = readJson("settings/site.json", {});
const siteConfig = readJson("site_config.json", {});
const knowledgeGraph = readJson("knowledge/graph.json", {});
const glamourHome = readJson("glamour/home.json", {});
const glamourModels = readJson("glamour/models.json", {});

const articleMap = new Map();
for (const list of [
  homepage.latestNews,
  homepage.featuredArticles,
  homepage.breakingNews,
  homepage.trendingNews,
  homepage.videoNews,
  latest.articles,
  breaking.breakingNews,
  trending.trendingNews,
  ...Object.values(homepage.categoryArticles || {}),
  ...Object.values(categoriesSnap.categoryArticles || {}),
]) {
  if (!Array.isArray(list)) continue;
  for (const article of list) {
    if (article && article.id && !articleMap.has(article.id)) articleMap.set(article.id, article);
  }
}

const articles = [...articleMap.values()]
  .filter((a) => a && a.title)
  .map((a) => ({
    ...a,
    status: a.status === "draft" || a.status === "review" ? a.status : "published",
  }));

// Categories
const categories = (homepage.categories?.length ? homepage.categories : categoriesSnap.categories) || [];

// Full event records (upcoming has summaries; event_*.json has detail)
const events = [];
for (const ev of eventsUpcoming.events || []) {
  const full = readJson(`event_${ev.id}.json`, null);
  events.push(full?.event || full || ev);
}
if (events.length === 0) {
  for (const file of fs.readdirSync(snapshots).filter((f) => f.startsWith("event_") && f.endsWith(".json"))) {
    const data = readJson(file, null);
    if (data) events.push(data.event || data);
  }
}

// Community posts from Chautari snapshots
const communityMap = new Map();
for (const list of [chautariRecent.posts, chautariTrending.posts]) {
  if (!Array.isArray(list)) continue;
  for (const post of list) {
    if (post && post.id && !communityMap.has(post.id)) communityMap.set(post.id, post);
  }
}
const communityPosts = [...communityMap.values()].map((p) => ({
  ...p,
  status: p.status || "published",
  moderationStatus: p.moderationStatus || "approved",
}));

// The shipped Chautari snapshot has no posts, so create a realistic local feed
// from editorial content (this is demo data, not scraped user content).
if (communityPosts.length === 0) {
  const prompts = [
    "तपाईंको विचारमा आजको सबैभन्दा महत्त्वपूर्ण विषय के हो?",
    "नेपालको शिक्षा प्रणालीमा सुधारका लागि के गर्नुपर्ला?",
    "सनातन परम्परा र आधुनिक जीवनशैली कसरी सँगै जान सक्छन्?",
    "काठमाडौँको ट्राफिक व्यवस्थापन सुधार्ने उपाय सुझाउनुहोस्।",
    "आजको मौसमले तपाईंको योजनामा के फरक पार्यो?",
    "स्थानीय उत्पादन प्रवर्द्धनका लागि के गर्न सकिन्छ?",
    "युवा पुस्तालाई संस्कृतिप्रति आकर्षित गर्ने उपाय?",
    "तपाईंले पछिल्लो पटक पढेको राम्रो पुस्तक कुन हो?",
  ];
  prompts.forEach((prompt, index) => {
    const author = {
      id: `demo_u_member_${index % 5}`,
      displayName: ["Ramesh Shrestha", "Sita Karki", "Hari Thapa", "Gita Gurung", "Bikash Adhikari"][index % 5],
      role: ["author", "member", "moderator", "member", "author"][index % 5],
    };
    communityPosts.push({
      id: `chautari_demo_${index + 1}`,
      title: prompt,
      content: `${prompt}\n\n${index % 2 === 0 ? "कृपया आफ्नो अनुभव र सुझाव चौतारीमा साझा गर्नुहोस्। सभ्य र रचनात्मक बहसलाई स्वागत छ।" : "मैले यसबारे केही सामग्री पढें। तपाईंको अनुभव फरक छ भने अवश्य लेख्नुहोस्।"}`,
      authorId: author.id,
      authorName: author.displayName,
      authorPhoto: "",
      authorRole: author.role,
      createdAt: new Date(now - (index * 7 + 1) * 3600000).toISOString(),
      updatedAt: new Date(now - (index * 7 + 1) * 3600000).toISOString(),
      likes: 12 + index * 9,
      likedBy: [],
      views: 180 + index * 47,
      commentCount: 2 + (index % 5),
      tags: ["चौतारी", "बहस", ["समाज", "शिक्षा", "संस्कृति", "विकास"][index % 4]],
      category: ["विचार", "समाज", "संस्कृति", "विकास"][index % 4],
      status: "published",
      moderationStatus: index === 7 ? "pending" : "approved",
      isPinned: index === 0,
      isFeatured: index < 3,
    });
  });
}

// Comments
const comments = [];
const commentsDir = path.join(snapshots, "comments");
if (fs.existsSync(commentsDir)) {
  for (const file of fs.readdirSync(commentsDir)) {
    if (!file.endsWith(".json")) continue;
    const data = readJson(path.join("comments", file), null);
    if (!data) continue;
    const base = file.replace(/\.json$/, "");
    const underscore = base.indexOf("_");
    const resourceType = underscore > 0 ? base.slice(0, underscore) : "article";
    const resourceId = underscore > 0 ? base.slice(underscore + 1) : base;
    for (const comment of data.comments || []) {
      comments.push({ ...comment, resourceType, resourceId, status: comment.status || "approved" });
    }
  }
}

// Seed a few article comments so article pages and admin moderation are populated.
for (let i = 0; i < Math.min(10, articles.length); i++) {
  const article = articles[i];
  const author = {
    id: `demo_u_commenter_${i % 5}`,
    displayName: ["Ramesh Shrestha", "Sita Karki", "Hari Thapa", "Gita Gurung", "Bikash Adhikari"][i % 5],
  };
  comments.push({
    id: `comment_demo_${i + 1}`,
    resourceType: "article",
    resourceId: article.id,
    articleId: article.id,
    authorId: author.id,
    authorName: author.displayName,
    content: [
      "धेरै राम्रो विश्लेषण। धन्यवाद!",
      "यो विषयमा थप जानकारी पाउनुभयो भने साझा गर्नुहोस्।",
      "तथ्य र स्रोत उल्लेख गरेकोमा सराहनीय।",
      "मेरो अनुभव फरक छ, तर लेख राम्रो लाग्यो।",
      "अझै विस्तृत विवरण आउने आशा छ।",
    ][i % 5],
    status: i === 9 ? "pending" : "approved",
    likes: 3 + i * 2,
    createdAt: new Date(now - (i * 11 + 2) * 3600000).toISOString(),
  });
}

// Demo users (uids follow authClient's makeUser convention)
const sanitize = (email) => "demo_u_" + Buffer.from(email).toString("base64").replace(/[^a-z0-9]/gi, "").slice(0, 18);
const demoUsers = [
  ["admin@sanatanmarga.com", "Sanatan Admin", "super_admin", "institutional"],
  ["editor@sanatanmarga.com", "Samachar Editor", "editor", "institutional"],
  ["chief@sanatanmarga.com", "Chief Editor", "chief_editor", "institutional"],
  ["moderator@sanatanmarga.com", "Chautari Moderator", "moderator", "pro"],
  ["author@sanatanmarga.com", "Lekhak Author", "author", "pro"],
  ["member@sanatanmarga.com", "Demo Member", "member", "premium"],
  ["reader@sanatanmarga.com", "Demo Reader", "user", "free"],
  ["sagarrana@gmail.com", "Sagar Rana", "super_admin", "institutional"],
].map(([email, displayName, role, membershipTier], index) => ({
  id: sanitize(email),
  uid: sanitize(email),
  email,
  displayName,
  role,
  membershipTier,
  status: "active",
  emailVerified: true,
  reputationScore: role === "super_admin" ? 980 : role === "editor" ? 720 : 180 + index * 30,
  createdAt: new Date(Date.now() - (index + 2) * 86400000).toISOString(),
  lastLoginAt: new Date(Date.now() - index * 3600000).toISOString(),
  photoURL: "",
  articleCount: index * 3,
}));

const notifications = [
  ["नयाँ समाचार प्रकाशित भयो", "आजको मुख्य समाचार प्रकाशित भएको छ।", "info"],
  ["सम्पादकीय समीक्षा आवश्यक", "३ वटा ड्राफ्ट समीक्षाको प्रतीक्षामा छन्।", "warning"],
  ["चौतारी सदस्यता बढ्यो", "आज १२ नयाँ सदस्य चौतारीमा सामेल भए।", "success"],
  ["प्रत्यक्ष प्रसारण सुरु", "नेपाल हब लाइभ स्ट्रिम सुरु भएको छ।", "info"],
  ["भुक्तानी प्राप्त भयो", "विज्ञापन अभियानको भुक्तानी प्राप्त भयो।", "success"],
  ["प्रणाली स्वास्थ्य रिपोर्ट", "सबै सेवाहरू सामान्य अवस्थामा छन्।", "info"],
].map(([title, body, type], index) => ({
  id: `notif_${index + 1}`,
  title,
  body,
  message: body,
  type,
  isRead: index > 3,
  userId: "all",
  createdAt: new Date(now - index * 5400000).toISOString(),
}));

const mediaAssets = (media.assets || []).map((asset) => ({
  ...asset,
  name: asset.name || asset.fileName || `asset_${asset.id}`,
  type: asset.type || "image",
  uploadedAt: asset.uploadedAt || asset.createdAt || new Date().toISOString(),
}));

const unsplash = [
  "photo-1544735716-392fe2489ffa",
  "photo-1548013146-72479768bada",
  "photo-1518546305927-5a555bb7020d",
  "photo-1493246507139-91e8fad9978e",
  "photo-1524492412937-b28074a5d7da",
  "photo-1533130061792-64b345e4a833",
  "photo-1514222134-b57cbb8ce073",
  "photo-1605649487212-47bdab064df7",
];
for (let i = 0; i < 8; i++) {
  mediaAssets.push({
    id: `demo_media_${i + 1}`,
    name: `Editorial Image ${i + 1}`,
    fileName: `editorial-${i + 1}.jpg`,
    type: "image",
    mimeType: "image/jpeg",
    url: `https://images.unsplash.com/${unsplash[i]}?auto=format&fit=crop&w=1200&q=80`,
    size: 240000 + i * 12000,
    uploadedAt: new Date(now - i * 7200000).toISOString(),
    uploadedBy: "admin@sanatanmarga.com",
  });
}

const ads = [
  {
    id: "ad_demo_1",
    title: "Sanatan Mart — Festive Collection",
    advertiser: "Sanatan Mart",
    position: "homepage_top",
    status: "active",
    isActive: true,
    startDate: new Date(now - 8 * 86400000).toISOString(),
    endDate: new Date(now + 22 * 86400000).toISOString(),
    impressions: 18420,
    clicks: 642,
    budget: { totalBudget: 80000, spent: 32400, pricingModel: "cpm", cpmRate: 250 },
    creative: { imageUrl: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=1200&q=80", ctaText: "Shop Now", targetUrl: "https://example.com" },
  },
  {
    id: "ad_demo_2",
    title: "Himalayan Ayurveda Wellness",
    advertiser: "Himalayan Ayurveda",
    position: "sidebar",
    status: "active",
    isActive: true,
    startDate: new Date(now - 3 * 86400000).toISOString(),
    endDate: new Date(now + 27 * 86400000).toISOString(),
    impressions: 9210,
    clicks: 318,
    budget: { totalBudget: 45000, spent: 12600, pricingModel: "cpc", cpcRate: 18 },
    creative: { imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80", ctaText: "Explore", targetUrl: "https://example.com" },
  },
  {
    id: "ad_demo_3",
    title: "Nepal Tourism Board — Visit Nepal",
    advertiser: "Nepal Tourism Board",
    position: "feed_inline",
    status: "paused",
    isActive: false,
    startDate: new Date(now - 30 * 86400000).toISOString(),
    endDate: new Date(now + 5 * 86400000).toISOString(),
    impressions: 45210,
    clicks: 1450,
    budget: { totalBudget: 150000, spent: 88000, pricingModel: "cpm", cpmRate: 180 },
    creative: { imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80", ctaText: "Discover", targetUrl: "https://example.com" },
  },
];

const tenants = [
  { id: "sanatan-media", name: "सनातन मिडिया मुख्य कार्यालय", code: "SANATAN_MEDIA", type: "media", status: "active", domain: "sanatanmarga.com", createdAt: new Date(now - 400 * 86400000).toISOString(), members: 42 },
  { id: "kathmandu-bureau", name: "काठमाडौँ ब्युरो", code: "KTM_BUREAU", type: "bureau", status: "active", domain: "ktm.sanatanmarga.com", createdAt: new Date(now - 210 * 86400000).toISOString(), members: 16 },
  { id: "pokhara-bureau", name: "पोखरा ब्युरो", code: "PKR_BUREAU", type: "bureau", status: "active", domain: "pokhara.sanatanmarga.com", createdAt: new Date(now - 120 * 86400000).toISOString(), members: 9 },
  { id: "janakpur-desk", name: "जनकपुर डेस्क", code: "JNK_DESK", type: "desk", status: "suspended", domain: "", createdAt: new Date(now - 40 * 86400000).toISOString(), members: 4 },
];

const menuItems = [
  ["गृहपृष्ठ", "Home", "/"],
  ["समाचार", "News", "/news"],
  ["चौतारी", "Community", "/community"],
  ["नेपाल हब", "Nepal Hub", "/nepal-hub"],
  ["ज्ञान", "Knowledge", "/knowledge"],
  ["लाइभ", "Live", "/live"],
  ["रेडियो", "Radio", "/radio"],
  ["ब्लग", "Blog", "/blog"],
].map(([label, labelEn, pathName], index) => ({
  id: `menu_${index + 1}`,
  label,
  labelEn,
  path: pathName,
  order: index + 1,
  visible: true,
  target: "_self",
}));

const auditLogs = Array.from({ length: 12 }).map((_, index) => ({
  id: `audit_${index + 1}`,
  action: ["ARTICLE_PUBLISHED", "USER_LOGIN", "AD_CAMPAIGN_CREATED", "SETTINGS_UPDATED", "SNAPSHOT_REBUILT", "MODERATION_APPROVED"][index % 6],
  actor: demoUsers[index % demoUsers.length].email,
  actorRole: demoUsers[index % demoUsers.length].role,
  targetType: ["article", "user", "ad", "settings", "snapshot", "comment"][index % 6],
  targetId: `target_${1000 + index}`,
  timestamp: new Date(now - index * 1800000).toISOString(),
  createdAt: new Date(now - index * 1800000).toISOString(),
  severity: index % 4 === 0 ? "warning" : "info",
  ip: "127.0.0.1",
}));

const campaigns = ads.map((ad, index) => ({
  id: `camp_${index + 1}`,
  name: ad.title,
  advertiser: ad.advertiser,
  status: ad.status,
  budget: ad.budget.totalBudget,
  spent: ad.budget.spent,
  startDate: ad.startDate,
  endDate: ad.endDate,
  impressions: ad.impressions,
  clicks: ad.clicks,
}));

const documents = {
  "settings/site": {
    ...(siteJson.settings || siteJson.site || siteJson),
    ...(homepage.siteSettings || {}),
  },
  "settings/homepage": {
    hero: homepage.homepage?.hero || {
      enabled: true,
      type: "youtube",
      videoUrl: "https://www.youtube.com/watch?v=1La4QzGeaaQ",
      title: "Sanatan Marga",
      subtitle: "Nepal's Civilizational Media Network",
      ctaText: "Latest News",
      allowUserHide: true,
    },
    layout: homepage.homepage?.layout || homepage.layout || null,
    header: homepage.homepage?.header || null,
    pinnedBreakingHeadlines: homepage.homepage?.pinnedBreakingHeadlines || [],
    updatedAt: new Date().toISOString(),
  },
  "settings/general": siteJson.settings || siteJson.site || {},
  "settings/features": { updatedAt: new Date().toISOString() },
  "settings/theme": { primary: "#0072B5", updatedAt: new Date().toISOString() },
  "settings/ads": { adsEnabled: true, updatedAt: new Date().toISOString() },
  "settings/seo": { siteName: "Sanatan Marga", canonicalDomain: "sanatanmarga.com" },
  "settings/notifications": { emailEnabled: false, pushEnabled: false },
  "site_config/main": siteConfig,
};

const collections = {
  articles,
  categories,
  events,
  community_posts: communityPosts,
  comments,
  users: demoUsers,
  notifications,
  media_assets: mediaAssets,
  ads,
  tenants,
  menu_items: menuItems,
  announcements: homepage.announcements || [],
  audit_logs: auditLogs,
  campaigns,
  knowledge_entities: knowledgeGraph.nodes || knowledgeGraph.entities || [],
  knowledge_relations: knowledgeGraph.edges || knowledgeGraph.relations || [],
  live_updates: nepalLive.liveUpdates || nepalLive.updates || [],
  markets: markets.markets || markets.rates || [],
  festivals: festivals.festivals || [],
  districts: districts.districts || [],
  briefings: briefings.briefings || [],
  models: glamourModels.models || glamourHome.models || [],
  products: [
    ["रुद्राक्ष माला", "Rudraksha Mala", 1450, "rudraksha"],
    ["सालिग्राम शिला", "Shaligram Shila", 3200, "shaligram"],
    ["पूजा थाली सेट", "Puja Thali Set", 2100, "puja"],
    ["भगवद् गीता (हार्डकभर)", "Bhagavad Gita", 850, "gita"],
    ["होम किट", "Havan Kit", 1750, "havan"],
    ["ध्यान कुशन", "Meditation Cushion", 1200, "cushion"],
    ["तुलसीको माला", "Tulsi Mala", 450, "tulsi"],
    ["शंख", "Conch Shell", 980, "shankha"],
  ].map(([name, nameEn, price, slug], index) => ({
    id: `product_${index + 1}`,
    name,
    nameEn,
    slug,
    price,
    currency: "NPR",
    stock: 12 + index * 5,
    status: "active",
    category: "Spiritual",
    image: `https://images.unsplash.com/${unsplash[index % unsplash.length]}?auto=format&fit=crop&w=900&q=80`,
    description: `${name} — handcrafted in Nepal, traditionally prepared and quality checked.`,
    createdAt: new Date(now - index * 86400000).toISOString(),
  })),
  courses: [
    ["वैदिक ज्योतिष मूलभूत", "Vedic Astrology Fundamentals", "beginner", 12],
    ["संस्कृत भाषा प्रवेश", "Sanskrit Language Intro", "beginner", 10],
    ["पुराण अध्ययन", "Puranic Studies", "intermediate", 18],
    ["कर्मकाण्ड अभ्यास", "Ritual Practice", "advanced", 24],
    ["ध्यान र योग", "Meditation & Yoga", "beginner", 8],
  ].map(([title, titleEn, level, lessons], index) => ({
    id: `course_${index + 1}`,
    title,
    titleEn,
    level,
    lessonsCount: lessons,
    durationHours: lessons * 2,
    enrolled: 40 + index * 28,
    rating: 4.6 + (index % 4) * 0.1,
    status: "published",
    instructor: "Sanatan Gurukul",
    image: `https://images.unsplash.com/${unsplash[(index + 2) % unsplash.length]}?auto=format&fit=crop&w=1000&q=80`,
  })),
  timeline_events: articles.slice(0, 12).map((a, index) => ({
    id: `timeline_${index + 1}`,
    title: a.title,
    summary: a.excerpt || "",
    date: a.publishedAt || a.createdAt || new Date(now - index * 86400000).toISOString(),
    category: a.categoryId || "news",
    type: "article",
    articleId: a.id,
    image: a.featuredImage || a.imageUrl || "",
  })),
  subscriptions: [
    { id: "sub_1", email: "reader1@example.com", status: "active", tier: "free", createdAt: new Date(now - 12 * 86400000).toISOString() },
    { id: "sub_2", email: "reader2@example.com", status: "active", tier: "premium", createdAt: new Date(now - 9 * 86400000).toISOString() },
    { id: "sub_3", email: "reader3@example.com", status: "unsubscribed", tier: "free", createdAt: new Date(now - 6 * 86400000).toISOString() },
  ],
  inquiries: [
    { id: "inq_1", name: "Ramesh Shrestha", email: "ramesh@example.com", subject: "Advertising", message: "I would like to advertise on your homepage.", status: "new", createdAt: new Date(now - 86400000).toISOString() },
    { id: "inq_2", name: "Sita Karki", email: "sita@example.com", subject: "Membership", message: "How do I upgrade to a premium membership?", status: "in_progress", createdAt: new Date(now - 3 * 86400000).toISOString() },
  ],
  contact_messages: [
    { id: "msg_1", name: "Hari Thapa", email: "hari@example.com", message: "Great coverage of the festival.", isRead: false, createdAt: new Date(now - 7200000).toISOString() },
  ],
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "seed.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), collections, documents }),
);

fs.writeFileSync(
  path.join(outDir, "manifest.json"),
  JSON.stringify({
    snapshotVersion: "demo-local-1",
    generatedAt: new Date().toISOString(),
    modules: {
      homepage: { version: "1", sha256: "demo" },
      latest: { version: "1", sha256: "demo" },
      categories: { version: "1", sha256: "demo" },
    },
  }),
);

const collectionsOut = path.join(outDir, "collections");
fs.mkdirSync(collectionsOut, { recursive: true });
for (const [name, docs] of Object.entries(collections)) {
  fs.writeFileSync(path.join(collectionsOut, `${name}.json`), JSON.stringify({ items: docs }));
}

console.log(
  JSON.stringify(
    {
      articles: articles.length,
      categories: categories.length,
      events: events.length,
      communityPosts: communityPosts.length,
      comments: comments.length,
      media: mediaAssets.length,
      seedKB: Math.round(fs.statSync(path.join(outDir, "seed.json")).size / 1024),
    },
    null,
    2,
  ),
);
