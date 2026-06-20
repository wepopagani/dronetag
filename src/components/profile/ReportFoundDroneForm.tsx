'use client';

/**
 * Report-found-drone form rendered inside a modal.
 *
 * - Every field is optional; the form can be submitted blank but we still
 *   record the timestamp + drone reference so the owner sees an
 *   acknowledgement that "someone scanned my QR".
 * - Geolocation is opt-in via the browser's permission prompt; if the
 *   user declines, the rest of the form still submits fine.
 * - A simple honeypot field (`website`) traps naive bots; non-empty value
 *   silently drops the submission.
 * - A 30-second per-page cooldown stored in `sessionStorage` keyed by
 *   slug prevents accidental double submissions and trivial spam.
 *
 * Privacy: the report write goes to `reports/{id}` and the firestore.rules
 * (M1 + M3 update) prevent the reporter from setting `read`,
 * `emailNotified`, `pushNotified`, or impersonating another owner. The
 * reporter's contact is sent only to the drone owner via the inbox.
 */

import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { createReport } from '@/lib/firebase/reports';
import { trackEvent } from '@/lib/analytics';
import type { ReportLocation } from '@/lib/types/entities';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { FormErrorBanner } from '@/components/account/FormErrorBanner';

const COOLDOWN_MS = 30_000;
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
  finderName: string;
  contactEmail: string;
  message: string;
  locationText: string;
  /** Honeypot. Real users never see or fill this. */
  website: string;
}

const EMPTY_FORM: FormState = {
  finderName: '',
  contactEmail: '',
  message: '',
  locationText: '',
  website: '',
};

export type ReportFoundDroneFormProps = {
  droneId: string;
  droneSlug: string;
  isOpen: boolean;
  onClose: () => void;
};

export function ReportFoundDroneForm({
  droneId,
  droneSlug,
  isOpen,
  onClose,
}: ReportFoundDroneFormProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [location, setLocation] = useState<ReportLocation | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [requestingGeo, setRequestingGeo] = useState(false);

  // Reset internal state every time the modal opens — covers re-open
  // after a successful submit so the user sees a clean form.
  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY_FORM);
    setErrors({});
    setSubmitError(null);
    setSuccess(false);
    setLocation(null);
    setGeoError(null);
  }, [isOpen]);

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (form.contactEmail.trim() && !EMAIL_RX.test(form.contactEmail.trim())) {
      e.contactEmail = t('form.errors.invalidEmail');
    }
    return e;
  }

  function captureLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoError(t('reportFound.geolocation.error'));
      return;
    }
    setRequestingGeo(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : 0,
        });
        setRequestingGeo(false);
      },
      () => {
        setGeoError(t('reportFound.geolocation.error'));
        setRequestingGeo(false);
      },
      { maximumAge: 60_000, timeout: 10_000, enableHighAccuracy: false },
    );
  }

  function cooldownKey() {
    return `dronetag.report.cooldown.${droneSlug}`;
  }

  function inCooldown(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const raw = window.sessionStorage.getItem(cooldownKey());
      if (!raw) return false;
      const ts = parseInt(raw, 10);
      if (!Number.isFinite(ts)) return false;
      return Date.now() - ts < COOLDOWN_MS;
    } catch {
      return false;
    }
  }

  function recordCooldown() {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(cooldownKey(), String(Date.now()));
    } catch {
      // sessionStorage may be unavailable (Safari private mode); silently ignore.
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Honeypot: if filled, silently pretend we succeeded without submitting.
    if (form.website.trim()) {
      setSuccess(true);
      return;
    }

    if (inCooldown()) {
      setSubmitError(t('reportFound.cooldown'));
      return;
    }

    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await createReport({
        droneId,
        droneSlug,
        finderName: form.finderName.trim(),
        message: form.message.trim(),
        location,
        locationText: form.locationText.trim(),
        contactEmail: form.contactEmail.trim(),
      });
      recordCooldown();
      trackEvent('report_submitted', {
        slug: droneSlug,
        hasLocation: Boolean(location),
        hasContact: Boolean(form.contactEmail.trim()),
      });
      setSuccess(true);
    } catch (err) {
      console.error('[reportFound] submit failed', err);
      setSubmitError(t('reportFound.errorBody'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('reportFound.title')}
      footer={
        success ? undefined : (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={submitting}
              fullWidth
              className="tap-44 sm:w-auto"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              form="report-found-form"
              loading={submitting}
              fullWidth
              size="lg"
              className="tap-44 sm:w-auto"
            >
              {submitting ? t('reportFound.submitting') : t('reportFound.submit')}
            </Button>
          </div>
        )
      }
    >
      {success ? (
        <SuccessPanel onClose={onClose} />
      ) : (
        <form id="report-found-form" onSubmit={handleSubmit} noValidate className="space-y-4 pb-1">
          <p className="text-sm leading-relaxed text-gray-600">{t('reportFound.subtitle')}</p>

          <FormErrorBanner show={Boolean(submitError)} message={submitError ?? undefined} />

          <Input
            label={t('reportFound.field.finderName')}
            name="finderName"
            value={form.finderName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setField('finderName', e.target.value)}
            autoComplete="name"
            maxLength={200}
          />
          <Input
            label={t('reportFound.field.finderEmail')}
            name="finderEmail"
            type="email"
            inputMode="email"
            autoCapitalize="off"
            value={form.contactEmail}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setField('contactEmail', e.target.value)
            }
            autoComplete="email"
            maxLength={320}
            error={errors.contactEmail}
          />

          <Textarea
            label={t('reportFound.field.message')}
            name="message"
            value={form.message}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setField('message', e.target.value)}
            rows={4}
            maxLength={4000}
          />

          <div className="space-y-1.5">
            <Input
              label={t('reportFound.field.locationText')}
              name="locationText"
              value={form.locationText}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setField('locationText', e.target.value)
              }
              maxLength={500}
            />
            <p className="text-xs text-gray-500">{t('reportFound.field.locationTextHint')}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            {location ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-emerald-700">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="min-w-0">
                    <p className="font-medium">{t('reportFound.geolocation.added')}</p>
                    <p className="mt-0.5 break-all font-mono text-xs text-gray-600">
                      {t('inbox.locationCoords', {
                        lat: location.lat.toFixed(5),
                        lng: location.lng.toFixed(5),
                        accuracy: Math.round(location.accuracy),
                      })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation(null)}
                  type="button"
                  fullWidth
                  className="tap-44 sm:w-auto"
                >
                  {t('reportFound.geolocation.remove')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">{t('reportFound.geolocation.add')}</p>
                <Button
                  variant="secondary"
                  onClick={captureLocation}
                  loading={requestingGeo}
                  type="button"
                  fullWidth
                  size="lg"
                  className="tap-44"
                >
                  {t('reportFound.geolocation.add')}
                </Button>
              </div>
            )}
            {geoError ? <p className="text-xs text-red-600">{geoError}</p> : null}
          </div>

          {/* Honeypot — visually hidden from real users, irresistible to bots. */}
          <div aria-hidden className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
            <label>
              Website
              <input
                tabIndex={-1}
                type="text"
                name="website"
                autoComplete="off"
                value={form.website}
                onChange={(e) => setField('website', e.target.value)}
              />
            </label>
          </div>

          <p className="rounded-lg bg-blue-50 px-3 py-2.5 text-xs leading-relaxed text-blue-800">
            {t('reportFound.privacy')}
          </p>
        </form>
      )}
    </Modal>
  );
}

function SuccessPanel({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4 py-2">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7" aria-hidden>
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900">{t('reportFound.successTitle')}</h3>
        <p className="text-sm text-gray-600">{t('reportFound.successBody')}</p>
      </div>
      <div className="flex justify-center pt-2">
        <Button onClick={onClose} fullWidth size="lg" className="tap-44 sm:w-auto">
          {t('common.confirm')}
        </Button>
      </div>
    </div>
  );
}
