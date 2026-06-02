/**
 * Public signup is disabled by default. End-user accounts are created by
 * an admin via /admin/users/new (Firebase Admin SDK + Firestore profile).
 * Set NEXT_PUBLIC_ALLOW_SIGNUP=true only for open-registration staging.
 */
export const ALLOW_PUBLIC_SIGNUP = process.env.NEXT_PUBLIC_ALLOW_SIGNUP === 'true';
