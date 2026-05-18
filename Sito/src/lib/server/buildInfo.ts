/**
 * Build / runtime metadata exposed by the health endpoint and the
 * admin overview footer. Server-only — never re-export from a path
 * the client bundle reaches, otherwise the version string ends up in
 * the public JS payload.
 */

// TypeScript's `resolveJsonModule` lets us import package.json directly.
// The version string ends up in the server bundle only because this
// module is imported solely from /api/health and the admin overview.
import packageJson from '../../../package.json';

export interface BuildInfo {
  appName: string;
  version: string;
  /** Short SHA when available (Vercel / GitHub Actions inject it). */
  commit: string;
  /** Build environment label (development / production / preview). */
  environment: string;
  /** ISO timestamp captured the first time this module was imported. */
  bootedAt: string;
}

const BOOTED_AT = new Date().toISOString();

function pickCommit(): string {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ??
    ''
  ).slice(0, 7);
}

export function getBuildInfo(): BuildInfo {
  return {
    appName: 'DroneTag',
    version: (packageJson as { version?: string }).version ?? '0.0.0',
    commit: pickCommit(),
    environment: process.env.NODE_ENV ?? 'development',
    bootedAt: BOOTED_AT,
  };
}
