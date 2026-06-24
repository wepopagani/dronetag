import { createHash, randomInt } from 'node:crypto';

import { adminFirestore } from '@/lib/server/firebaseAdmin';

const OTP_COLLECTION = 'signupOtp';
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

function generateCode(): string {
  return String(randomInt(100000, 999999));
}

export async function sendEmailOtp(uid: string, email: string): Promise<{ devCode?: string }> {
  const db = adminFirestore();
  const ref = db.collection(OTP_COLLECTION).doc(uid);
  const existing = await ref.get();
  const now = Date.now();

  if (existing.exists) {
    const lastSentAt = existing.data()?.lastSentAt as number | undefined;
    if (lastSentAt && now - lastSentAt < OTP_COOLDOWN_MS) {
      throw new Error('otp_cooldown');
    }
  }

  const code = generateCode();
  await ref.set({
    channel: 'email',
    email,
    codeHash: hashCode(code),
    expiresAt: now + OTP_TTL_MS,
    lastSentAt: now,
    attempts: 0,
  });

  const sent = await deliverEmailOtp(email, code);
  if (!sent && process.env.NODE_ENV === 'development') {
    console.info(`[otp] dev email code for ${email}: ${code}`);
    return { devCode: code };
  }
  if (!sent) {
    throw new Error('otp_email_delivery_failed');
  }
  return {};
}

export async function verifyEmailOtp(uid: string, code: string): Promise<boolean> {
  const db = adminFirestore();
  const ref = db.collection(OTP_COLLECTION).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) return false;

  const data = snap.data() as {
    channel?: string;
    codeHash?: string;
    expiresAt?: number;
    attempts?: number;
  };

  if (data.channel !== 'email') return false;
  if (!data.expiresAt || Date.now() > data.expiresAt) return false;
  if ((data.attempts ?? 0) >= 5) return false;

  const ok = data.codeHash === hashCode(code.trim());
  if (!ok) {
    await ref.update({ attempts: (data.attempts ?? 0) + 1 });
    return false;
  }

  await ref.delete();
  return true;
}

async function deliverEmailOtp(email: string, code: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;

  const from = process.env.OTP_EMAIL_FROM?.trim() || 'DroneTag <noreply@drone-tag.com>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'DroneTag — codice di verifica',
      text: `Il tuo codice di verifica DroneTag è: ${code}\n\nIl codice scade tra 10 minuti.`,
      html: `<p>Il tuo codice di verifica DroneTag è:</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p><p>Il codice scade tra 10 minuti.</p>`,
    }),
  });

  return res.ok;
}
