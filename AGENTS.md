# CodeNusa — Base44 Dev Environment

## Stack
- Vite 6 + React 19 + TypeScript, Tailwind CSS v4 (via `@tailwindcss/vite`).
- Firebase (Auth, Firestore, Storage). Web config is embedded in `firebase-applet-config.json` — these are **public** values, not secrets. The app connects to a remote Firebase project at runtime and gracefully falls back to `localStorage` when Firestore is unreachable.
- `@google/genai` is a dependency but is **not imported anywhere** in `src/`; `GEMINI_API_KEY` is referenced only in `.env.example` and is not needed to boot.

## Running
- `docker compose -f docker-compose.base44.yml up -d` — starts the Vite dev server on host port 3000.
- The compose service runs `npm install && npm run dev` (the `dev` script is `vite --port=3000 --host=0.0.0.0`). `node_modules` lives in a named volume so installs persist across restarts.
- Live reload: `CHOKIDAR_USEPOLLING=true` is set so bind-mount file watching works reliably. HMR is enabled by default (disabled only when `DISABLE_HMR=true`).

## Vite config note
- `vite.config.ts` sets `server.host: true` and `server.allowedHosts: true` so the preview's external hostname is accepted (Vite 6 blocks unknown hosts otherwise).

## Auth
- Seeded accounts (admin/teacher) use SHA-256 password hashes stored in `localStorage` (`codenusa_auth_registry_v1`). Login falls back to hash comparison when Firebase Auth is unavailable. New student registration creates a Firebase Auth account and a Firestore `users/{uid}` doc.
- The app redirects unauthenticated users to `/login`.

## Verification
- `curl -sf -H "Host: external-preview.example.com" http://localhost:3000/` must return the app HTML (the `index.html` with `/src/main.tsx`).
- `docker compose -f docker-compose.base44.yml logs web` shows Vite dev-server compilation output.
