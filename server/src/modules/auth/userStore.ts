import crypto from "crypto";
import bcrypt from "bcryptjs";
import type { Collection } from "mongodb";
import { getUsersCollection } from "../../db/mongo";

export type UserPublic = {
  id: string;
  email: string;
};

type UserDocument = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  isVerified: boolean;
  verificationToken: string | null;
};

export class UserAlreadyExistsError extends Error {
  constructor() {
    super("Account already exists");
  }
}

async function users(): Promise<Collection<UserDocument>> {
  return getUsersCollection() as unknown as Collection<UserDocument>;
}

export async function createUser(email: string, password: string): Promise<UserPublic> {
  const collection = await users();
  const normalized = email.trim().toLowerCase();

  const existing = await collection.findOne({ email: normalized });
  if (existing) throw new UserAlreadyExistsError();

  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomUUID();
  
  try {
    await collection.insertOne({ 
      id, 
      email: normalized, 
      passwordHash, 
      createdAt: new Date(),
      isVerified: false,
      verificationToken
    });
  } catch (e) {
    const maybeCode = (e as { code?: unknown } | null)?.code;
    if (maybeCode === 11000) {
      throw new UserAlreadyExistsError();
    }
    throw e;
  }

  return { id, email: normalized };
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<{ user: UserPublic } | null> {
  const collection = await users();
  const normalized = email.trim().toLowerCase();

  const doc = await collection.findOne({ email: normalized });
  if (!doc) return null;

  const ok = await bcrypt.compare(password, doc.passwordHash);
  if (!ok) return null;

  // Check if email is verified
  if (!doc.isVerified) {
    throw new Error("Email not verified. Please check your email for verification link.");
  }

  return { user: { id: doc.id, email: doc.email } };
}

export async function getVerificationToken(email: string): Promise<string | null> {
  const collection = await users();
  const normalized = email.trim().toLowerCase();
  const doc = await collection.findOne({ email: normalized });
  return doc?.verificationToken || null;
}

export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  const collection = await users();
  
  console.log(`🔍 Verifying token: ${token.substring(0, 8)}...`);
  
  // First check if user with this token exists
  const userWithToken = await collection.findOne({ verificationToken: token });
  
  if (userWithToken) {
    console.log(`✅ Token found for user: ${userWithToken.email}`);
    
    // Check if already verified
    if (userWithToken.isVerified) {
      console.log(`ℹ️ User already verified`);
      // Clear the token even if already verified
      await collection.updateOne(
        { verificationToken: token },
        { $set: { verificationToken: null } }
      );
      return { 
        success: true, 
        message: "Your email is already verified! You can log in now." 
      };
    }
    
    // Verify the user
    const updateResult = await collection.updateOne(
      { verificationToken: token },
      { $set: { isVerified: true, verificationToken: null } }
    );
    
    console.log(`✅ User verified successfully. Modified count: ${updateResult.modifiedCount}`);
    
    // Double-check the update was successful
    if (updateResult.modifiedCount === 0) {
      console.log(`⚠️ Update didn't modify any document`);
    }
    
    return { 
      success: true, 
      message: "Email verified successfully! You can now log in." 
    };
  }
  
  console.log(`❌ Token not found in database`);
  
  // Token is invalid or expired (or already used)
  return { 
    success: false, 
    message: "Invalid or expired verification token. The link may have already been used or is incorrect." 
  };
}
