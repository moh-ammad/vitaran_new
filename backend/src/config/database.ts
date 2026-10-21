import { getServers, promises as dnsPromises, setServers } from "node:dns";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolConfig } from "pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "./env.js";

/**
 * Neon hostnames are CNAMEs. On some Windows setups `dns.lookup` / getaddrinfo
 * returns ENOTFOUND while `resolve4` works — Prisma then reports P1001.
 * Prefer public resolvers and connect via an A-record IP with TLS servername.
 */
function preferPublicDnsResolvers() {
  const preferred = ["8.8.8.8", "1.1.1.1"];
  const rest = getServers().filter((server) => !preferred.includes(server));
  setServers([...preferred, ...rest]);
}

async function buildPoolConfig(connectionString: string): Promise<PoolConfig> {
  preferPublicDnsResolvers();

  const url = new URL(connectionString);
  const hostname = url.hostname;
  let host = hostname;

  try {
    const addresses = await dnsPromises.resolve4(hostname);
    if (addresses[0]) host = addresses[0];
  } catch {
    // Keep hostname; machines where getaddrinfo works still connect normally.
  }

  return {
    host,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    ssl:
      host === hostname
        ? { rejectUnauthorized: true }
        : { rejectUnauthorized: true, servername: hostname },
    connectionTimeoutMillis: 20_000,
    idleTimeoutMillis: 30_000,
    max: 10,
  };
}

const pool = new Pool(await buildPoolConfig(env.DATABASE_URL));

export const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
  log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export async function disconnectDatabase() {
  await prisma.$disconnect();
  await pool.end();
}
