import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export const loginSchema = signupSchema;

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
