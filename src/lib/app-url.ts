/** Absolute origin for links and email assets (no trailing slash). */
export function appBaseUrl(): string {
  const authUrl = process.env.AUTH_URL?.trim();
  if (authUrl) {
    return authUrl.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/$/, "")}`;
  }
  return "http://localhost:17017";
}
