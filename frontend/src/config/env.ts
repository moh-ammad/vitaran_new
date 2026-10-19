const API_URL_ENV = "NEXT_PUBLIC_API_URL";

/**
 * Base URL for the Express API.
 * On Windows, Node's fetch often fails resolving `localhost` to IPv6 (`::1`)
 * even when the API is listening — pin loopback to IPv4.
 */
export function getApiUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!value) {
    throw new Error(`${API_URL_ENV} is not set`);
  }

  return value
    .replace(/\/$/, "")
    .replace(/^http:\/\/localhost(?=[:/]|$)/i, "http://127.0.0.1")
    .replace(/^https:\/\/localhost(?=[:/]|$)/i, "https://127.0.0.1");
}
