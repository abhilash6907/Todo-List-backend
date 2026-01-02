import type { NextFunction, Request, Response } from "express";
import type { ApiErrorBody } from "../types";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFound(_req: Request, res: Response<ApiErrorBody>) {
  res.status(404).json({ message: "Not found" });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response<ApiErrorBody>,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    res.status(err.status).json({ message: err.message, details: err.details });
    return;
  }

  res.status(500).json({ message: "Internal server error" });
}
