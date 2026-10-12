import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env, getCorsOrigins } from "./config/env.js";
import { API_PREFIX, REQUEST_BODY_LIMIT } from "./constants/http.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { apiRouter } from "./routes/index.js";
import { logger } from "./utils/logger.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    helmet({
      strictTransportSecurity: env.NODE_ENV === "production",
    }),
  );
  app.use(
    cors({
      origin: getCorsOrigins(),
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  );
  app.use(express.json({ limit: REQUEST_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: false, limit: REQUEST_BODY_LIMIT }));
  app.use(pinoHttp({ logger }));
  app.use(API_PREFIX, apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
