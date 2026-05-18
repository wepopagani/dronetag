# DEPLOY_STAGING.md

Repeatable recipe to bring up (or refresh) the **DroneTag staging** environment.

Audience: a single ops person with admin on the Firebase staging project and
deploy rights on the chosen host (Vercel or Netlify). Estimated time end-to-end:
~25 minutes for a fresh project, ~5 minutes for a refresh.

> **Hard rule:** never reuse production secrets in staging. Each environment
> must have its own Firebase project, its own service-account key, and its own
> reCAPTCHA / App Check site keys. The mitigation strategy assumes blast radius
> stops at one environment.

---

## 0. One-time prerequisites

- Firebase project `dronetag-staging` created (or equivalent name).
- App registered (Web) → copy the SDK config snippet.
- Firestore enabled in **Native** mode (region: `eur3` or your closest
  multi-region).
- Storage bucket created (default; `*.appspot.com`).
- Cloud Functions enabled (requires Blaze plan even on staging because the
  trigger is Cloud Functions v1; a low budget alert is enough).
- App Check provider registered:
  - reCAPTCHA Enterprise site key for the staging host
    (recommended) **or**
  - reCAPTCHA v3 site key.
- Firebase CLI on the operator workstation: `npm i -g firebase-tools` (≥ 14.x).
- Node 20.x locally (matches `functions/package.json` engines).
- Service-account JSON downloaded once and stored in a secrets manager
  (1Password / Bitwarden / SOPS). **Never commit it.**

---

## 1. Required environment variables

| Variable | Where | Example | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | host + local `.env.local` | `AIzaSy…` | from Firebase web config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | host + local | `dronetag-staging.firebaseapp.com` | |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | host + local | `dronetag-staging` | |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | host + local | `dronetag-staging.appspot.com` | |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | host + local | `1234567890` | |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | host + local | `1:1234:web:abcdef` | |
| `NEXT_PUBLIC_APP_CHECK_SITE_KEY` | host + local | reCAPTCHA Enterprise key | client-visible by design |
| `APP_CHECK_ENFORCE` | host (server) | `true` | enforce at Cloud Function level |
| `CSP_ENFORCE` | host (server) | `false` initially | flip to `true` after report-only soak |
| `NEXT_PUBLIC_TRUSTED_PDF_HOSTS` | host | empty or `cdn.example.com` | comma list, optional |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | host (server) only | full JSON, one-line | required for `/proxy` admin gating and `/api/health` |
| `NEXT_PUBLIC_GIT_COMMIT_SHA` | host (build) | auto on Vercel | falls back to `VERCEL_GIT_COMMIT_SHA` |

Local `.env.local` should mirror `NEXT_PUBLIC_*` and `FIREBASE_SERVICE_ACCOUNT_KEY`
for development against staging.

---

## 2. Firebase deploy order

Always deploy in this order. Each step is idempotent.

```bash
# 0. Use the staging alias
firebase use dronetag-staging

# 1. Indexes (Firestore needs these BEFORE rules that filter on composite keys)
firebase deploy --only firestore:indexes

# 2. Rules (Firestore + Storage)
firebase deploy --only firestore:rules
firebase deploy --only storage:rules

# 3. Cloud Functions (callables + auth trigger)
#    Includes: submitReport, createDrone, createOperator,
#              createCertificate, createDocument, createInsurance,
#              bootstrapSlots
cd functions && npm install && npm run build && cd -
firebase deploy --only functions
```

Verify each step in the Firebase console before continuing. If rules deploy
fails, **do not** continue to functions — the new functions assume the new
rules.

---

## 3. App Check setup

1. Firebase console → App Check → register the web app with the chosen
   provider (Enterprise / v3).
2. Add the staging URL(s) to the allowed origins of the reCAPTCHA site key
   (Google reCAPTCHA admin or GCP console).
3. Enforce App Check on:
   - **Cloud Functions** → ON (matches `APP_CHECK_ENFORCE=true`).
   - **Cloud Firestore** → keep OFF on staging until clients are observed
     producing valid tokens for ≥ 24 h, otherwise legitimate dashboard
     traffic gets 403'd. Flip ON before promoting to production.
   - **Cloud Storage** → same staged approach as Firestore.

Quick health check from a logged-in browser (DevTools → Application → Cookies):
ensure `_GRECAPTCHA` is set. From the network tab, callable requests carry an
`X-Firebase-AppCheck` header.

---

## 4. CSP rollout flow

CSP ships in **Report-Only** first.

1. Deploy with `CSP_ENFORCE=false`. The page emits
   `Content-Security-Policy-Report-Only` and (optionally) reports go to
   `report-uri` if you've configured one.
2. Browse every primary surface as a real user for ≥ 48 h:
   - Public `/u/<slug>`
   - Login + signup
   - `/account/*` (every tab, including modals)
   - `/admin/*` (every tab)
3. Triage browser console warnings (`Refused to load…`). If a legitimate
   resource is blocked, add it to `next.config.ts`'s CSP allow-list and
   redeploy.
4. When the console is clean for 48 h, set `CSP_ENFORCE=true` and redeploy.

CSP is intentionally strict; PWA install banners, Firebase Storage previews,
and reCAPTCHA scripts are already whitelisted.

---

## 5. Host setup (Vercel)

```bash
# In the repo root
vercel link --project dronetag-staging
# Push all env vars
for v in NEXT_PUBLIC_FIREBASE_API_KEY NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
         NEXT_PUBLIC_FIREBASE_PROJECT_ID NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
         NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID NEXT_PUBLIC_FIREBASE_APP_ID \
         NEXT_PUBLIC_APP_CHECK_SITE_KEY APP_CHECK_ENFORCE CSP_ENFORCE \
         NEXT_PUBLIC_TRUSTED_PDF_HOSTS FIREBASE_SERVICE_ACCOUNT_KEY; do
  vercel env add "$v" preview production
done
vercel --prod=false   # deploys to a unique preview URL
```

`FIREBASE_SERVICE_ACCOUNT_KEY` MUST be added as a single-line JSON string
(use `jq -c < service-account.json | pbcopy`). Mark it as **Sensitive**.

## 5'. Host setup (Netlify)

```bash
netlify link
netlify env:import .env.local      # bulk import
netlify deploy --build --alias=staging
```

Netlify users: enable Next.js runtime v5+ (the proxy/middleware in `src/proxy.ts`
requires the Edge runtime to be available; this repo runs the proxy on Node).

---

## 6. Healthcheck verification

After every deploy, hit the public health endpoint:

```bash
curl -sS https://staging.dronetag.example/api/health | jq
```

Expect:

```json
{
  "status": "ok",
  "build": { "version": "0.1.0", "commit": "abc1234", "environment": "production", "bootedAt": "…" },
  "firebase": { "adminConfigured": true },
  "security": { "appCheckEnforce": true, "cspMode": "report-only" }
}
```

Failure modes:

- `firebase.adminConfigured: false` → `FIREBASE_SERVICE_ACCOUNT_KEY` not set
  on the host. `/admin/*` will fall back to client-side gating only.
- HTTP 503 → adminConfigured is false. Treat as deploy-blocking.
- `cspMode: "enforce"` while you intended report-only → check `CSP_ENFORCE`.

Sign in as an admin and open `/admin`. The Ops footer must show green pills
for **Firebase Admin** and **App Check**.

---

## 7. Admin bootstrap

Custom claims drive `/admin/*` access. The first admin must be granted
manually:

```bash
# From repo root, with FIREBASE_SERVICE_ACCOUNT_KEY exported
npx tsx scripts/grant-admin.ts admin@dronetag.example
# Or to revoke:
npx tsx scripts/grant-admin.ts --revoke admin@dronetag.example
```

The user must sign **out and back in** for the new claim to appear in their
ID token. The proxy reads the token from the `__session` cookie set by the
client `AuthContext`.

Sanity-check: after sign-in, `document.cookie` includes `__session=…` and
`/admin` renders without a redirect to `/account`.

---

## 8. Rollback procedure

DroneTag deploys are blue/green at the host level (Vercel / Netlify keep
previous deployments). Roll back in this order:

1. **Frontend** — revert the host deploy:
   - Vercel: dashboard → Deployments → previous green deploy → "Promote to
     Production"; or `vercel rollback`.
   - Netlify: dashboard → Deploys → "Publish deploy" on the previous green.
2. **Rules** — `firebase firestore:rules rollback` (or redeploy the previous
   `firestore.rules` from `git` HEAD~1). If the bad deploy weakened rules,
   the rollback restores the stricter version.
3. **Functions** — `firebase functions:rollback` or
   `firebase deploy --only functions` from the previous git ref.
4. **Indexes** — never auto-roll back; new indexes are additive. If a
   missing index was introduced, redeploy the previous `firestore.indexes.json`.

Hot-fix path if the frontend is broken but rules + functions are good: revert
**only** the frontend. Users see the previous UI immediately, while back-end
remains intact.

---

## 9. Post-deploy smoke test

Run through this checklist (≤ 5 minutes) on iPhone Safari, Android Chrome and
desktop Chrome:

- [ ] `/` loads, Demo banner is **not** showing (staging is wired to Firebase).
- [ ] Sign up a throw-away account → land on `/account/profile`.
- [ ] `/account/operators` → create one operator → success.
- [ ] `/account/drones` → create one drone → success → public URL appears once
      published.
- [ ] Open the public URL in incognito → see `PublicDroneCard` with verification +
      insurance pills. Network response must **not** contain any field outside
      `DronePublicSnapshot`.
- [ ] Tap "Report found drone" → submit a test report → owner inbox shows it.
- [ ] PWA install prompt appears on Android Chrome (Chrome menu → "Install app"),
      iOS A2HS tip appears on iPhone Safari.
- [ ] `/api/health` → `status: ok`.

If any of these fail, **do not** invite real testers. Roll back per step 8.
