import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { env } from "../config/env.js";
import { AppError } from "./app-error.js";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";
const IV_BYTES = 12;
const KEY_INFO = "vitaran/school-password";

let cachedKey: Buffer | undefined;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const material = env.PASSWORD_ENCRYPTION_KEY ?? env.JWT_SECRET;
  if (!material) {
    throw new AppError(503, "Password encryption is not configured", undefined, false);
  }

  cachedKey = Buffer.from(hkdfSync("sha256", material, "", KEY_INFO, 32));
  return cachedKey;
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);

  return [VERSION, iv, cipher.getAuthTag(), data]
    .map((part) => (typeof part === "string" ? part : part.toString("base64")))
    .join(":");
}

/** Returns null when the value can't be decrypted (e.g. the key was rotated). */
export function decryptSecret(sealed: string): string | null {
  const [version, iv, tag, data] = sealed.split(":");
  if (version !== VERSION || !iv || !tag || !data) return null;

  try {
    const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(data, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}
