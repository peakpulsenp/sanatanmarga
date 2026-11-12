# SanatanMarga Cloudflare Worker API Gateway

Production API gateway for SanatanMarga (`sanatanmarga-api`).
Bridges the React frontend to:
- **Cloudflare R2** for durable asset storage, audio files, and SnapshotOS distributions
- **Google Gemini AI & Gemini TTS** for 100% grounded Vedic research, audio recitations, and translation
- **Firebase Authentication** with RS256 token verification via Google Public JWKS
- **Quota Fallback Journal** for seamless offline and quota-exhaustion buffer/recovery

---

## 🚀 Deployment Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org) (v18+)
- [Cloudflare Account](https://dash.cloudflare.com) with R2 enabled

### 2. Create the R2 Bucket
In the Cloudflare Dashboard, go to **R2** > **Create Bucket**:
- Name: `sanatanmarga-assets`
- Optionally connect a custom domain (e.g. `assets.sanatanmarga.com`)

### 3. Configure Secrets
Run the following in the `server/worker` directory:
```bash
# Gemini AI Key (for Ask Sanatan, TTS, and AI generation)
npx wrangler secret put GEMINI_API_KEY

# Master Admin Token (for server-to-server or mission control overrides)
npx wrangler secret put ADMIN_API_TOKEN

# Secret for signing presigned media uploads
npx wrangler secret put UPLOAD_SIGNING_SECRET
```

### 4. Deploy the Worker
```bash
npx wrangler deploy
```
This deploys the worker to `https://sanatanmarga-api.<your-subdomain>.workers.dev`.

### 5. Connect Frontend App
In the frontend hosting environment (Vercel, Netlify, Render, or `.env.local`):
```env
VITE_API_MODE=firebase+r2
VITE_API_BASE_URL=https://sanatanmarga-api.<your-subdomain>.workers.dev
VITE_R2_PUBLIC_URL=https://assets.sanatanmarga.com
```

Alternatively, if hosting the SPA on Cloudflare Pages or using Cloudflare DNS routes:
Map route `sanatanmarga.com/api/*` to the `sanatanmarga-api` worker.

---

## 📋 API Endpoints

| Method | Path | Description | Access |
|---|---|---|---|
| `GET` | `/api/health` | Health & connected services check | Public |
| `GET` | `/api/cache/*` | Read JSON from SnapshotOS R2 tree | Public |
| `POST` | `/api/snapshots/publish` | Publish / rebuild snapshots into R2 | Admin |
| `POST` | `/api/fallback/journal` | Buffer client writes when Firestore quota runs out | Public / Auth |
| `POST` | `/api/fallback/journal/settle` | Settle replayed writes | Public |
| `GET` | `/api/fallback/status` | Current pending journal count | Public |
| `POST` | `/api/media/presign` | Generate signed upload URL for R2 | Auth User |
| `PUT` | `/api/media/upload/*` | Direct streaming PUT into R2 | Signed Token |
| `POST` | `/api/media/complete` | Finalize metadata for uploaded media | Auth User |
| `POST` | `/api/media/upload-direct` | Multipart upload into R2 | Auth User |
| `GET` | `/api/files/*` | Stream files from private R2 bucket | Public |
| `POST` | `/api/ask-sanatan` | Grounded Vedic / Sanatan Dharma AI research | Public (Rate-limited) |
| `POST` | `/api/ai/generate` | Generative AI assistant | Auth User |
| `POST` | `/api/tts/generate` | Gemini TTS audio synthesizer (WAV / R2 cache) | Public (Rate-limited) |
| `POST` | `/api/radio/tts` | Sanatan Radio Station Voice ID & TTS | Public (Rate-limited) |
| `POST` | `/api/language/translate` | Nepali / English / Sanskrit translation | Public (Rate-limited) |
| `POST` | `/api/training/certificate/issue`| Cryptographically sign & issue certificate | Auth User |
| `GET` | `/api/certificates/verify/:id` | Verify authenticity of certificate | Public |
| `GET` | `/api/store/products` | Read active store products | Public |
| `POST` | `/api/store/orders` | Place store order (idempotent, journaled) | Public |
| `POST` | `/api/radio/heartbeat` | Live listener heartbeat ping | Public |
| `GET` | `/api/admin/command-center` | Mission control status & journal metrics | Admin |
| `POST` | `/api/system/telemetry` | Batch telemetry & learning events | Public |
