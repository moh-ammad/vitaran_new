import type { RequestHandler } from "express";
import type { ZodType } from "zod";

type RequestPart = "body" | "query" | "params";

export function validate<T>(
  schema: ZodType<T>,
  part: RequestPart = "body",
): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req[part]);

    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    if (part === "query") {
      Object.defineProperty(req, "query", {
        value: parsed.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else if (part === "params") {
      req.params = parsed.data as typeof req.params;
    } else {
      req.body = parsed.data;
    }

    next();
  };
}
