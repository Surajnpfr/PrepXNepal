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
