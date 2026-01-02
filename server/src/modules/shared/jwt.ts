import jwt from "jsonwebtoken";

export type AuthTokenPayload = {
  sub: string;
  email: string;
};

export function signAuthToken(payload: AuthTokenPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET. Set JWT_SECRET in server/.env");
  }

  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET. Set JWT_SECRET in server/.env");
  }

  const decoded = jwt.verify(token, secret);
  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid token payload");
  }

  const sub = (decoded as { sub?: unknown }).sub;
  const email = (decoded as { email?: unknown }).email;
  if (typeof sub !== "string" || typeof email !== "string") {
    throw new Error("Invalid token payload");
  }

  return { sub, email };
}
