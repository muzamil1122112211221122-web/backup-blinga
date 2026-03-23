// SMTP configuration - loaded at startup
// Values come from environment variables set in Replit
export function getSmtpConfig() {
  return {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587"),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASSWORD || "",
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "",
  };
}

export function isSmtpConfigured(): boolean {
  const cfg = getSmtpConfig();
  return !!(cfg.host && cfg.user && cfg.pass);
}
