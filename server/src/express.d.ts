import type { AuthUser } from "./modules/shared/authMiddleware";

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}
