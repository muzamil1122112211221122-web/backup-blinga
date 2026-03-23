import nodemailer from "nodemailer";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const port = parseInt(process.env.SMTP_PORT || "587");

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return null;
}

export async function sendVerificationEmail(
  toEmail: string,
  name: string,
  token: string,
  baseUrl: string
) {
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;
  const transporter = createTransporter();

  if (!transporter) {
    console.log("========================================");
    console.log("EMAIL VERIFICATION LINK (No SMTP configured):");
    console.log(verifyUrl);
    console.log("========================================");
    return { sent: false, devUrl: verifyUrl };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@forus.app";

  await transporter.sendMail({
    from: `"Forus" <${from}>`,
    to: toEmail,
    subject: "Verify your Forus account",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d0d0d;color:#f4f4f5;border-radius:16px;">
        <h1 style="font-size:24px;font-weight:700;margin-bottom:8px;">Welcome to Forus, ${name}!</h1>
        <p style="color:#a1a1aa;margin-bottom:24px;">Click the button below to verify your email address and activate your account.</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#ffffff;color:#000000;font-weight:600;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:15px;">Verify Email</a>
        <p style="color:#71717a;font-size:13px;margin-top:24px;">This link expires in 24 hours. If you didn't sign up, you can safely ignore this email.</p>
      </div>
    `,
  });

  return { sent: true };
}
