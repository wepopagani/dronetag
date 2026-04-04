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

| Command        | Description                          |
| -------------- | ------------------------------------ |
| `npm run dev`  | Start Next.js in development mode    |
| `npm run build`| Production build                     |
| `npm run start`| Start production server (after build)  |
| `npm run lint` | Run ESLint                           |

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
