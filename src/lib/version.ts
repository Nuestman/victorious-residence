import packageJson from "../../package.json";

/** Semver from package.json — shown in portal chrome and release docs. */
export const APP_VERSION = packageJson.version;

export function formatAppVersion(prefix = "v"): string {
  return `${prefix}${APP_VERSION}`;
}
