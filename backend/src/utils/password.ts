import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

function deriveKey(password: string, salt: Buffer, length = KEY_LENGTH): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, length, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

/** Format: `scrypt$<salt>$<key>` (base64), so the algorithm can change later. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await deriveKey(password, salt);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, saltText, keyText] = stored.split("$");
  if (algorithm !== "scrypt" || !saltText || !keyText) return false;

  const expected = Buffer.from(keyText, "base64");
  const actual = await deriveKey(password, Buffer.from(saltText, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}
