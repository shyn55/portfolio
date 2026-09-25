# Run doc — Shayan Portfolio (Next.js 16 + MongoDB Atlas)

## 1. Reproduce the artifacts (fresh checkout)

```bash
npm install
```

Environment: copy `.env` from the main checkout (`C:\Users\Eco-PC\Desktop\portfolio-buf\.env`).
It is gitignored and contains real values — NEVER commit it or paste values into the run doc.

Required keys in `.env`:
- `MONGODB_URI` — MongoDB Atlas connection string (`mongodb+srv://…`), server-side only
- `AUTH_SECRET` — random string for signing admin session cookies
- `ADMIN_EMAIL` — admin login email
- `ADMIN_PASSWORD_HASH` — generate with `npm run hash:password -- "NewPassword"`
  (format `scrypt:params:salt:hash` — never plain text, and avoid `$` characters
  because dotenv mangles them)
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob token for project-image uploads. WITHOUT it
  the upload endpoint falls back to writing `public/uploads/` (dev only, gitignored;
  does not persist on Vercel).

Database (only if the collection is empty or the default set changed):
```bash
npm run db:seed     # seeds the default portfolio projects into Atlas (idempotent, by slug)
```

## 2. Run the dev server

Default port is 3000, but the Freebuff environment injects `PORT=0` (random port), so pin
it explicitly with `-p 3000`. Start DETACHED via PowerShell (stdout and stderr must go to
DIFFERENT files):

```powershell
powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev','--','-p','3000' -RedirectStandardOutput 'C:\Users\Eco-PC\Desktop\portfolio-buf\.freebuff\preview.log' -RedirectStandardError 'C:\Users\Eco-PC\Desktop\portfolio-buf\.freebuff\preview.log.err' -WindowStyle Hidden -PassThru).Id"
```

Then verify: `Get-Process -Id <pid>` is alive, `curl http://localhost:3000/` answers 200,
and `curl http://localhost:3000/api/projects` returns the seeded projects (proves Atlas works).

Gotchas:
- The Start-Process tool call may time out client-side even though the server starts —
  verify with `Get-Process` / `netstat` instead of retrying (retrying spawns duplicate servers).
- Port 3000 may be occupied by another thread's server; if so pick a free port and pass
  `-p <port>` instead.

Admin panel: `/admin` (login `/admin/login`) — credentials live in `.env`
(`ADMIN_EMAIL` / password that produced `ADMIN_PASSWORD_HASH`).
