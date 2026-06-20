# DEPLOY_PRODUCTION.md

Promotion recipe to bring **DroneTag production** to the same revision as
staging. Assumes `DEPLOY_STAGING.md` has been followed at least once and that
the change you're shipping has been live on staging for ≥ 48 h with no open
P0/P1 issues.

> **Hard rule:** production deploys happen during business hours, never on a
> Friday afternoon, never within 24 h of a known holiday. The bootstrap flow
> (`auth.user().onCreate` → `slots/{uid}`) is asynchronous; if it misfires
> you'll want someone awake to run the backfill.

---

## 0. Promotion gate

Before flipping anything in production:

- [ ] All staging checklists from `STAGING-SIGNOFF.md` ticked.
- [ ] `/api/health` on staging returned `status: ok` for ≥ 24 h continuously
      (configure your uptime monitor accordingly).
- [ ] CSP soak on staging is clean for ≥ 48 h with `CSP_ENFORCE=false`.
- [ ] App Check has been **enforced** on staging Cloud Functions for ≥ 7 days
      with zero spurious denials in `firebase functions:log`.
- [ ] All Cloud Functions p95 (Firebase console → Functions → metrics) is
      < 1.5 s on staging.
- [ ] One real-device run-through on iPhone, Android, desktop completed.
- [ ] Change owner has identified a rollback path (PR revert SHA).

---

## 1. Environment variables (production)

Same matrix as `DEPLOY_STAGING.md §1` with production-specific values:

| Variable | Differences from staging |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | All from `dronetag-prod` project. |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Service account from `dronetag-prod`. |
| `NEXT_PUBLIC_APP_CHECK_SITE_KEY` | reCAPTCHA Enterprise / v3 site key bound to the production origin. |
| `APP_CHECK_ENFORCE` | `true` |
| `CSP_ENFORCE` | `true` once §6 soak has been completed in staging |
| `NEXT_PUBLIC_TRUSTED_PDF_HOSTS` | populated only if you actually mirror PDFs off Firebase Storage |

> Production `FIREBASE_SERVICE_ACCOUNT_KEY` MUST belong to a **separate**
> service account from staging. Rotate every 180 days; record the rotation
> date in your secrets manager.

---

## 2. Firebase deploy order

Identical to staging, but **always** rebuild the functions first and deploy
indexes before rules:

```bash
firebase use dronetag-prod

# 1. Build & deploy functions from a clean checkout
cd functions && rm -rf lib node_modules && npm ci && npm run build && cd -

# 2. Indexes first — Firestore queries that lean on new composite indexes
#    will silently degrade or 5xx until the index is BUILT (not just deployed).
firebase deploy --only firestore:indexes
# Wait in the Firebase console → Indexes panel for status "Enabled" on every
# new index before continuing.

# 3. Rules
firebase deploy --only firestore:rules
firebase deploy --only storage:rules

# 4. Functions
firebase deploy --only functions
```

Verify `bootstrapSlots` is listed under Functions → "All functions" with the
correct revision tag.

---

## 3. App Check (production enforcement)

By production day, App Check must already be enforced everywhere. Re-verify:

1. Firebase console → App Check → Apps → check that the production web app
   shows **Enforcement: ON** for:
   - Cloud Firestore
   - Cloud Storage
   - Cloud Functions
2. From an incognito browser, attempt to hit a callable directly with no
   App Check token (e.g. via `fetch`). Expect HTTP 401/403 from the callable.

If you discover you need to roll App Check **back** to monitor mode, you must
roll back **before** users notice — every legitimate dashboard request will
otherwise 403.

---

## 4. CSP rollout (production)

By production day, CSP must already have been soaked in `report-only` on
staging for 48 h with no legitimate warnings. Flip `CSP_ENFORCE=true` on the
host and redeploy. The first 30 minutes after enforcement is the highest-risk
window; have a teammate refresh the home page, public profile, and admin
dashboard in three browsers and watch their consoles for `Refused to load`.

If you must roll back: set `CSP_ENFORCE=false` and trigger a redeploy. CSP is
a header — there's no client cache to bust.

---

## 5. Host promotion

Vercel:

```bash
vercel --prod
```

Netlify:

```bash
netlify deploy --build --prod
```

For Vercel, the recommended pattern is to promote a Preview deployment that
has already been smoke-tested:

```bash
# Find the staging-equivalent preview deploy
vercel ls dronetag-prod
# Promote it (no rebuild)
vercel promote <deployment-id>
```

This avoids a rebuild and a possible different commit landing in production
than what was tested.

---

## 6. Healthcheck + admin verification

```bash
curl -sS https://dronetag.example/api/health | jq
```

Required:

```jsonc
{
  "status": "ok",
  "firebase":  { "adminConfigured": true },
  "security":  { "appCheckEnforce": true, "cspMode": "enforce" }
}
```

Sign in as an admin → `/admin` Ops footer must show 4 green pills and the
correct `vX.Y.Z · <commit> · production` string.

Hit one callable from the dashboard (e.g. create a test operator under a
disposable test account) → expect success and a fresh `slots/<uid>` document
in the Firestore console.

---

## 7. Admin bootstrap (production)

The first production admin must be granted via the same script:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY="$(cat prod-service-account.json | jq -c)" \
  npx tsx scripts/grant-admin.ts admin@dronetag.example
```

Subsequent admins should be granted by another admin via the same script;
self-service "promote to admin" is intentionally not implemented.

---

## 8. Rollback procedure (production)

Identical decision tree as staging (`DEPLOY_STAGING.md §8`) but with a stricter
trigger:

- **Roll back the frontend immediately** if any of:
  - `/api/health` returns 5xx for > 60 s,
  - `/u/<slug>` returns a 5xx for a known-good slug,
  - App Check rejects > 1 % of requests (Firebase console → App Check → Metrics),
  - Cloud Functions error rate > 1 % for > 5 min.
- **Roll back functions** only if a specific function is throwing. Use
  `firebase functions:rollback <name>` or `firebase deploy --only functions:<name>`
  from the previous green ref.
- **Roll back rules** only if a write that worked yesterday is now denied;
  redeploy the previous `firestore.rules`/`storage.rules` from git.

After any rollback, post a short incident note to the team channel with
timestamp, commit SHA, and the failing log lines.

---

## 9. Post-deploy ops checklist

Within 1 h of every production deploy:

- [ ] `/api/health` returns 200 from 2+ uptime monitor regions.
- [ ] `firebase functions:log --since 1h` is clean (no `[ERROR]` lines).
- [ ] A throw-away end-to-end signup → create drone → publish → scan → report
      succeeded on iPhone Safari **and** Android Chrome.
- [ ] CSP report stream is empty (or only contains the expected entries).
- [ ] Slots bootstrap fired for the test account (Firestore → `slots/{testuid}`
      exists with `provisionedBy: 'auth.user.onCreate'`).
- [ ] Build version + commit visible in the admin Ops footer matches the SHA
      you intended to ship.

If anything on this list fails, treat it as a P1 and start the rollback
procedure.

---

## 10. Legacy data backfill (one-off)

Before a real user touches the dashboard for the first time **on production**,
backfill `slots/{uid}` for any account that was created before the
`bootstrapSlots` trigger was deployed (PR-SEC-4):

```bash
# Pseudocode — implement once or run from the Firebase console:
# 1. List every uid in `users/*`.
# 2. For each, if `slots/{uid}` doesn't exist, write BASE_SLOTS with
#    provisionedBy: 'backfill'.
```

The UI tolerates a missing slot doc (it falls back to `BASE_SLOTS` in
memory), but the admin slot-editor needs a real doc to update against.
