# PrepX Nepal

Nepal CEE prep app with **Clerk as the only user source of truth**.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Configure `.env.local`:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY` (server-only; used by the Clerk sync API)
   - optional `GEMINI_API_KEY`
   - optional Hostinger MySQL (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) — otherwise local SQLite is used
3. Start web + API together:
   `npm run dev`
   - Web: http://localhost:3000
   - API: http://localhost:3001 (`/api/users`, `/api/questions`, `/api/questions/import`, `/api/questions/stats`)

## Questions database

- Domain validation lives in `server/questionsDomain.ts`.
- Hostinger: run `sql/questions.mysql.sql` in phpMyAdmin, then set MySQL env vars.
- Local: SQLite file `data/prepx-questions.sqlite` (auto-created).
- Seed sample bank: `npm run db:seed`
- Admin → Import writes to the DB; Questions tab shows a subject pie chart from `/api/questions/stats`.

## Clerk sync

- Signed-in profile comes from Clerk (`useUser`) in real time.
- Staff Admin roster is loaded from Clerk Backend API and polled every 5s.
- Plan / role / coins / mock quota live in Clerk `publicMetadata` (written via the API).
- There is no mock/seed user list and no guest “switch mock user” impersonation.

## Production Sign-In checklist (coffeehubnepal.com)

Sign-in fails when `clerk-js` cannot load from the Frontend API host encoded in `VITE_CLERK_PUBLISHABLE_KEY`.

1. In Clerk Dashboard → **Configure → Domains**, ensure `https://coffeehubnepal.com` (and `www` if used) is allowed.
2. If you use a **custom Clerk domain** (e.g. `clerk.learn.hamroniti.com`), its DNS **CNAME must resolve** to Clerk. A broken/timeout DNS means Sign In does nothing.
3. Prefer rebuilding with a working instance key (`*.clerk.accounts.dev` or a healthy custom domain) and matching `CLERK_SECRET_KEY`.
4. Set `CLERK_AUTHORIZED_PARTIES=https://coffeehubnepal.com` on the server.
5. Rebuild/redeploy after changing `VITE_*` keys (they are baked into the Vite bundle).
6. After deploy, open DevTools → Network and confirm `clerk.browser.js` returns **200** (not failed/DNS error).

## Email restrictions (no temporary mail)

**Best place (Clerk):** Dashboard → **Protect → Rules** → enable:
- **Block sign-ups that use disposable email addresses**
- **Block email subaddresses** (optional; blocks `user+tag@gmail.com`)

On API boot, PrepX also calls Clerk `updateRestrictions` to turn those on when the secret key allows it.

**Server defense:** `requireAuth` rejects sessions whose email domain is disposable (`EMAIL_BLOCK_DISPOSABLE=true` by default). Optional:
- `EMAIL_ALLOWED_DOMAINS=gmail.com,yahoo.com,...` — if set, **only** those domains may use the API
- `EMAIL_BLOCKED_DOMAINS=...` — extra domains to reject

Do **not** enable a tight allowlist unless you only want specific providers — Nepal students use many legitimate domains.
