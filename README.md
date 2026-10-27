# ग्राम पंचायत जूनाखेड़ा — जन समस्या पोर्टल

A Hindi-first, mobile-first site where residents report local problems. Each complaint is saved to **Google Sheets** (with an ID like `JK-2026-0001`) and the representative is notified on **WhatsApp**. Full design rationale is in [`PLAN.md`](./PLAN.md).

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind v4 · React Hook Form + Zod · Google Sheets API · WhatsApp Cloud API · Vercel Blob · Upstash · Cloudflare Turnstile

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

**No credentials are needed to try it.** Without the Google vars, complaints are kept in memory and printed in the terminal (dev only). Every other integration is skipped when its env vars are missing.

| Integration | Missing env → behaviour |
|---|---|
| Google Sheets | dev: in-memory store · **production: submit fails and the user gets a WhatsApp fallback button** |
| WhatsApp API | complaint saved, Sheet column L = `WhatsApp सेट नहीं` |
| Vercel Blob | complaint saved without the photo, remark `फोटो स्टोरेज सेट नहीं है` |
| Upstash | no rate limit, no duplicate-submit protection |
| Turnstile | no captcha |

## Where to edit content

All user-facing Hindi text lives in `content/hi/`. Candidate, area, phone and the 6 villages are set in `content/hi/site.ts`. **Still TODO:** exact address (`site.address`). Also update `about.ts` and `home.ts` (`heroIntro`), and put the real photo at `public/` (update `site.photo`, e.g. `/candidate.jpg`).

## Submission flow

```
form (RHF+Zod, photo compressed in browser to ≤1600px JPEG)
  → POST /api/complaints (multipart)
      honeypot + min fill time → Turnstile → IP rate limit
      → Zod (same schema) → idempotency key → mobile rate limit
      → photo: size + magic-byte check → Vercel Blob   (failure ≠ lost complaint)
      → Google Sheets append → ID from row number     ← source of truth
  → 200 {id} → /safal?id=…
  → after(): WhatsApp template → Sheet column L = भेजा गया / विफल
Daily Vercel Cron → /api/cron/retry-whatsapp re-sends every "विफल" row
```

Code map: `lib/complaints/submit.ts` (orchestration) · `lib/services/*` (sheets, whatsapp, photo, turnstile, ratelimit) · `lib/validation/complaint.ts` (shared schema) · `components/form/*`.

---

## 1. Google Sheets setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com), create a project, open **APIs & Services → Library**, and enable **Google Sheets API**.
2. Go to **IAM & Admin → Service Accounts → Create**. No roles are needed. Then open **Keys → Add key → JSON** and download the file. **Never commit it.**
3. Create a **blank** Google Sheet ([sheets.new](https://sheets.new)) and name it, e.g. "जन समस्या – जूनाखेड़ा".
4. **Share** the Sheet with the service account's `client_email` as **Editor**. This is the step people forget.
5. Fill `.env.local`:
   - `GOOGLE_SHEET_ID`: the part of the Sheet URL between `/d/` and `/edit`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: `client_email` from the JSON
   - `GOOGLE_PRIVATE_KEY`: `private_key` from the JSON, on one line with the `\n` escapes, in double quotes
6. Run **`npm run sheet:setup`**. It renames the tab to `शिकायतें`, writes the header row (A→N), freezes it, adds the स्थिति dropdown with colours, hides the अनुरोध कुंजी column, and tints the public-note column N green. It is safe to re-run.

How IDs work: the server appends the row, reads the row number that Google returns (e.g. row 43), and writes `JK-2026-0042` into column A. Appends are atomic, so concurrent submits never share an ID. **Never delete rows**: a later complaint would then reuse an existing ID. To remove a duplicate, spam or test complaint from the website, set its स्थिति to **छुपाएं**. Change `COMPLAINT_ID_PREFIX` each year if you want a new series.

### Status tracking (`/samasya-sthiti`)

Staff manage progress from the Sheet; the public page updates within about a minute (new complaints appear immediately).

| स्थिति (column J) | On website | Use when |
|---|---|---|
| लंबित | ✅ (default) | Received, work not started |
| कार्य प्रगति पर | ✅ | Work has started |
| विभाग को भेजा गया | ✅ | Forwarded to a government department (bijli, PHED, PWD…) |
| पूर्ण | ✅ | Solved |
| छुपाएं | ❌ | Duplicate, spam, test or private complaint |

- **Column N "वेबसाइट पर टिप्पणी"** is shown on the issue's card as "📢 ताज़ा जानकारी" (e.g. "ठेकेदार को काम दिया, 15 नवंबर तक पूरा होगा"). Column K "टिप्पणी (आंतरिक)" stays private.
- The page shows only ID, date, village, category, description, status and the public note — never name, mobile, exact location or photo. Phone numbers inside descriptions/notes are masked automatically.
- Status options live in `content/hi/status.ts`; keep `scripts/setup-sheet.mjs` in sync and re-run `npm run sheet:setup` after changing them.

## 2. Photo upload: Vercel Blob

1. In the Vercel project, open **Storage → Create → Blob** and connect it to the project. `BLOB_READ_WRITE_TOKEN` is added automatically. For local testing, run `vercel env pull`.
2. That's all. The browser compresses photos (6 MB → ~300 KB, EXIF/GPS stripped), and the server checks size (≤2 MB) and the real file bytes (JPEG/PNG/WebP only), then stores the photo under `complaints/<year>/<uuid>-<random>.jpg`. User file names are never used.

Photos are stored with an unguessable public URL, because WhatsApp needs a fetchable link for the image header. Google Drive is not used: service accounts have no Drive quota unless you have a Workspace Shared Drive.

## 3. WhatsApp Business Cloud API

`wa.me` links only open the *user's* WhatsApp with pre-filled text (used for the contact buttons and the failure fallback). The Cloud API lets *the server* send automatically, so it is used for notifications.

1. Create a [Meta Business account](https://business.facebook.com), then go to [developers.facebook.com](https://developers.facebook.com) → **Create app (Business)** → add **WhatsApp**.
2. Add a **dedicated phone number** that is not active in the WhatsApp app, and verify it. Complete **Business verification** to lift test limits. This takes days, so start early.
3. Go to **Business Settings → System users**, create an admin system user, assign the app and the WhatsApp account, and generate a **permanent token** with `whatsapp_business_messaging`. This is `WHATSAPP_TOKEN`.
4. `WHATSAPP_PHONE_NUMBER_ID` is shown in **WhatsApp → API Setup**.
5. In **WhatsApp Manager → Message templates**, create two templates. Both use category **Utility** and language **Hindi (`hi`)**, with the same body:

   ```
   शिकायत आईडी: {{1}}
   नाम: {{2}}
   मोबाइल नंबर: {{3}}
   गांव: {{4}}
   श्रेणी: {{5}}
   समस्या का विवरण: {{6}}
   स्थान: {{7}}
   प्राप्ति तिथि: {{8}}
   ```
   - `nai_jan_samasya`: header **Text** `नई जन समस्या प्राप्त हुई`
   - `nai_jan_samasya_photo`: header **Image** (used when a photo exists)
6. Set `WHATSAPP_RECIPIENTS` to comma-separated numbers with the country code, e.g. `919876543210`. In test mode, these numbers must be added to the allowed list.

Template variables can't contain newlines, so the code flattens them (`\n` → ` | `) and truncates long descriptions with "… (पूरा विवरण शीट में देखें)".

## 4. Spam protection

- **Upstash Redis**: Vercel → Marketplace → Upstash → connect. Its `KV_REST_API_*` or `UPSTASH_REDIS_REST_*` vars are both supported. Limits: 5 submits/hour per IP, 3/day per mobile number, plus 10-minute idempotency keys.
- **Turnstile**: Cloudflare dashboard → Turnstile → add the site domain. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.

## 5. Deploy (Vercel)

1. Push to GitHub, then import it in Vercel.
2. Add every var from `.env.example` for Production. Generate `CRON_SECRET` with `openssl rand -hex 32`.
3. Set `NEXT_PUBLIC_SITE_URL` to the final domain. Add the domain in Vercel (a short `.in` domain is easy to print on posters).
4. `vercel.json` already schedules the WhatsApp retry cron daily at 04:00 UTC (09:30 IST).
5. Submit `/sitemap.xml` in Google Search Console.

## Launch checklist

- [ ] All "उदाहरण" placeholders replaced, real photo added
- [ ] Sheet shared with the service account, header row in place
- [ ] Both WhatsApp templates **approved**
- [ ] Test complaint from a real phone: the row appears, the photo opens, the WhatsApp message arrives
- [ ] Break `WHATSAPP_TOKEN` and submit: the row says `विफल`. Fix the token, hit the cron: it says `भेजा गया`
- [ ] Privacy page reviewed by the family
