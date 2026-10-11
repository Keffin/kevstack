import type { ErrorRequestHandler, RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Not found" });
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
};
