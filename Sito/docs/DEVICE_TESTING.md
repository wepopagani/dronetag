# DEVICE_TESTING.md

Real-device test plan for **DroneTag staging** — STAGING-OPS-1.

Use this every time you want to (re)certify a build before inviting external
testers, and every time before a production promotion. The goal isn't 100 %
coverage; it's catching the high-impact regressions in 20 minutes per device.

Each section has a hard "must pass" list and a "nice to have" list. If any
"must pass" check fails, the build is **not** stage-ready; file an issue
referencing this doc.

> Tip: keep a throw-away staging email account for these runs so you can sign
> up fresh without polluting your real account state.

---

## A. iPhone (Safari) checklist

Tested on: iPhone 13+ running iOS 17+ (the dominant DroneTag operator
device). For iPad, repeat in Safari with horizontal split-screen.

### Must pass

- [ ] Open `https://staging.dronetag.example/u/<demoSlug>` from the iOS QR
      scanner (Camera app) → public profile renders within 2 s on Wi-Fi.
- [ ] Verification badge + insurance badge are readable in direct sunlight
      (visual sanity — they should be high-contrast tinted pills).
- [ ] "Report found drone" CTA is at least 44×44 pt and easy to thumb.
- [ ] Report modal: tap on email field → on-screen keyboard pushes the modal
      up; submit button stays visible. No content hidden behind the keyboard.
- [ ] Login + signup forms: keyboard "next/return" advances through inputs;
      submit button reachable without scrolling the page.
- [ ] Navbar respects the top safe area (no overlap with the notch /
      Dynamic Island).
- [ ] PWA install: tap Share → "Add to Home Screen" → launches in standalone
      mode → top status bar uses correct theme colour.
- [ ] In standalone, the home-indicator gesture pill never overlaps the
      bottom CTA on the public card or modal.
- [ ] iOS A2HS hint card appears once on Safari (not Chrome / Firefox iOS),
      auto-dismisses for 14 days after closing.
- [ ] Long-press the Report button → no broken context menu (should select
      none; underlying button has `user-select: none`-ish behaviour).

### Nice to have

- [ ] Pinch-zoom is allowed on the public page (accessibility).
- [ ] Dynamic Type at "Larger Accessibility Sizes" doesn't break layout
      (Safari ignores `prefers-reduced-motion` overrides, so verify the
      animation in the modal still works).

---

## B. Android (Chrome) checklist

Tested on: Pixel-class device running Chrome ≥ 122 on Android 13+.

### Must pass

- [ ] QR scan from the Camera app → DroneTag public page opens directly (no
      intermediate browser chooser if Chrome is default).
- [ ] PWA install banner appears in the Chrome menu ("Install app"), or the
      DroneTag install card in the bottom-right shows up within 30 s on the
      first visit.
- [ ] After install, the app shortcut launches in standalone mode with the
      navy theme colour visible in the system status bar.
- [ ] Pull-to-refresh inside the report modal does NOT close the modal
      (verified via `overscroll-contain`).
- [ ] Date inputs (insurance valid-until, etc.) use the native Android date
      picker.
- [ ] Auto-fill suggestions from Chrome populate the signup email / password
      fields correctly.
- [ ] Geolocation prompt fires once when "Add my location" is tapped, and
      coordinates appear in the report payload (admin/inbox).
- [ ] Soft keyboard up → modal scrolls; submit CTA stays reachable.
- [ ] PDF preview (insurance, certificates, documents) opens in the
      sandboxed iframe — no JS escapes, no top-level navigation.

### Nice to have

- [ ] Triggering Chrome's "Lite mode" / data saver still renders the public
      page in < 3 s on 3G throttled connection.

---

## C. Desktop checklist

Tested on: Chrome ≥ 122, Firefox ≥ 124, Safari ≥ 17 (macOS only).

### Must pass

- [ ] Layouts render the same at 1280 × 720, 1440 × 900, and ≥ 1920 × 1080.
      No clipped buttons, no horizontal scroll on the dashboard.
- [ ] `/admin` Ops footer shows 4 green pills + version + commit on Chrome
      and Firefox.
- [ ] Modal close on Escape works in all three browsers.
- [ ] Tab order through the report form: Name → Email → Message → Location
      text → "Add my location" → Submit.
- [ ] `prefers-color-scheme: dark` does NOT break the page (we ship a single
      light theme; ensure text remains legible under macOS forced-dark Safari).
- [ ] Right-click on the public card → no `console.error` thrown.
- [ ] Browser back/forward navigation between dashboard tabs preserves the
      list scroll positions (Next.js app-router default).

### Nice to have

- [ ] DevTools coverage panel: < 200 KB of unused JS on the public page.
- [ ] Lighthouse mobile score: Performance ≥ 80, Accessibility ≥ 95,
      Best Practices ≥ 95, PWA = installable.

---

## D. NFC / QR checklist

### Must pass

- [ ] Print a test QR for a known slug; scan with iOS Camera and Android
      Camera — both resolve to the canonical
      `https://<host>/u/<slug>` URL with no JavaScript redirect step.
- [ ] Encode the same slug to an NFC NDEF URI record (NXP TagWriter import
      of the `/admin/nfc` CSV); tap-to-launch on Android opens the public
      page without a chooser dialog when Chrome is default.
- [ ] Tap-to-launch on iPhone 13+ (NDEF auto-handled in lock screen) opens
      the public page within Safari (or default browser if user has changed
      it).
- [ ] If the slug doesn't exist (e.g. drone unpublished) the "not found"
      panel renders in < 1 s with the polite copy, not a stack trace.
- [ ] Public page works correctly with `mailto:` deep-link guard: copying an
      owner email from the inbox produces a safe `mailto:` URL with no
      header injection (verify with `subject=…&body=…` shaped slug).

### Nice to have

- [ ] Sticker prototype tested outdoors in direct sun at arm's length
      (~ 70 cm) — QR scans on first attempt with both phones.

---

## E. PWA checklist

### Must pass

- [ ] `manifest.webmanifest` resolves to 200 with correct icons, theme
      color, and `display: standalone`.
- [ ] Service worker `/sw.js` registers on production and serves the
      app shell offline (open DevTools → Application → Service Workers).
- [ ] Cache contains: app shell URLs + 1 most-recently-viewed public profile
      page (and only one — `PUBLIC_PAGE_CACHE` should evict older entries).
- [ ] Install prompt is dismissable for 7 days (verify in DevTools
      localStorage).
- [ ] After install, opening the app icon launches into the existing tab
      (no double-tab).

### Nice to have

- [ ] iOS PWA splash screen shows correct logo on a fresh install.
- [ ] Update-on-reload works: deploy a new version → reload the standalone
      app → service worker takes over → fresh content appears within 2 s.

---

## F. Offline / flaky-network checklist

### Must pass

- [ ] DevTools → Network → "Offline" while standing on the public page →
      reload → the last-viewed page is served from cache.
- [ ] DevTools → Network → "Offline" on the dashboard → the offline banner
      appears at the bottom edge with no flicker.
- [ ] Reconnect → "Back online" toast appears for ~3 s and self-dismisses.
- [ ] Submitting a report while offline → graceful failure (user-safe error
      copy, no crash). The cooldown for that slug is NOT recorded so the
      finder can retry once online.
- [ ] Opening `/account/*` while offline shows the cached shell + falls
      back to "loading" until network returns (we intentionally don't
      cache private dashboards).

---

## G. Slow-network checklist

Throttle: DevTools → Network → "Slow 3G" preset.

### Must pass

- [ ] Public page first-contentful-paint < 3.5 s.
- [ ] Public page time-to-interactive < 5 s.
- [ ] Login + signup flows complete with no double-submission protection
      kicking in falsely.
- [ ] Report form: tapping submit while a previous submission is in flight
      shows the loading state on the CTA; second tap is no-op (button
      disabled while `submitting`).
- [ ] PDF preview: iframe shows the browser's spinner; if the PDF times out,
      the rest of the page still functions.

### Nice to have

- [ ] Largest Contentful Paint stays under 4 s on the public profile page.

---

## Sign-off line

Add a single line at the bottom of the related PR description:

```
Device testing: ✅ iPhone 13 / 17.5 · ✅ Pixel 7 / Android 14 / Chrome 122 · ✅ macOS 14 / Chrome 122 + Safari 17 · run 2026-MM-DD by <tester>
```
