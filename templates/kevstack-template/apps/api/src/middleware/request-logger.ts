import type { RequestHandler } from "express";

export const requestLogger: RequestHandler = (req, res, next) => {
  const start = performance.now();
  res.on("finish", () => {
    const ms = (performance.now() - start).toFixed(1);
    console.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
};
