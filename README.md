# Shayan — Full-Stack Web Developer Portfolio

A modern, premium personal portfolio website for a professional Full-Stack Web
Developer. Minimal, elegant and developer-focused — inspired by the visual
language of classic one-page portfolio templates, rebuilt from scratch with the
modern Next.js stack.

The **“My Works”** section is fully database-driven and managed from a secure
**Admin Panel** — add a project once and it appears on the portfolio instantly,
no code changes or redeploys needed.

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **MongoDB Atlas** + the official **MongoDB Node.js driver** (public section + admin panel data)
- **Framer Motion** — scroll reveals, hero entrance, filter transitions
- **Lucide React** + **simple-icons** — icons
- **Canvas particles** — lightweight connected-dot network behind the hero
- Custom, dependency-free **admin auth** — scrypt-hashed password + HMAC-signed
  HttpOnly session cookie, validated on every admin page/API server-side

## Getting Started

```bash
npm install
npm run dev        # http://localhost:3000
```

### 1. Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable              | Purpose                                                            |
| --------------------- | ------------------------------------------------------------------ |
| `MONGODB_URI`         | MongoDB Atlas connection string (see Atlas below)                  |
| `AUTH_SECRET`         | ≥ 32 random characters; signs the admin session cookie             |
| `ADMIN_EMAIL`         | Email used to log in to `/admin`                                   |
| `ADMIN_PASSWORD_HASH` | scrypt hash of the admin password (never the plain password)       |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token — enables persistent image uploads in production |

Generate values:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # AUTH_SECRET
npm run hash:password -- "YourStrongPassword"                             # ADMIN_PASSWORD_HASH
```

### 2. Create the MongoDB Atlas cluster

Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas),
add a database user, allow your network (or `0.0.0.0/0` for Vercel), then copy
the connection string from **Cluster → Connect → Drivers** and set it as `MONGODB_URI`:

```
mongodb+srv://<user>:<password>@<cluster>.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority
```

The URI is read **server-side only** (`process.env.MONGODB_URI`) — it is never
exposed to the browser and must not be prefixed with `NEXT_PUBLIC_`.

### 3. Seed

```bash
npm run db:seed      # imports the default projects from data/projects.ts
```

The seed is idempotent and restores the default project set on re-run. After
seeding, “My Works” looks exactly as it did before.

## Admin Panel

| Route                     | Purpose                                        |
| ------------------------- | ---------------------------------------------- |
| `/admin/login`            | Login (email + password)                       |
| `/admin/dashboard`        | Stats + recent projects                        |
| `/admin/projects`         | Manage all projects (search, filter, publish, featured, delete) |
| `/admin/projects/new`     | Create a project (draft or published)          |
| `/admin/projects/:id/edit`| Edit a project                                 |
| `/admin/settings`         | Configuration status + setup guide             |

Every `/admin/*` route and API re-validates the signed session cookie
server-side (`lib/auth.ts`); nothing is trusted from the client. Passwords are
verified with scrypt and only their hashes are stored. Unauthenticated visitors
are redirected to `/admin/login` and API calls get `401`.

## How a project goes live

1. Build a project → push to GitHub → deploy to Vercel.
2. Open **`/admin`** → **Add Project**.
3. Enter title/description, GitHub URL, live demo URL, technologies, category
   and an image (attach a file from your device, pick a bundled placeholder, or
   paste any http(s) URL — only the URL is stored in MongoDB, never the binary).
4. Toggle **Published** → save.

The project appears in “My Works” immediately, sorted by **Display order**.
Drafts stay hidden until published. Empty GitHub/live URLs hide the
corresponding buttons instead of producing broken links.

## Architecture

```
app/
  page.tsx                          # public portfolio (static shell)
  api/projects/route.ts             # public read-only: published projects
  api/admin/login | logout          # session create/destroy
  api/admin/projects/…              # admin CRUD (server-side auth)
  admin/login                       # login page (outside the guard)
  admin/(panel)/                    # guarded area: layout + dashboard/
                                    # projects/ projects/new/ [id]/edit/ settings/
components/
  … public sections (unchanged design)
  admin/                            # AdminSidebar, ProjectTable, ProjectForm, …
data/
  projects.ts                       # seed source + category list (not rendered)
  image-presets.ts                  # bundled placeholder images for the admin form
lib/
  mongodb.ts                        # lazy, cached MongoDB client (env-guarded)
  auth.ts                           # scrypt verify + signed session cookie + guards
  validation.ts                     # server-side project payload validation
  projects-data.ts                  # data access used by APIs + admin pages
scripts/
  seed-mongodb.ts                   # imports the default projects into Atlas
```

Key points

- **Public design untouched.** The Works section fetches published projects
  from `/api/projects` and shows skeleton / empty / error states. Card layout,
  filters, hover animations and typography are identical.
- **Graceful without a database.** No `MONGODB_URI` → the public section shows
  its empty state and the admin panel shows a “Database not configured” notice
  instead of crashing. The site builds without a database.
- **Works on serverless.** The MongoDB client is a lazy singleton, cached on
  `globalThis` (`lib/mongodb.ts`), so warm Vercel functions reuse one
  connection pool. DB reads happen in request-time APIs/pages — the homepage
  itself stays fully static.
- **Images.** Database stores only the image URL/path. Project images can be
  attached from the admin's device (uploads to **Vercel Blob** when
  `BLOB_READ_WRITE_TOKEN` is set; dev-only `public/uploads/` fallback without
  it, which is gitignored), a bundled placeholder, or any pasted http(s) URL.
  `next.config.ts` allows any `https` host so remote images (Vercel Blob, S3,
  GitHub raw, …) render optimized.

## Deploying to Vercel

1. Push to GitHub, import the repo in Vercel.
2. Add the environment variables above (`MONGODB_URI` — use the same Atlas
   string; Atlas works out of the box with serverless drivers).
3. Deploy — the build needs no database at build time. Seed once from your
   machine (`npm run db:seed`) or manage projects from the admin panel.

## Local scripts

```bash
npm run dev             # dev server
npm run build           # production build
npm run lint            # eslint
npm run db:seed         # import default projects into MongoDB
npm run hash:password   # generate an ADMIN_PASSWORD_HASH
node scripts/generate-images.mjs   # regenerate placeholder images
```

## Notes

- The **contact form** is UI-complete with validation and loading/success/error
  states; it simulates submission — wire it to an email service to go live.
- **CV download** points to `public/cv/Shayan-CV.pdf` — replace with your own.
- All social/profile links live in `data/site.ts` — update them with your URLs.
- Placeholder images are procedurally generated (`scripts/generate-images.mjs`)
  and live in `public/images/` — drop your real images over them anytime.
