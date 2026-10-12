import { createApp } from "./app.js";
import { prisma } from "./config/database.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "Server listening");
});

const shutdownTimeoutMs = 10_000;

function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down");

  server.close(() => {
    prisma.$disconnect().finally(() => process.exit(0));
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, shutdownTimeoutMs).unref();
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "Uncaught exception");
  process.exit(1);
});
