/**
 * Public signup is enabled by default for the landing page.
 * Set NEXT_PUBLIC_ALLOW_SIGNUP=false to require admin-provisioned accounts only.
 */
export const ALLOW_PUBLIC_SIGNUP = process.env.NEXT_PUBLIC_ALLOW_SIGNUP !== 'false';
