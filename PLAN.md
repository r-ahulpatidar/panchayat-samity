# पंचायत समिति जन-समस्या पोर्टल: Plan

## Context
This is a small Hindi-first, mobile-first Next.js site for a family member who is contesting a Panchayat Samiti seat in Rajasthan. Residents submit local problems through one simple form. Each complaint gets an ID (`PS-2026-0001`), is stored in **Google Sheets** (the MVP "admin panel") and is sent to the representative on **WhatsApp**. Nothing is built yet. The first deliverable is this plan, saved as `/Users/rahul/personal/panchayat-samiti/PLAN.md`. Code comes afterwards.

### Review of the brief: what it gets right and what it misses
The brief is solid. Six gaps need fixing, or they will hurt in production:
1. **Image upload is under-specified.** On Vercel, function request bodies are capped at about 4.5 MB, and phone photos are 3–8 MB. Uploads will fail randomly unless images are compressed in the browser first (see §5).
2. **Google Drive is a trap for photos.** Service accounts no longer have their own Drive storage quota, so uploads to a service account's "My Drive" fail. Drive only works with a Workspace Shared Drive. Use Vercel Blob instead.
3. **WhatsApp Cloud API needs an approved *template*.** A business-initiated message cannot be free text. Template variables also **cannot contain newlines**, so the description must be flattened. In test mode, only allow-listed recipient numbers work.
4. **Sequential IDs have a race.** Two submissions at the same moment could get the same number. The fix is to derive the ID from the row number that Sheets returns after an atomic append (§4).
5. **In-memory rate limiting does not work on serverless.** Use Upstash Redis (free tier) or nothing.
6. **Legal/consent.** DPDP Act 2023 requires clear consent, a stated purpose and a contact for deletion requests. Also keep the site a *service channel* and not campaign material during the Model Code of Conduct period. Confirm this locally.

---

## 1. Pages (6 + 1 later)
| Route | Page | Notes |
|---|---|---|
| `/` | मुख्य पृष्ठ | Photo, name, area, short intro, big CTA **"अपनी समस्या बताएं"**, 3-step "कैसे काम करता है", category grid (each tile links to the form with the category preselected), WhatsApp/call buttons |
| `/samasya-batayen` | समस्या बताएं | The core page. Single-screen form |
| `/safal?id=PS-2026-0012` | Success | Large ✓, the ID in large type, a "ID कॉपी करें" button and a "WhatsApp पर ID सहेजें" (wa.me share) button |
| `/hamare-bare-mein` | हमारे बारे में | Intro, background, connection to the area, vision, priorities |
| `/prathmiktayen` | प्रमुख समस्याएं / प्राथमिकताएं | 10 category cards with icon and one-line Hindi text |
| `/sampark` | संपर्क करें | `tel:` and `wa.me` buttons, address, office hours |
| `/gopniyata-niti` | गोपनीयता नीति | Plain-Hindi privacy policy |
| `/sthiti-janen` *(Phase 3)* | शिकायत की स्थिति | Lookup by ID plus the last 4 digits of the mobile number |

The routes use Latin transliteration for clean, shareable URLs. All visible text is Hindi. There is a sticky bottom bar on mobile with **"अपनी समस्या बताएं"** and a WhatsApp icon, visible on every page except the form.

## 2. Hindi user journey
WhatsApp link or QR poster → home page → taps **अपनी समस्या बताएं** → fills the form (about 1 minute) → optionally adds a photo → taps **समस्या भेजें** → button shows "भेजा जा रहा है…" → success page with the ID → representative gets a WhatsApp message → staff update **स्थिति** in the Sheet.

**QR posters** with the URL in villages and at panchayat bhawans will likely be the #1 traffic source. Plan for them.

## 3. Complaint submission flow
```
Browser (RHF + Zod)
  ├─ compress photo client-side (≤1600px, JPEG q0.7 → ~200–500 KB)
  └─ POST multipart → /api/complaints (Route Handler, Node runtime)
        1. Turnstile verify + honeypot + rate limit (Upstash)
        2. Idempotency check (Upstash SETNX on client UUID, 10 min)
        3. Zod re-validate (same schema as client)
        4. Photo → validate magic bytes + size → Vercel Blob → URL
        5. Sheets append → get row → write ID  ← SOURCE OF TRUTH
        6. respond 200 {id}  ──► user sees success
        7. after(): WhatsApp template send → write "भेजा गया"/"विफल" in Sheet
```
- **Order matters.** The complaint is "saved" once step 5 succeeds. WhatsApp runs in `after()` (Next.js 15+), so a slow or failing WhatsApp call never blocks or fails the user.
- **If Sheets itself fails**, the user sees a Hindi error plus a fallback button: **"WhatsApp से सीधे भेजें"**. This is a `wa.me` link with the complaint pre-filled as text, so nothing is lost even in the worst case.
- **Retry.** A Vercel Cron route (`/api/cron/retry-whatsapp`, protected by `CRON_SECRET`) re-sends rows where `WhatsApp स्थिति = विफल`. The Hobby plan allows a daily cron, which is fine.

## 4. Google Sheets integration (step by step)
**One-time setup**
1. Google Cloud Console → new project → enable **Google Sheets API**.
2. IAM → **Service Account** → Keys → create a JSON key. Download it and never commit it.
3. Create a Sheet with tab `शिकायतें`. Put the header row in row 1 (see §6). Freeze row 1.
4. **Share the Sheet** with the service account email (`xxx@project.iam.gserviceaccount.com`) as **Editor**. This is the step people forget.
5. Copy the Sheet ID from the URL (`/d/<SHEET_ID>/edit`).
6. Env vars: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` (store it with `\n` escapes and `.replace(/\\n/g, '\n')` at runtime), `GOOGLE_SHEET_ID`.

**Code (`lib/services/google-sheets.ts`, `import 'server-only'`)**
- Use `google-auth-library` `JWT` with scope `https://www.googleapis.com/auth/spreadsheets` plus plain `fetch` to the Sheets REST v4 API. The full `googleapis` package is too large.
- `appendComplaint(data)`:
  1. `POST values/शिकायतें!A:N:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS` with the ID cell empty.
  2. The response's `updates.updatedRange` (e.g. `शिकायतें!A43:N43`) gives row 43, so the ID is `PS-2026-` + pad(43−1, 4) = `PS-2026-0042`. Append is atomic per row, so there are **no duplicate IDs** even under concurrent submits.
  3. `PUT values/शिकायतें!A43` with the ID.
- `updateWhatsAppStatus(row, status)` and `getFailedRows()` for the cron.
- Use `RAW` so that user input like `=HYPERLINK(...)` is **not** run as a formula. Also prefix values that start with `= + - @` with `'` as a second guard against CSV/formula injection.
- **Sheet usability.** Add a data-validation dropdown on the `स्थिति` column (लंबित / कार्य प्रगति पर / समाधान हो गया), conditional colours per status, and a filter view per category. The family can manage everything from the Google Sheets phone app.
- **Limits.** The Sheets API quota is about 60 writes per minute per user. That is far beyond what a Panchayat Samiti will need.

## 5. Image upload (recommended approach)
**Storage: Vercel Blob.** It is native to Vercel and needs one env var (`BLOB_READ_WRITE_TOKEN`) and no Google Drive quota issues. Alternatives: Cloudinary (free tier, auto-resizing), or a Google **Shared Drive** if a Workspace account exists.

**Flow: compress in the browser, upload in the same submit request**
1. `<input type="file" accept="image/*" capture="environment">` opens the camera or gallery directly on phones.
2. In the browser, use `browser-image-compression` (or a canvas): max 1600px, JPEG, quality about 0.7. A 6 MB photo becomes about 300 KB. This also **strips EXIF/GPS**, which helps privacy.
3. Show a thumbnail preview with a **"फोटो हटाएं"** button. While compressing, show "फोटो तैयार हो रही है…".
4. Send the photo inside the same multipart POST. This avoids orphan uploads and gives one request and one failure point.
5. **Server-side validation:** size ≤ 2 MB after compression, MIME type in `image/jpeg|png|webp`, and **magic-byte check** with the `file-type` package (the browser-reported MIME type cannot be trusted). Rename to `complaints/2026/<uuid>.jpg` and never use the user's filename.
6. `put()` to Vercel Blob with `addRandomSuffix`, then save the URL in the `फोटो URL` column and send it as the WhatsApp template **image header**.
7. **Privacy.** Blob URLs are unguessable but public. If Vercel Blob private access is available on the account when building, use it and serve photos through a signed or auth route. Otherwise accept unguessable URLs for MVP and say so in the privacy policy.
8. **If the photo upload fails**, still save the complaint without the photo and note "फोटो अपलोड नहीं हुई" in the remarks. The photo is optional, so it must never block a complaint.

One photo is enough for MVP. Allowing up to 3 later is easy.

## 6. Data structure (Sheet `शिकायतें`)
| Col | Header | Example |
|---|---|---|
| A | शिकायत आईडी | PS-2026-0042 |
| B | प्राप्ति तिथि | 07/10/2026 14:32 (IST, set on the server) |
| C | नाम | |
| D | मोबाइल नंबर | 9876543210 (stored as text with a `'` prefix) |
| E | गांव | |
| F | ग्राम पंचायत | dropdown from config |
| G | श्रेणी | सड़क / पानी / … |
| H | विवरण | |
| I | स्थान | free text, plus an optional Google Maps link |
| J | फोटो URL | |
| K | स्थिति | लंबित (default) |
| L | टिप्पणी | staff notes |
| M | WhatsApp स्थिति | भेजा गया / विफल |
| N | अनुरोध कुंजी | idempotency UUID (hidden column) |

Add a second tab, `ग्राम पंचायतें`, holding the list of GPs in the Samiti, or keep the list in `config/site.ts`. A **dropdown** for ग्राम पंचायत gives far cleaner data than free text.

**Zod schema (`lib/validation/complaint.ts`, shared by client and server)**
- name 2–60 characters
- mobile `^[6-9]\d{9}$`, with `+91`, `0` and spaces stripped first
- village 2–60 characters
- GP must be in the enum
- category must be in the enum
- description 10–1000 characters
- location ≤ 200 characters
- consent `literal(true)`

All error messages are in Hindi, for example "कृपया सही 10 अंकों का मोबाइल नंबर लिखें".

## 7. WhatsApp integration
**`wa.me` vs Cloud API**
| | `wa.me` link | Business Cloud API |
|---|---|---|
| Who sends | The *user* manually, from their phone | *Your server*, automatically |
| Reliability | User may not press send | Guaranteed delivery receipt |
| Setup | None | Meta Business account, number, template approval |
| Cost | Free | Small per-message charge (utility template, India rates) |
| Use here | Contact buttons and fallback | **Primary notification** ✅ |

**Recommendation:** use the Cloud API for notifications and `wa.me` for the contact page and failure fallback.

**Setup**
1. Create a Meta Business account and an app at developers.facebook.com → add the **WhatsApp** product.
2. Use a **new SIM or number** that is *not* on the WhatsApp app (or migrate it). Register it in WhatsApp Manager.
3. Create a **System User** in Business Settings and generate a **permanent access token** (the 24-hour test token expires).
4. Create a **Utility template** `nai_jan_samasya` (language `hi`) and wait for approval:
   ```
   [Header: IMAGE (optional variant) or TEXT "नई जन समस्या प्राप्त हुई"]
   शिकायत आईडी: {{1}}
   नाम: {{2}}
   मोबाइल नंबर: {{3}}
   गांव / ग्राम पंचायत: {{4}}
   श्रेणी: {{5}}
   समस्या का विवरण: {{6}}
   स्थान: {{7}}
   प्राप्ति तिथि: {{8}}
   ```
   Make two templates, one with an image header and one with a text header, and pick based on whether a photo exists.
5. **Flatten the parameters.** Replace newlines with ` | `, collapse runs of spaces, and truncate the description to about 900 characters plus "… (पूरा विवरण शीट में देखें)".
6. Send: `POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages` with `Authorization: Bearer ${WHATSAPP_TOKEN}` and `type: "template"`. Code lives in `lib/services/whatsapp.ts` (`server-only`). Use a 10-second timeout, and treat any non-2xx response as `विफल`.
7. `WHATSAPP_RECIPIENTS` is comma-separated, so a second team member can be added later.
8. **Optional:** send a confirmation template to the *resident* ("आपकी समस्या दर्ज हो गई है, आईडी: …"). This costs per message, so add it in Phase 2.

## 8. Security
- **Secrets** are only in server env vars. Service modules import `server-only`, so the build fails if they are bundled to the client. Nothing uses the `NEXT_PUBLIC_` prefix except the Turnstile site key.
- **Validation:** the same Zod schema runs on the server, and anything else in the request is rejected.
- **Spam:** a hidden honeypot field, **Cloudflare Turnstile** (free and mostly invisible, better than reCAPTCHA for low-end phones), and a minimum time-to-submit of 3 seconds.
- **Rate limit:** `@upstash/ratelimit` allows 5 submissions per hour per IP and 3 per day per mobile number.
- **Duplicates:** the client generates a UUID on form mount, and the server does `SETNX idem:<uuid>`. A replay returns the same ID. The submit button is disabled while the request is in flight.
- **Files:** magic-byte check, size cap, re-encoding, server-generated name, and no SVG.
- **Formula injection** is handled by `RAW` writes plus the prefix guard.
- **Headers:** CSP, `X-Content-Type-Options` and `Referrer-Policy` via `next.config` headers.
- **Cron route** requires `Authorization: Bearer ${CRON_SECRET}`.
- **Logs:** no PII in logs. Log only the complaint ID and error codes.

## 9. Hindi UI/UX
- **Font:** `next/font/google` with `Noto_Sans_Devanagari` (subsets `devanagari` and `latin`, weights 400/600/700, `display: swap`). Base text 18px, form inputs ≥ 18px (16px+ also prevents iOS zoom), line-height 1.7, because Devanagari needs room for its matras.
- **Touch targets** are ≥ 48px. The primary button is full width and 56px tall, in a high-contrast saffron/green palette. Avoid party colours unless the family wants them.
- **Form UX:**
  - Labels sit above the fields, never placeholder-only.
  - `inputMode="numeric"` for mobile.
  - Category is a **tappable icon grid**, not a `<select>`.
  - GP is a native `<select>`.
  - Errors appear inline below each field, and the page scrolls to the first error.
  - Add a "📍 मेरी लोकेशन जोड़ें" button (Geolocation → Maps link). It is optional.
- **Accessibility:** `<html lang="hi">`, real `<label>` elements, `aria-describedby` for errors, focus rings, and WCAG AA contrast.
- **Content in `content/hi/*.ts`.** `site.ts` (name, area, phone), `home.ts`, `about.ts`, `categories.ts`, `form.ts` (labels and errors) and `privacy.ts` are all typed. Adding `content/en/` later only needs a `getContent(locale)` switch, with no component changes.
- **Animations:** none beyond a button spinner. Respect `prefers-reduced-motion`.

## 10. Project architecture
```
panchayat-samiti/
├─ app/
│  ├─ layout.tsx               # font, <html lang="hi">, header/footer, sticky CTA
│  ├─ page.tsx                 # मुख्य पृष्ठ (Server Component)
│  ├─ samasya-batayen/page.tsx # Server shell + <ComplaintForm/> (client)
│  ├─ safal/page.tsx
│  ├─ hamare-bare-mein/ prathmiktayen/ sampark/ gopniyata-niti/
│  ├─ api/complaints/route.ts  # POST handler
│  ├─ api/cron/retry-whatsapp/route.ts
│  ├─ sitemap.ts  robots.ts  opengraph-image.tsx  not-found.tsx
├─ components/
│  ├─ ui/          # Button, Field, Card, CategoryTile
│  ├─ layout/      # Header, Footer, StickyCTA
│  └─ form/        # ComplaintForm, PhotoPicker, CategoryPicker
├─ content/hi/     # all Hindi copy
├─ config/         # site.ts (GP list, categories, contact), env.ts (Zod-validated env)
├─ lib/
│  ├─ validation/complaint.ts
│  ├─ services/  google-sheets.ts  whatsapp.ts  blob.ts  turnstile.ts  ratelimit.ts
│  ├─ complaints/submit.ts     # orchestration (steps 1–7), testable
│  └─ utils/  id.ts  date.ts  sanitize.ts  image-compress.ts (client)
├─ types/
└─ public/  candidate.jpg  icons/
```
Every page except the form is a static Server Component (SSG), so the client ships almost no JS. Only the form is a client component.

## 11. Environment variables
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEET_ID=
WHATSAPP_TOKEN=                # permanent system-user token
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TEMPLATE_TEXT=nai_jan_samasya
WHATSAPP_TEMPLATE_IMAGE=nai_jan_samasya_photo
WHATSAPP_RECIPIENTS=91XXXXXXXXXX
BLOB_READ_WRITE_TOKEN=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
CRON_SECRET=
COMPLAINT_ID_PREFIX=PS-2026
NEXT_PUBLIC_SITE_URL=
```
`config/env.ts` validates all of these with Zod at boot, so a missing variable is a clear build error.

## 12. Deployment
- GitHub repo → Vercel (Hobby is enough) → set env vars in Production and Preview.
- Buy a short `.in` domain (easy to print on posters), then Vercel DNS and automatic HTTPS.
- Create the Blob store from the Vercel dashboard, and the Upstash database from the Vercel Marketplace (env vars are injected automatically).
- Add `vercel.json` with the cron entry for retries.
- Set up Vercel Analytics (privacy-friendly) and Search Console with the sitemap.
- **SEO:**
  - Hindi `metadata` and title template `%s | <नाम> – <पंचायत समिति>`.
  - OG image showing the photo and name, for WhatsApp share previews.
  - `Person`/`GovernmentOrganization`-style JSON-LD.
  - Mention the Samiti, tehsil and district names in the copy for local search.

## 13. Future scalability
- **Status lookup page** reads the Sheet by ID plus the mobile number's last 4 digits.
- **Resident WhatsApp notification** when staff change the status. An Apps Script `onEdit` trigger can call a protected webhook.
- **Bilingual:** add `content/en` and a `[locale]` segment.
- **More data:** move from Sheets to Postgres (Neon/Supabase) behind the same `ComplaintRepository` interface. `lib/complaints/submit.ts` depends on the interface, not on Sheets directly.
- **Simple admin view** behind auth, if the Sheet becomes painful (probably around 2,000+ complaints).
- Multiple photos, voice note upload (useful for low-literacy users), and an SMS fallback.

---

## MVP build order
**Step 1: static site.** Scaffold Next.js 15+ with TS and Tailwind. Set up the font, content files, layout, sticky CTA and all 6 pages with real Hindi copy, plus the form UI with RHF + Zod and client compression, using a mocked submit. *This gives something the family can review on a phone on day 1.*

**Step 2: storage.** Google Sheet setup, `/api/complaints`, ID generation, Vercel Blob photo upload, success page and the wa.me fallback. *After this the site is usable. Complaints land in the Sheet even before WhatsApp is ready.*

**Step 3: WhatsApp and hardening.** Meta setup and template approval (start this **on day 1** in parallel, because approval and business verification take days). Then the `after()` WhatsApp send, the retry cron, Turnstile, Upstash rate limit and idempotency, SEO, OG image and deploy.

**Inputs needed from the family before building:**
- candidate name and photo
- Panchayat Samiti, tehsil and district name
- list of ग्राम पंचायतें
- mobile and WhatsApp numbers, address
- intro, vision and priorities text
- a dedicated number for the WhatsApp API

## Verification
- `npm run build` passes, and Lighthouse mobile scores ≥ 90 on all metrics.
- Manual test on a real Android phone over a throttled 3G profile: submit with a photo, and check that the row appears in the Sheet with the correct ID, the photo URL opens, and the WhatsApp message arrives.
- Fire 2 parallel submits and confirm they get distinct IDs. Double-tap submit and confirm it creates one row.
- Use an invalid WhatsApp token and confirm the complaint is still saved, marked `विफल`, and that the cron re-sends it once the token is fixed.
- Upload a renamed `.exe` as `.jpg` and confirm it is rejected. Upload a 10 MB photo and confirm it is compressed and accepted.
- Grep the client bundle (`.next/static`) for the secret names and confirm there are no hits.

## After approval (first action)
Create `/Users/rahul/personal/panchayat-samiti/` and write this plan there as `PLAN.md`. No code until the plan is confirmed.
