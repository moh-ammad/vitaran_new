import { hashPassword } from "../utils/password.js";

const MIN_PASSWORD_LENGTH = 12;

const password = process.argv[2];

if (!password || password.length < MIN_PASSWORD_LENGTH) {
  console.error(
    `Usage: npm run hash-password -- "<password>" (at least ${MIN_PASSWORD_LENGTH} characters)`,
  );
  process.exit(1);
}

console.log(await hashPassword(password));
