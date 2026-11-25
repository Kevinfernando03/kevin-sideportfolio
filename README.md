# Kevin side portfolio

Personal portfolio site for **KevinJR**, built with Next.js 15 and React 19.

- Full-screen wordmark hero with interactive WebGL devices that turn to follow the pointer
- Pinned showreel section and a project grid with colour-wipe hover cards
- Smooth scrolling (Lenis)
- Built-in backend: password-protected admin panel, contact form with inbox, JSON storage

## Getting started

```bash
npm install
cp .env.example .env.local   # set ADMIN_PASSWORD and SESSION_SECRET
npm run dev                  # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

Media (device sprite sheets and the showreel) isn't stored in the repo. See
[`public/media/README.md`](public/media/README.md) for what to add.

## Pages

| URL | Purpose | Code |
| --- | --- | --- |
| `/` | Home: hero, showreel, about, projects, footer | `src/app/page.tsx`, `src/components/site/` |
| `/contact` | Contact form; messages land in the admin inbox | `src/app/contact/`, `src/components/site/ContactPage.tsx` |
| `/admin` | Edit profile, projects and socials; read messages | `src/app/admin/`, `src/components/admin/` |

## API

| Endpoint | Access | Purpose |
| --- | --- | --- |
| `GET /api/content` | public | Site content as JSON |
| `POST /api/contact` | public, 5 per 10 min per IP | Store a contact message |
| `POST /api/admin/login` | password, 5 tries per 15 min | Start an 8-hour admin session |
| `POST /api/admin/logout` | – | End the session |
| `GET` / `PUT /api/admin/content` | admin | Read / replace site content |
| `GET` / `DELETE /api/admin/messages` | admin | List / delete messages |

## Configuration

All settings live in `.env.local` (see `.env.example`):

| Variable | Required | Description |
| --- | --- | --- |
| `ADMIN_PASSWORD` | yes | Password for `/admin` |
| `SESSION_SECRET` | yes | 32+ random characters; signs the session cookie |
| `DATA_DIR` | no | Where `content.json` and `messages.json` are stored (default `./data`) |

## How it works

- **Content:** stored in `data/content.json`. Until the first save from `/admin`, the
  defaults in `src/components/site/content.ts` are used. Pages render on each request, so
  changes show up on the next reload.
- **Auth:** a single owner password. Sessions are HMAC-signed, httpOnly, SameSite=Strict
  cookies (Secure in production).
- **Validation:** every input goes through `src/server/validate.ts`. Links must be https,
  mailto or same-site paths. Write requests must come from the site's own origin. The
  contact form has a honeypot field and a rate limit.
- **Devices:** each device is a sprite sheet of camera angles. `DeviceRenderer.ts` picks the
  angle from the pointer position and blends neighbouring frames using motion-vector maps.
  The screens show the showreel (hero) or each project's screen images (set in `/admin`).

## Deploying

Storage is file-based, so use a host with a persistent disk (a VPS, Railway, Render, Fly.io…)
and set the variables from `.env.example` there.
