import nodemailer from "nodemailer";
import { readFileSync } from "fs";
import { join } from "path";

function loadSmtpConfig() {
  // First try environment variables
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const from = process.env.SMTP_FROM || user || "";

  if (host && user && pass) {
    return { host, port, user, pass, from };
  }

  // Fall back to config file
  try {
    const configPath = join(process.cwd(), "config", "app.json");
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    const smtp = config.smtp;
    if (smtp?.host && smtp?.user && smtp?.password) {
      return {
        host: smtp.host,
        port: smtp.port || 587,
        user: smtp.user,
        pass: smtp.password,
        from: smtp.from || smtp.user,
      };
    }
  } catch {
    // config file not found or invalid
  }

  return null;
}

function createTransporter() {
  const cfg = loadSmtpConfig();
  if (!cfg) return null;

  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
  });
}

export async function sendVerificationEmail(
  toEmail: string,
  name: string,
  token: string,
  baseUrl: string
) {
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;
  const cfg = loadSmtpConfig();
  const transporter = createTransporter();

  if (!transporter || !cfg) {
    console.log("========================================");
    console.log("EMAIL VERIFICATION LINK (No SMTP configured):");
    console.log(verifyUrl);
    console.log("========================================");
    return { sent: false, devUrl: verifyUrl };
  }

  try {
    await transporter.sendMail({
      from: `"Fius" <${cfg.from}>`,
      to: toEmail,
      subject: "Verify your Fius account",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 32px;background:#0d0d0d;color:#f4f4f5;border-radius:16px;">
          <div style="margin-bottom:28px;">
            <img src="${baseUrl}/fius-logo.png" alt="Fius" width="48" height="48" style="border-radius:12px;object-fit:contain;margin-bottom:20px;display:block;" />
            <h1 style="font-size:22px;font-weight:700;margin:0 0 8px;">Welcome to Fius, ${name}!</h1>
            <p style="color:#a1a1aa;margin:0;font-size:15px;line-height:1.5;">Click the button below to verify your email address and activate your account.</p>
          </div>
          <a href="${verifyUrl}" style="display:inline-block;background:#ffffff;color:#000000;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;margin-bottom:28px;">Verify Email Address</a>
          <hr style="border:none;border-top:1px solid #27272a;margin:24px 0;">
          <p style="color:#71717a;font-size:13px;margin:0;">This link expires in 24 hours. If you didn't sign up for Fius, you can safely ignore this email.</p>
        </div>
      `,
    });
    console.log(`✓ Verification email sent to ${toEmail}`);
    return { sent: true };
  } catch (err: any) {
    console.error("Failed to send email:", err.message);
    console.log("Verification URL (email failed):", verifyUrl);
    return { sent: false, devUrl: verifyUrl };
  }
}
