import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "****" + process.env.EMAIL_PASS.slice(-4) : "NOT SET");
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function testEmail() {
  try {
    console.log("\nVerifying transporter...");
    await transporter.verify();
    console.log("✅ Email configuration is valid!");

    console.log("\nSending test email...");
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: "Test Email - Todo App",
      text: "If you receive this, email is working!",
      html: "<b>If you receive this, email is working!</b>",
    });

    console.log("✅ Test email sent successfully!");
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.error("❌ Email test failed:");
    console.error(error);
  }
}

testEmail();
