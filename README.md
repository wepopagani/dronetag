# DroneTag

Professional identification card management system with QR code support. Admins create and publish digital operator profiles; visitors open a public URL or scan a QR code to view verified identity, company, and insurance details.

## Tech stack

- **Framework:** [Next.js](https://nextjs.org/) 14+ (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Backend:** [Firebase](https://firebase.google.com/) — Authentication (email/password), Cloud Firestore, Cloud Storage
- **Language:** TypeScript, React 19

## Prerequisites

- **Node.js** 18 or newer
- **npm** (or compatible package manager)
- A **Firebase** project with Auth, Firestore, and Storage configured

## Setup

1. **Clone the repository and install dependencies**

   ```bash
   git clone <your-repo-url>
   cd "Drone Tag"
   npm install
   ```

2. **Create a Firebase project** in the [Firebase Console](https://console.firebase.google.com/).

3. **Enable Authentication** — sign-in method: **Email/Password**.

4. **Create a Firestore database** (start in production or test mode; adjust [security rules](https://firebase.google.com/docs/firestore/security/get-started) before going live).

5. **Enable Cloud Storage** for media uploads (photos, logos, banners, PDFs).

6. **Environment variables** — copy the example file and fill in your Firebase web app config:

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` with values from **Project settings → Your apps → Firebase SDK snippet**.

7. **Create an admin user** in **Authentication → Users** (or use “Add user” in the console). Use this account to sign in at `/login`.

8. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
Drone Tag/
├── public/                 # Static assets
├── src/
│   ├── app/                # App Router routes & layouts
│   │   ├── admin/          # Protected admin dashboard & profile CRUD
│   │   ├── login/          # Admin sign-in
│   │   ├── u/[slug]/       # Public profile by slug
│   │   ├── layout.tsx
│   │   ├── page.tsx        # Marketing home
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/         # Navbar, etc.
│   │   ├── profile/        # Profile form & public card
│   │   └── ui/             # Reusable UI (Button, Card, Input, …)
│   ├── contexts/           # Auth & language providers
│   └── lib/
│       ├── firebase/       # Auth, Firestore, Storage helpers
│       ├── hooks/
│       ├── i18n/           # Translation strings (en, it, de, es, fr)
│       ├── types/          # Shared TypeScript types
│       ├── seed.ts         # Optional Firestore demo seed
│       └── utils/
├── .env.local.example      # Template for Firebase env vars
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Available scripts

| Command                              | Description                                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `npm run dev`                        | Start Next.js in development mode                                                                            |
| `npm run build`                      | Production build (refuses to build if Firebase env vars are missing — see V-036)                              |
| `npm run start`                      | Start production server (after build)                                                                        |
| `npm run lint`                       | Run ESLint                                                                                                   |
| `npm run grant-admin -- <email>`     | PR-SEC-2: grant the `admin` custom claim to an existing Firebase Auth user. Append `--revoke` to take it away. |
| `npm run backfill-public`            | PR-SEC-1: populate `dronesPublic/{slug}` snapshots for every public-active drone.                              |

## Security setup (PR-SEC-1 / PR-SEC-2)

This repo enforces several server-side controls that must be configured before deploying:

1. **Service account** — copy a Firebase Admin service-account JSON into
   `FIREBASE_SERVICE_ACCOUNT_KEY` in `.env.local` (single-line). The
   proxy (`src/proxy.ts`) and `/api/session` use it to verify ID tokens
   server-side; `npm run grant-admin` uses it to set custom claims.
2. **App Check** — register a reCAPTCHA Enterprise (preferred) or
   reCAPTCHA v3 site key in the Firebase Console and put it into
   `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` (or
   `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`). Start enforcement in **monitor
   mode** — flip `APP_CHECK_ENFORCE=true` once the App Check dashboard
   shows clean traffic.
3. **Cloud Functions** — deploy from the `functions/` workspace:
   ```bash
   cd functions && npm install && npm run build
   firebase deploy --only functions
   ```
   The functions own the privileged create paths (V-004) and the
   anonymous report submission (V-005/V-006).
4. **Firestore rules + indexes + storage rules**:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage:rules
   ```
5. **Backfill** the public collection after deploy:
   ```bash
   npm run backfill-public
   ```
6. **Promote admins** with `npm run grant-admin -- <email>`. The
   client-side email allowlist has been removed; admin status comes
   exclusively from the Firebase custom claim `admin == true`.

### Content-Security-Policy: monitor → enforce (PR-SEC-3)

The `next.config.ts` `headers()` block emits a CSP and the standard
secure-headers set (HSTS, X-Frame-Options, X-Content-Type-Options,
Referrer-Policy, Permissions-Policy). The CSP ships in **Report-Only**
mode by default (`Content-Security-Policy-Report-Only` header) so
violations are logged in the browser console but nothing is blocked.

To enforce:

1. Deploy and use the app for at least a few days under realistic
   traffic. Watch the browser DevTools console + your error reporter
   for `Refused to ...` messages.
2. If you see violations from a legitimate origin (e.g. a CDN), add
   it to `NEXT_PUBLIC_TRUSTED_PDF_HOSTS` (CSV) and redeploy.
3. Once the console is clean, set `CSP_ENFORCE=true` in the build
   environment and rebuild. The header name flips from
   `Content-Security-Policy-Report-Only` to
   `Content-Security-Policy` and violations now block.

If a legitimate flow breaks after enforcing, set `CSP_ENFORCE=false`
again, fix the directive (or add the missing host), and re-enforce.

### URL host allowlist for user uploads (PR-SEC-3)

Pasted PDF/image URLs in the dashboard forms (insurance policy,
certificate, document) and on the Cloud Functions side are now
restricted to:

- `firebasestorage.googleapis.com`
- `storage.googleapis.com`
- Anything in `NEXT_PUBLIC_TRUSTED_PDF_HOSTS` (and `TRUSTED_PDF_HOSTS`
  for the function-side mirror).

Both lists must contain hostnames only (no scheme, no path). Keep them
in sync — the client refuses to send a value that the server would
reject anyway, but defence-in-depth requires both sides to agree.

### Seeding demo data

`src/lib/seed.ts` exports `seedDemoProfile()`, which inserts a sample published profile via `createProfile`. Import it from a trusted context (e.g. a one-off script with [`tsx`](https://github.com/privatenumber/tsx) and `--env-file=.env.local`) after ensuring your Firestore rules allow the write (often as an authenticated admin). It logs the new document ID and slug to the console.

## Features

- Multilingual UI (English, Italian, German, Spanish, French) via `LanguageContext`
- Admin dashboard: list, search, create, edit, and delete profiles
- Public profile pages with operator details, company block, insurance section, and QR display
- Firebase Storage integration for images and policy PDFs
- Publish / unpublish profiles for public visibility

## Roadmap

- **NFC integration** — bind physical NFC tags to profile slugs or IDs
- **Multi-tenant** — organizations, roles, and scoped data
- **API access** — programmatic profile read/update for integrations

## License

MIT
