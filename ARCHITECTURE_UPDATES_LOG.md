# सनातन मार्ग (Sanatan Marga) — Architecture, Updates & Vibe Coding Guide
> **Version**: 5.2.0-resilient  
> **Last Updated**: 2026-11-12  
> **Status**: Production-Ready with 3-Tier Multi-Store & Quota Resilience

---

## १. प्रणाली अवलोकन (Executive Architecture Overview)

**सनातन मार्ग** (Sanatan Marga) एक आधुनिक, उच्च कार्यक्षमता (High Performance), र शून्य-डाउनटाइम (Zero-Downtime) डिजिटल प्लेटफर्म हो। यसको मुख्य उद्देश्य सनातन ज्ञान, समाचार, बहुआयामिक मिडिया, र सामुदायिक सहकार्यलाई विश्वभरका नेपाली तथा सनातन धर्मावलम्बीहरूमाझ सर्वसुलभ गराउनु हो।

कुनै पनि क्लाउड प्लेटफर्म (जस्तै Firebase Spark plan वा सीमित बजेट) को कोटा समाप्त (Quota Exhausted) हुँदा समेत एप कहिल्यै बन्द नहुने गरी **३-तहको डेटा व्यवस्थापन (3-Tier Multi-Store Architecture)** र **स्वतः रिकभरी प्रणाली (Auto-Sync Recovery System)** लागू गरिएको छ।

```
                                      ┌───────────────────────────────────────────────┐
                                      │              प्रयोगकर्ता (Client UI)           │
                                      │          React 19 + Vite + Tailwind v4        │
                                      └───────────────────────┬───────────────────────┘
                                                              │
                                       (Write: १. Firebase -> २. Localhost -> ३. R2)
                                       (Read:  १. Firebase -> २. Localhost/R2 CDN)
                                                              │
                     ┌────────────────────────────────────────┼────────────────────────────────────────┐
                     ▼                                        ▼                                        ▼
    ┌─────────────────────────────────┐      ┌─────────────────────────────────┐      ┌─────────────────────────────────┐
    │     तह १: FIREBASE CLOUD        │      │     तह २: LOCALHOST INDEXEDDB   │      │   तह ३: CLOUDFLARE R2 & WORKER  │
    │  • Cloud Firestore              │      │  • sanatan_snapshot_db (सयौं MB)│      │  • sanatanmarga-assets R2       │
    │  • Firebase Auth (Google Sign-In)│     │  • Memory DB Cache Layer        │      │  • Cloudflare Worker API Gateway│
    │  • Cloud Messaging (FCM)        │      │  • अफलाइन / शून्य-विलम्बता UI    │      │  • */5 * * * * Cron Trigger     │
    │  • मुख्य प्राथमिक डेटा स्रोत     │      │  • ब्राउजर रिफ्रेसमा डेटा सुरक्षित │      │  • Gemini 2.5 Flash AI Engine   │
    └────────────────┬────────────────┘      └─────────────────────────────────┘      └────────────────┬────────────────┘
                     │                                                                                 │
                     │                          Firebase Quota Exhausted?                              │
                     │                     ◄─────────────────────────────────                          │
                     │                         (Breaker Trips -> Journal to R2)                        │
                     │                                                                                 │
                     │                      Quota Restored? (Cron Auto-Sync)                           │
                     └─────────────────────────────────────────────────────────────────────────────────┘
```

---

## २. ३-तहको बहु-भण्डारण डेटा प्रवाह (3-Tier Multi-Store Data Flow)

डेटा निष्ठा (Data Integrity) र उच्च गतिको लागि निम्न ३-तहको नियम कडाइका साथ लागू गरिएको छ:

### क. लेखन प्रवाह (Write Flow Sequence)
1. **पहिलो तह (First: Firebase Cloud)**:
   - यदि एप `firebase` मोडमा छ र सर्किट ब्रेकर `CLOSED` छ भने डेटा सिधै Firestore मा लेखिन्छ।
   - यदि Firebase ले `resource-exhausted` वा 429 कोटा त्रुटि फर्काउँछ भने:
     - सर्किट ब्रेकर तत्काल `OPEN` हुन्छ।
     - अपरेसनलाई `firestoreFallback.ts` को पेन्डिङ जर्नलमा सुरक्षित गरिन्छ।
     - Cloudflare Worker को R2 जर्नल (`journal/pending/`) मा ब्याकअप गरिन्छ।
2. **दोस्रो तह (Second: Localhost IndexedDB)**:
   - `indexedDbStore.ts` ले ब्राउजरको उच्च-क्षमता IndexedDB (`sanatan_snapshot_db`) मा `articles`, `events`, `comments`, `community_posts`, `knowledge_nodes`, `snapshots` स्टोरहरूमा तुरुन्तै डेटा लेख्छ।
   - यसले प्रयोगकर्तालाई तुरुन्तै (Zero latency) प्रतिक्रिया दिन्छ। पृष्ठ रिफ्रेस गरे पनि डेटा हराउँदैन।
3. **तेस्रो तह (Third: Cloudflare R2 Real-time Snapshot Sync)**:
   - कुनै पनि नयाँ लेख वा कागजात सिर्जना/परिमार्जन भएपछि `syncDocumentSnapshotToR2(collection, id, data)` मार्फत पृष्ठभूमिमा Cloudflare Worker API (`/api/snapshots/sync-doc`) मा पठाइन्छ।
   - R2 ले तुरुन्तै स्न्यापसट (`snapshots/articles/{id}.json`, `snapshots/article_{id}.json`) अपडेट गर्छ, जसले गर्दा अन्य पाठकहरूले सिधै CDN बाट ताजा सामग्री पढ्न पाउँछन्।

### ख. पठन प्रवाह (Read Flow Sequence)
1. **सामान्य अवस्था**: प्राथमिक रूपमा Firestore वा स्थानीय स्न्यापसट क्यासबाट डेटा पढिन्छ।
2. **कोटा सकिएको अवस्था (Quota Exhausted / Offline)**:
   - सर्किट ब्रेकरले Firestore कलहरू रोक्छ।
   - `indexedDbStore` वा Cloudflare R2 CDN स्न्यापसट (`/api/cache/*` वा `public/snapshots/*`) बाट तत्काल १००% डेटा उपलब्ध गराइन्छ।

---

## ३. कोटा लचकता र स्वतः सिङ्क्रोनाइजेसन (Quota Resilience & Auto-Sync Engine)

### १. सर्किट ब्रेकर (Circuit Breaker)
- **स्थान**: `src/lib/firestoreFallback.ts`
- **अवस्था**:
  - `CLOSED`: Firebase स्वस्थ छ, सबै अपरेसन सिधै जान्छन्।
  - `OPEN`: कोटा सकियो वा नेटवर्क अवरुद्ध भयो। रिड/राइटहरू स्थानीय IndexedDB र R2 जर्नलमा डाइभर्ट हुन्छन्।
  - `HALF_OPEN`: कुलडाउन अवधि (Exponential backoff: 10 मिनेट देखि 60 मिनेट) समाप्त भएपछि एकल प्रोब अनुरोध पठाइन्छ।
- **पहिचान हुने त्रुटिहरू**: `resource-exhausted`, `firestore/resource-exhausted`, `quota exceeded`, `billing disabled`।

### २. R2 फलब्याक जर्नल (R2 Fallback Journal)
- जब कोटा सकिन्छ, प्रयोगकर्ता वा एडमिनले गरेको प्रत्येक परिवर्तन Cloudflare R2 को `journal/pending/{timestamp}_{opId}.json` मा सुरक्षित हुन्छ।
- यसो गर्दा ब्राउजर बन्द भए पनि वा डिभाइस परिवर्तन भए पनि कुनै डेटा नष्ट हुँदैन।

### ३. Cloudflare Worker क्रोन ट्रिगर (Scheduled Background Worker)
- **समय तालिका**: `*/5 * * * *` (प्रत्येक ५ मिनेटमा स्वतः चल्ने)
- **स्थान**: `server/worker/src/sync.ts` & `wrangler.toml`
- **कार्यप्रणाली**:
  1. `_health/probe` मार्फत Firebase कोटा पुनः सक्रिय भएको जाँच गर्छ।
  2. कोटा उपलब्ध भएको खण्डमा R2 को `journal/pending/` बाट पेन्डिङ अपरेसनहरू एक-एक गरी Firestore मा लेख्छ (Replay)।
  3. सफलतापूर्वक लेखिएपछि त्यसलाई `journal/applied/` मा सारेर अभिलेख राख्छ।
  4. दैनिक सिङ्क लग `system/sync-logs/YYYY-MM-DD.json` मा सुरक्षित गर्छ।
- **म्यानुअल ट्रिगर**: एडमिनले ५ मिनेट नपर्खी मिसन कन्ट्रोलबाट तुरुन्तै सिङ्क गर्न `POST /api/fallback/journal/sync` कल गर्न सक्छन्।

---

## ४. १६ वटा मुख्य विशेषताहरूको प्रमाणीकरण तथा स्थिति (16 Core Features Verification)

| # | विशेषता (Feature) | मार्ग (Route) | प्राथमिक डेटा स्रोत | कोटा फलब्याक स्रोत | API गेटवे रूट | स्थिति |
|---|---|---|---|---|---|---|
| **१** | **समाचार (Latest News)** | `/news`, `/category/:slug`, `/article/:id` | Firestore `articles` | IndexedDB / R2 `snapshots/articles/*` | `GET /api/cache/articles/*` |  सक्रिय (Active) |
| **२** | **सोध्नुहोस् (Ask Sanatan AI)** | `/ask`, `AskSanatanModal` | Gemini 2.5 Flash | स्थानीय ज्ञानकोष आधार | `POST /api/ask-sanatan` |  सक्रिय (Active) |
| **३** | **प्रत्यक्ष भिडियो (Live Stream)** | `/live`, `/live/:id` | YouTube HLS / Firestore `live_streams` | R2 क्यास / IndexedDB | `GET /api/live-data` |  सक्रिय (Active) |
| **४** | **सनातन रेडियो (Radio 24/7)** | Floating MiniPlayer, `/radio` | Icecast / Shoutcast / R2 Streams | स्थानीय अडियो सूची क्यास | `GET /api/radio-data` |  सक्रिय (Active) |
| **५** | **ज्ञानकोष (Knowledge Base)** | `/knowledge`, `/knowledge/:slug` | Firestore `knowledge_nodes` | R2 `snapshots/knowledge/graph.json` | `GET /api/cache/knowledge.json` |  सक्रिय (Active) |
| **६** | **ऐतिहासिक अभिलेख (ArchivesOS)**| `/archives`, `/archives/:id` | Firestore `archives` / R2 PDF Storage | R2 Direct Assets | `GET /api/files/archives/*` |  सक्रिय (Active) |
| **७** | **सनातन अकादेमी (Academy)** | `/academy`, `/courses/:id` | Firestore `courses`, `lessons` | IndexedDB `snapshots` | `GET /api/cache/academy/*` |  सक्रिय (Active) |
| **८** | **तालिम तथा प्रमाणीकरण (Training)**| `/training`, `/training/:id` | Firestore `training_modules` | स्थानीय मोड्युल क्यास | `POST /api/training/certificate/issue` |  सक्रिय (Active) |
| **९** | **प्रमाणपत्र प्रमाणीकरण (Verify)**| `/verify`, `/verify/:id` | Cloudflare Worker HMAC-SHA256 | R2 `certificates/{id}.json` | `GET /api/certificates/verify/:id` |  सक्रिय (Active) |
| **१०**| **चौतारी समुदाय (Community)** | `/chautari`, `/chautari/:id` | Firestore `community_posts` | IndexedDB `community_posts` | `POST /api/fallback/journal` |  सक्रिय (Active) |
| **११**| **कार्यक्रमहरू (Events)** | `/events`, `/event/:id` | Firestore `events` | IndexedDB `events` / R2 `snapshots/event_*` | `GET /api/cache/events/*` |  सक्रिय (Active) |
| **१२**| **सनातन स्टोर (Store & Membership)**| `/store`, `/store/product/:id` | Firestore `store_products` | R2 `store/products.json` | `GET /api/store/products`, `POST /api/store/orders` |  सक्रिय (Active) |
| **१३**| **कालक्रम तथा समयरेखा (Timeline)** | `/timeline`, `/timeline/:era` | Firestore `timeline_events` | R2 `snapshots/timeline.json` | `GET /api/cache/timeline.json` |  सक्रिय (Active) |
| **१४**| **नेपाल हब (77 Districts)** | `/nepal-hub`, `/district/:id` | 77 जिल्ला डेटा / Firestore `nepal_hub` | R2 `snapshots/nepalhub.json` | `GET /api/cache/nepalhub.json` |  सक्रिय (Active) |
| **१५**| **हाम्रोबारे र सुशासन (Transparency)**| `/about`, `/governance` | R2 Audit Logs, PDF Reports | R2 Direct Assets | `GET /api/files/governance/*` |  सक्रिय (Active) |
| **१६**| **एडमिन मिसन कन्ट्रोल (Admin)** | `/admin/*`, `/admin/command-center`| Firestore Admin Collections | IndexedDB + R2 Journal Sync | `GET /api/admin/command-center`, `POST /api/snapshots/sync-doc` |  सक्रिय (Active) |

---

## ५. Cloudflare Worker API Gateway विन्यास निर्देशिका (Deployment Guide)

Cloudflare Worker ले एपीआई गेटवे, आर२ स्टोरेज ह्यान्डलर, एआई इन्जिन र कोटा फलब्याक सिङ्कको रूपमा कार्य गर्दछ।

### आवश्यक वातावरण चर र गोप्य कुञ्जीहरू (Secrets & Environment Variables)

Worker फोल्डर: `server/worker/`

1. **`wrangler.toml`**:
   ```toml
   name = "sanatanmarga-api"
   main = "src/index.ts"
   compatibility_date = "2025-01-01"

   [[r2_buckets]]
   binding = "BUCKET"
   bucket_name = "sanatanmarga-assets"

   [triggers]
   crons = ["*/5 * * * *"]

   [vars]
   ALLOWED_ORIGINS = "*"
   R2_PUBLIC_URL = "https://assets.sanatanmarga.com"
   FIREBASE_PROJECT_ID = "pod-studio-saas"
   GEMINI_MODEL = "gemini-2.5-flash"
   GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts"
   AI_DAILY_REQUEST_LIMIT = "5000"
   ADMIN_EMAILS = "sagarrana@gmail.com,admin@sanatanmarga.com"
   ```

2. **Wrangler Secrets दर्ता गर्ने तरिका**:
   ```bash
   cd server/worker
   npx wrangler secret put GEMINI_API_KEY
   npx wrangler secret put ADMIN_API_TOKEN
   npx wrangler secret put UPLOAD_SIGNING_SECRET
   ```

3. **डिप्लोय गर्ने कमाण्ड**:
   ```bash
   npx wrangler deploy
   ```

---

## ६. भाइब कोडिङ तथा अन्य एपहरूको लागि निरन्तरता निर्देशिका (Vibe Coding Continuation Guide)

भविष्यमा कुनै नयाँ एआई मोडेल, भाइब कोडिङ टुल वा डेभलपरले यस परियोजनामा काम गर्दा ध्यान दिनुपर्ने मुख्य बुँदाहरू:

### क. मोड परिवर्तन (Switching Backend Mode)
- **डेमो मोड (अफलाइन / कुनै पनि क्लाउड विना चलाउन)**:
  `.env` मा राख्ने:
  ```env
  VITE_API_MODE=demo
  VITE_ENABLE_DEMO_LOGIN=true
  ```
- **उत्पादन मोड (Firebase + Cloudflare R2 + API Gateway)**:
  `.env` मा राख्ने:
  ```env
  VITE_API_MODE=firebase+r2
  VITE_FIREBASE_API_KEY=your-api-key
  VITE_FIREBASE_PROJECT_ID=your-project-id
  VITE_FIREBASE_APP_ID=your-app-id
  VITE_API_BASE_URL=https://api.sanatanmarga.com
  VITE_R2_PUBLIC_URL=https://assets.sanatanmarga.com
  ```

### ख. नयाँ फिचर थप्दा पालना गर्नुपर्ने नियमहरू:
1. **प्रत्यक्ष `fetch('https://firestore...')` कहिल्यै नगर्नुहोस्**: सधैं `@/src/lib/firebase` का `getDocs`, `getDoc`, `setDoc`, `updateDoc`, `addDoc`, `deleteDoc` प्रयोग गर्नुहोस्। यसले गर्दा ३-तहको कोटा फलब्याक र IndexedDB स्वतः सुरक्षित हुन्छ।
2. **ठूला फाइल र मिडिया R2 मा मात्र पठाउनुहोस्**: तस्बिर, अडियो, भिडियो अपलोड गर्न `src/lib/api/storage.ts` को `createStorage().uploadFile(...)` प्रयोग गर्नुहोस् जसले R2 Presigned Upload प्रयोग गर्दछ।
3. **अद्यावधिक लग अद्यावधिक राख्नुहोस्**: कुनै पनि नयाँ कोड, कम्पोनेन्ट वा एपीआई परिवर्तन भएपछि यो `ARCHITECTURE_UPDATES_LOG.md` फाइलमा लग थप्नुहोस्।

---

## ७. हालसम्मका परिवर्तनहरूको विस्तृत लग (Changelog of Updates)

### [2026-11-12] - संस्करण ५.२.०: ३-तहको भण्डारण र कोटा लचकता सम्पन्न
- **३-तहको डेटा लेखन (3-Tier Multi-Store Pipeline)**:
  - `src/lib/firebase.ts` मा `setDoc`, `updateDoc`, `addDoc`, `deleteDoc` लाई ३-तहको ढाँचामा पुनर्संरचना गरियो:
    1. Firebase Cloud (यदि अनलाइन र कोटा उपलब्ध छ भने)।
    2. Localhost IndexedDB (`sanatan_snapshot_db` को समर्पित स्टोरहरूमा सुरक्षित)।
    3. Cloudflare R2 Real-time Snapshot Sync (`/api/snapshots/sync-doc` मार्फत तत्काल स्न्यापसट अपडेट)।
- **IndexedDB क्षमता विस्तार (Hundred MB Storage Engine)**:
  - `src/lib/demoStore.ts` लाई `indexedDbStore.ts` का स्टोरहरू (`articles`, `events`, `comments`, `community_posts`, `knowledge_nodes`, `notifications`, `ads`, `media_assets`, `snapshots`) सँग प्रत्यक्ष जोडिएको छ।
  - बुट गर्दा यी सबै स्टोरहरूबाट डेटा लोड गरी ब्राउजर रिफ्रेस वा बन्द गर्दा पनि डेटा अक्षुण्ण रहने बनाइयो।
- **Cloudflare Worker मा रियल-टाइम स्न्यापसट र सिङ्क एपीआई**:
  - `server/worker/src/routes.ts` मा `POST /api/snapshots/sync-doc` थपियो जसले नयाँ लेख लेख्नासाथ R2 मा व्यक्तिगत स्न्यापसट र कभर स्न्यापसट तुरुन्त अपडेट गर्छ।
  - `server/worker/src/routes.ts` मा `POST /api/fallback/journal/sync` र `POST /api/fallback/sync` थपियो जसले एडमिनलाई म्यानुअल रूपमा तत्काल सिङ्क गर्न दिन्छ।
- **Cloudflare Worker Scheduled Cron Trigger**:
  - `server/worker/wrangler.toml` मा `[triggers] crons = ["*/5 * * * *"]` सक्रिय गरियो, जसले प्रत्येक ५ मिनेटमा पृष्ठभूमिमा स्वतः R2 जर्नललाई Firestore मा सिङ्क गर्छ।
- **Tailwind CSS v4 स्क्यानर मेमोरी अप्टिमाइजेसन**:
  - `src/index.css` मा `@source "../index.html";` र `@source "../src";` थप गरी Rust बाईनरीले ७ MB का स्न्यापसट फाइलहरू स्क्यान गरेर हुने `ENOMEM` क्र्यास पूर्ण रूपमा समाधान गरियो।
- **TypeScript तथा Vite कम्पाइल प्रमाणीकरण**:
  - सबै प्रकारका आयात, इन्टरफेस, र मोड्युल डिक्लरेसनहरू सच्याइयो (`tsc --noEmit` र `vite build` दुवै शून्य त्रुटिका साथ पास)।
- **एडमिन मिसन कन्ट्रोलमा म्यानुअल सिङ्क इन्टिग्रेसन**:
  - `src/pages/AdminMissionControl.tsx` मा `handleForceSyncDelivery` लाई विस्तार गरी स्न्यापसट रिफ्रेसका साथै Cloudflare Worker को `POST /api/fallback/journal/sync` स्वतः कल गर्ने बनाइयो। यसले एडमिनलाई मिसन कन्ट्रोलबाटै एक क्लिकमा R2 फलब्याक जर्नललाई Firebase मा तत्काल सिङ्क गर्न सक्षम बनाउँछ।
- **ब्राउजर प्रमाणीकरण तथा पोलिश (Browser Subagent Verification & Route Enhancements)**:
  - Chrome Headless बाट १६ वटै मुख्य विशेषताहरू प्रत्यक्ष रूपमा परीक्षण गरी १००% सफलता (NavigationOS: 80 nav entries registered across 170 routes) प्रमाणित गरियो।
  - `src/routes/AppRoutes.tsx` मा `/verify` तथा `/verify/:certId` रूट अलियास थप गरी प्रमाणपत्र प्रमाणीकरणलाई छोटो URL बाट पहुँचयोग्य बनाइयो।
  - `public/snapshots/feature-control.json` मा `commerce.store` लाई `public` मा स्विच गरी सनातन स्टोर (`/store`) सक्रिय गरियो।
  - `src/pages/AboutPage.tsx` मा समृद्ध नेपाली तथा अंग्रेजी आधिकारिक विवरण (About Us content) थपियो।
- **गृहपृष्ठ व्यवस्थापन प्रत्यक्ष सिङ्क (Homepage OS & Civilizational Command Live Reflection)**:
  - एडमिन प्यानल (`/admin/homepage`) बाट गरिएका परिवर्तनहरू (Hero Video, Title, Subtitle, CTA, Layout Toggles, Pinned Breaking Headlines) गृहपृष्ठमा तुरुन्तै प्रतिविम्बित हुने बनाइयो।
  - `server/worker/src/routes.ts` मा `POST /api/snapshots/sync-doc` ले `settings/homepage` प्राप्त गर्दा Cloudflare R2 को `snapshots/homepage.json` लाई समेत स्वतः नयाँ Hero र Layout सँग मर्ज गरी CDN मा लाइभ गर्ने बनाइयो।
  - `src/services/snapshotEngine.ts` ले स्न्यापसट लोड गर्दा एडमिनले कन्फिगर गरेको `hero` र `layout` लाई प्राथमिकता दिने गरी `enrichSnapshot` अद्यावधिक गरियो।
  - `src/pages/HomePage.tsx` मा `safeOnSnapshot(doc(db, "settings", "homepage"))` र `sanatan_homepage_settings_updated` इभेन्ट श्रोता थप गरी प्रत्यक्ष लाइभ अपडेट (Realtime Re-render) गराइयो।
  - गृहपृष्ठमा `BreakingNewsStrip` सक्रिय गरियो जसले एडमिनले पिन गरेका ब्रेकिङ हेडलाइनहरू (`pinnedBreakingHeadlines`) वास्तविक समयमा प्रदर्शन गर्दछ।
  - `layoutConfig` का सबै टगलहरू (`hero`, `breakingNews`, `categoryGrid`, `featuredStories`, `districtIntelligence`, `knowledgeOS`, `communityOnboarding`) लाई गृहपृष्ठका सेक्सनहरूसँग प्रत्यक्ष जोडिएको छ।

### [2026-11-12] - संस्करण ५.३.०: GitHub भण्डार निर्माण तथा Render डिप्लोयमेन्ट कन्फिगरेसन
- **GitHub Repository सिर्जना तथा पुश**:
  - आधिकारिक रिपोजिटरी: `https://github.com/peakpulsenp/sanatanmarga`
  - ब्रान्च: `main`
  - प्रारम्भिक कमिट: `6fa078b` (कुल १३०६ स्रोत फाइलहरू सुरक्षित र सफा अवस्थामा कमिट गरियो)।
  - `.gitignore` ले `node_modules/`, `dist/`, `.wrangler/`, र `.env*` जस्ता संवेदनशील तथा निर्माण फाइलहरूलाई बाइपास गरेको छ।
- **Render Static Site Blueprint (`render.yaml`)**:
  - रनटाइम: `static`
  - नाम: `sanatanmarga`
  - Build Command: `npm install && npm run build`
  - Static Publish Path: `./dist`
  - वातावरण भेरिएबल: `NODE_VERSION=20`
  - SPA Rewrite Rule: `/* -> /index.html` (React Router का सबै १६०+ रूटहरूलाई ४०४ त्रुटिरहित लोड गर्न)।

### [2026-11-12] - संस्करण ५.४.०: Cloudflare R2 दुई बकेट वास्तुकला (Marketplace-media & sanatanmarga-snapshots)
- **बकेट पृथकीकरण (Dedicated Dual-Bucket Architecture)**:
  - `Marketplace-media`: सबै बाइनरी मिडिया फाइलहरूका लागि समर्पित (`images/`, `audio/`, `videos/`, `documents/`, `media/`)।
  - `sanatanmarga-snapshots`: सबै JSON स्न्यापसट, सिस्टम डेटा, र फलब्याक जर्नलका लागि समर्पित (`snapshots/`, `journal/`, `certificates/`, `orders/`)।
- **Cloudflare Worker बाइन्डिङ अद्यावधिक (`server/worker/wrangler.toml`)**:
  - `[[r2_buckets]] binding = "MEDIA_BUCKET", bucket_name = "Marketplace-media"`
  - `[[r2_buckets]] binding = "SNAPSHOT_BUCKET", bucket_name = "sanatanmarga-snapshots"`
  - `[[r2_buckets]] binding = "BUCKET", bucket_name = "sanatanmarga-snapshots"` (पश्चगामी अनुकूलताका लागि)
- **स्वचालित मिडिया फोल्डर वर्गीकरण (`buildMediaObjectKey`)**:
  - फाइलको MIME प्रकार अनुसार स्वतः उपयुक्त फोल्डरमा राख्ने प्रणाली:
    - `images/`: JPG, PNG, WEBP, SVG फोटो तथा ब्यानरहरू
    - `audio/`: MP3, WAV, TTS अडियो, रेडियो तथा पोडकास्टहरू
    - `videos/`: MP4, WEBM भिडियोहरू
    - `documents/`: PDF, DOC, ग्रन्थ, ई-कागज तथा पाण्डुलिपिहरू
- **फ्रन्टइन्ड तथा ब्याकइन्ड URL रूटिङ**:
  - `src/lib/backendConfig.ts` मा `r2MediaPublicUrl` र `r2SnapshotsPublicUrl` थप गरी मिडिया र स्न्यापसटहरू आ-आफ्नो बकेट वा कस्टम CDN डोमेनबाट स्वचालित लोड हुने बनाइयो।

---
*सनातन मार्ग इन्जिनियरिङ टोलीद्वारा सुरक्षित र प्रमाणित।*
