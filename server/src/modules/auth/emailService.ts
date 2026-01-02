import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!transporter) {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    console.log("📧 Creating email transporter:");
    console.log("- EMAIL_USER:", emailUser);
    console.log("- EMAIL_PASS length:", emailPass?.length || 0);

    if (!emailUser || !emailPass) {
      throw new Error("Email credentials not set in environment variables");
    }

    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }
  
  return transporter;
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Email - Todo App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Todo App!</h2>
        <p>Thank you for signing up. Please verify your email address to activate your account.</p>
        <div style="margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link in your browser:<br>
          <a href="${verificationUrl}" style="color: #4F46E5;">${verificationUrl}</a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  console.log(`Attempting to send email to: ${email}`);
  
  const transporter = getTransporter();
  const info = await transporter.sendMail(mailOptions);
  console.log("Email sent successfully:", info.messageId);
}
