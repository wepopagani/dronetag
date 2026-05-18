# STAGING-SIGNOFF.md

Final readiness brief for the **DroneTag staging environment** — STAGING-OPS-1.

This document is the single artefact a non-engineering stakeholder needs to
read before agreeing that the platform is ready for the first wave of beta
testers (target: 10–25 hand-picked drone operators, ideally a mix of pilots
and small commercial operators).

> If you only read one section, read **§3 (Beta-user workflow)**: it's the
> mental model the first testers should be onboarded against.

---

## 1. What's live on staging

| Surface | Status | Notes |
|---|---|---|
| Sign-up / sign-in (email + password) | ✅ ready | Firebase Auth, no SSO yet. |
| Personal dashboard (`/account/*`) | ✅ ready | Pilots, operators, drones, insurances, certificates, documents, inbox, billing placeholder. |
| Admin panel (`/admin/*`) | ✅ ready | Users, drones, reports, verification queue, plans, NFC tools. Locked behind custom-claim + `proxy.ts`. |
| Public profile (`/u/<slug>`) | ✅ ready | Reads only `dronesPublic` snapshot. Zero leakage of internal uid / PII. |
| "Report found drone" form | ✅ ready | Goes through `submitReport` Cloud Function with IP-keyed rate limit + App Check. |
| Temporary operator override (24 h TTL) | ✅ ready | Firestore-clamped, audit-logged. |
| PWA (installable + offline shell) | ✅ ready | iOS A2HS hint, Android install prompt, offline banner. |
| `/api/health` operational probe | ✅ ready | 200 + status JSON, used by admin Ops footer. |
| Analytics abstraction | ✅ ready | Console-only by default; vendor swap-in is one call. |
| Stripe / billing | 🟡 placeholder | UI surface exists; `NoopBillingProvider` throws on checkout. PR-BILL-1 ships real Stripe. |
| Email notifications on report | ⛔ not yet | Pending PR-EMAIL-1. Owners must check the inbox manually for now. |
| Account deletion (GDPR cascade) | ⛔ not yet | Pending PR-LEGAL-1. Use admin Firestore console to wipe a test account. |

Verification: hit `/api/health` and `/admin` Ops footer — every green pill must
agree with this table.

---

## 2. Known UX issues (won't fix in v1)

These are deliberate v1 trade-offs. List them in the beta survey so testers
don't re-report.

1. **Email notifications missing.** Drone owners must check
   `/account/inbox` manually after a report is filed. PR-EMAIL-1 wires
   Firebase Trigger Email.
2. **No password reset email is themed yet.** Firebase sends the default
   email template; copy will be branded in PR-EMAIL-1.
3. **Billing tab shows a "Coming soon" badge.** Disabled Subscribe CTA;
   slots are admin-granted in v1.
4. **No bulk NFC encoding hardware integration.** `/admin/nfc` exports a CSV
   only; the actual writer is whatever external tool (NXP TagWriter / Zebra)
   the operator uses.
5. **i18n (de / es / fr) mirrors English** for the STAGING-OPS-1 + PR-SEC-3/4
   strings. Italian is fully translated. Native translation pass is PR-i18n-1.
6. **Analytics is console-only.** Production tracking (PostHog / GA / Mixpanel)
   requires the operator to wire it via `setAnalyticsClient(...)`. The
   abstraction is in place.
7. **Slow first paint on cold-served public page** if the Firebase Functions
   region is far from the visitor. Globally cached in PR-EDGE-1.
8. **CSP currently in Report-Only on staging.** Move to `enforce` per
   `DEPLOY_STAGING.md §4` once the 48 h soak is clean.
9. **Account deletion** is admin-only via Firestore console. Self-service
   delete + GDPR cascade ships in PR-LEGAL-1.
10. **No push notifications.** Inbox is poll-only; foreground refresh by the
    owner is required.

---

## 3. Recommended first beta-user workflow

This is the path the average tester should be guided down. Keep it under
10 minutes from sign-up to a successful test scan.

```
1. Open the staging URL on the tester's phone.
   → If iPhone Safari: tap the A2HS hint to install. If Chrome on Android:
     accept the install prompt. Either way, end up on the home page.

2. Sign up with an email + password (use the tester's real email so they
   can later receive a report on it; in v1 we still rely on the dashboard
   inbox, not email).

3. Land on /account/profile.
   → Tester picks "Personal pilot" or "Company operator" account type.
   → Fills first name, last name, DOB.

4. /account/operators → create the first operator
   (private operator for solo pilots; company operator for businesses).

5. /account/drones → create one drone.
   → Tester enters manufacturer + model + class marking + default operator.
   → Status starts as "draft", visibility "private" — public URL is hidden.

6. /account/drones/<id> → open the drone detail editor.
   → Optionally upload an insurance PDF + set the valid-until date.
   → Flip status to "active", visibility to "public" → public URL appears.

7. /admin/nfc (admin only, demo) — export the CSV → encode the slug onto a
   physical sticker or print as QR. Hand it to the tester.

8. Tester scans the sticker with another phone or asks a friend to scan it.
   → Public page loads → tester sees the verification + insurance pills.
   → Tap "Report found drone" → submit a real test report.

9. Tester refreshes /account/inbox in their dashboard → they see the report.
   → Tester taps the safe-mailto link → opens their mail client with the
     finder's address pre-filled.

10. Optional: tester activates a 24 h temporary operator override
    (e.g. lending the drone to someone else) and verifies the public card
    updates within ~5 s (no manual refresh needed).
```

Anything in this flow that fails should be considered a blocker.

---

## 4. Recommended onboarding script for first testers

Copy/paste this into a Notion or PDF brief and ship it to each tester
alongside the staging URL. Keep it conversational; emphasise that staging
data will be wiped before v1 launch.

> **DroneTag Beta — Welcome!**
>
> Thanks for taking 15 minutes to try DroneTag. We're testing the public
> profile and "found drone" flow — the bits that operators see day-to-day
> and that the police / a finder will see if your drone goes missing.
>
> **Before you start**
>
> - This is a **staging** environment. Anything you upload may be deleted
>   without notice.
> - Use a **real email** so we can follow up, but a **disposable password**.
> - If you see anything weird, take a screenshot and reply to this thread.
>
> **What we want you to do**
>
> 1. Open `<staging-url>` on your phone and either install the app
>    (Android: tap "Install" in the Chrome menu; iPhone: Share → "Add to
>    Home Screen") or just keep it in a browser tab.
> 2. Sign up with email + password.
> 3. Follow the in-app prompts to create:
>    - one **operator** (yourself for personal use, or your company),
>    - one **drone**,
>    - one **insurance** policy (any real PDF works; we don't share it).
> 4. Publish the drone (status: active, visibility: public).
> 5. Open the resulting public URL on a **second device** (or ask a
>    friend). Pretend the drone has been found.
> 6. Tap "Report found drone" and send a test report.
> 7. Go back to your dashboard inbox and check that the report shows up.
>
> **What we want you to tell us**
>
> - Did the sign-up flow make sense? Anything confusing?
> - Did the dashboard feel slow or laggy on your phone?
> - On the public page, was the verification / insurance state obvious?
>   Would a police officer get the picture in < 5 seconds outdoors?
> - Did the "Report found drone" form feel like something you'd actually
>   fill in if you found a drone in a field?
> - Any bug you hit, however small (with screenshots if possible)?
>
> **Privacy**
>
> Your email and any PDF you upload stays in our staging Firebase project.
> We will delete the entire staging dataset before launch. We will not
> share your data with anyone. See `<privacy-policy-url>` (still draft).
>
> Thanks again! Reply to this thread with anything you hit. We're shipping
> fixes on a near-daily cadence.

---

## 5. Pre-invite gate

Don't share the staging URL until **all** of these are true:

- [ ] `npm run build` succeeds on the staging branch.
- [ ] `npm run lint` is clean.
- [ ] `firebase deploy --only firestore:rules,storage,firestore:indexes,functions`
      completed successfully in the last 24 h.
- [ ] `/api/health` returns `status: ok` from a fresh incognito session.
- [ ] At least one full pass of `docs/DEVICE_TESTING.md` on iPhone Safari +
      Android Chrome is signed in the latest deploy notes.
- [ ] CSP soak has been running for ≥ 48 h with no console warnings on the
      staging origin.
- [ ] The first admin account has been bootstrapped via `scripts/grant-admin.ts`
      and they can land on `/admin` without a redirect.
- [ ] Demo data (1 operator, 1 drone, 1 published profile) seeded so testers
      have something to scan against without setting it up themselves.

Sign-off line at the bottom of the staging readiness post:

```
STAGING ✅ ready for beta as of YYYY-MM-DD by <ops-handle>.
Build: vX.Y.Z · commit abc1234 · region eur3
Known issues: §2 of STAGING-SIGNOFF.md (10 items, all expected).
```
