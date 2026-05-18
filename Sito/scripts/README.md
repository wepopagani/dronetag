# Scripts

All scripts read configuration from `.env.local`. Never commit credentials.

```bash
npx tsx --env-file=.env.local scripts/<script>.ts [...args]
```

Convenience npm scripts:

```bash
npm run grant-admin -- <email> [--revoke]      # PR-SEC-2 V-028
npm run backfill-public                         # PR-SEC-1
```

## Required env vars

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Required for grant-admin and the proxy (admin route gate)
FIREBASE_SERVICE_ACCOUNT_KEY=<json on one line>

# Required for scripts that authenticate as an existing admin user
SEED_AUTH_EMAIL=
SEED_AUTH_PASSWORD=
```

## Granting admin access (PR-SEC-2)

The previous `scripts/create-admin.ts` was deleted because it shipped a
hardcoded password (V-027). Admin status now comes from the Firebase
custom claim `admin == true`, set via the Admin SDK.

```bash
npm run grant-admin -- alice@example.com
npm run grant-admin -- alice@example.com --revoke
```

The script:

1. Loads the Firebase service-account JSON from `FIREBASE_SERVICE_ACCOUNT_KEY`.
2. Looks up the target user by email. Fails if no Firebase Auth user with that email exists.
3. Calls `setCustomUserClaims(uid, { ...existing, admin: true })` (or removes the `admin` key with `--revoke`).
4. Calls `revokeRefreshTokens(uid)` so any active session must mint a fresh ID token. The `AuthContext` periodic refresh (5 minutes) picks up the new claim automatically; users on long-running tabs do not need to sign out and back in.

## Available scripts

| Script | Purpose |
|---|---|
| `seed-minimal-profile.ts` | Create a small public legacy profile for `/u/<slug>` smoke tests. |
| `seed-multientity.ts` | Seed one demo user with the full multi-entity model (M1). |
| `migrate-profiles-to-entities.ts` | Idempotent migration of legacy `profiles/*` into the new collections (M1). |
| `backfill-drones-public.ts` | Populate `dronesPublic/{slug}` snapshots for existing public-active drones (PR-SEC-1). |
| `upload-qr.ts` | Upload a QR PNG and stamp it onto a legacy profile (env-driven). |
| `grant-admin.ts` | PR-SEC-2 — grant or revoke the `admin` custom claim on a user. |
