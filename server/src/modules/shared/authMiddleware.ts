import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../middleware/errors";
import { verifyAuthToken } from "./jwt";

export type AuthUser = {
  id: string;
  email: string;
};

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    next(new ApiError(401, "Unauthorized"));
    return;
  }

  const token = header.slice("bearer ".length).trim();
  try {
    const payload = verifyAuthToken(token);
    (req as Request & { user: AuthUser }).user = { id: payload.sub, email: payload.email };
    next();
  } catch (e) {
    next(new ApiError(401, "Invalid or expired token", e));
  }
}
