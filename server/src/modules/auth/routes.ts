import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { ApiError } from "../../middleware/errors";
import { signAuthToken } from "../shared/jwt";
import { authenticateUser, createUser, UserAlreadyExistsError, getVerificationToken, verifyEmail } from "./userStore";
import { loginSchema, signupSchema } from "./validators";
import { sendVerificationEmail } from "./emailService";

export const authRouter = Router();

authRouter.post("/signup", async (req: Request, res: Response, next: NextFunction) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new ApiError(400, "Invalid request body", parsed.error));
    return;
  }

  try {
    const user = await createUser(parsed.data.email, parsed.data.password);
    console.log(`✅ User created: ${user.email}`);
    
    // Get verification token and send email
    const token = await getVerificationToken(parsed.data.email);
    console.log(`📧 Verification token retrieved: ${token?.substring(0, 8)}...`);
    
    if (token) {
      try {
        await sendVerificationEmail(parsed.data.email, token);
        console.log(`✅ Verification email sent to ${parsed.data.email}`);
      } catch (emailError) {
        // Log email error but don't fail signup
        console.error("❌ Failed to send verification email:");
        console.error(emailError);
      }
    }
    
    res.status(201).json({ 
      message: "Account created! Please check your email to verify your account.",
      user 
    });
  } catch (e) {
    if (e instanceof UserAlreadyExistsError) {
      next(new ApiError(409, e.message));
      return;
    }

    next(new ApiError(500, "Signup failed", e));
  }
});

authRouter.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new ApiError(400, "Invalid request body", parsed.error));
    return;
  }

  try {
    const result = await authenticateUser(parsed.data.email, parsed.data.password);
    if (!result) {
      next(new ApiError(401, "Invalid email or password"));
      return;
    }

    const token = signAuthToken({ sub: result.user.id, email: result.user.email });
    res.json({ token, user: result.user });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Email not verified")) {
      next(new ApiError(403, e.message));
      return;
    }
    next(e);
  }
});

authRouter.get("/verify/:token", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    console.log(`📧 Verification request received for token: ${token.substring(0, 8)}...`);
    
    const result = await verifyEmail(token);
    console.log(`📊 Verification result:`, result);
    
    if (!result.success) {
      console.log(`❌ Verification failed: ${result.message}`);
      next(new ApiError(400, result.message));
      return;
    }
    
    console.log(`✅ Sending success response: ${result.message}`);
    res.status(200).json({ message: result.message });
  } catch (e) {
    console.error(`❌ Verification error:`, e);
    next(new ApiError(500, "Verification failed", e));
  }
});

authRouter.post("/logout", (_req: Request, res: Response) => {
  // JWT is stateless; client clears token.
  res.status(204).send();
});
