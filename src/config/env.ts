import "dotenv/config";

/**
 * Único lugar que lee process.env. Leerlo en otro archivo a nivel de módulo
 * es el bug clásico de "la variable está en .env pero llega undefined".
 */

function required(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key]?.trim() || fallback;
}

function list(key: string): string[] {
  return optional(key, "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

export const env = {
  PORT: Number(optional("PORT", "8100")),
  NODE_ENV: optional("NODE_ENV", "development"),
  IS_VERCEL: Boolean(process.env.VERCEL),
  DB_URI: required("DB_URI"),
  JWT_SECRET: required("JWT_SECRET"),
  CORS_ORIGINS: list("CORS_ORIGINS"),
  FRONTEND_URL: optional("FRONTEND_URL", "http://localhost:5173"),
  SLACK_ERROR_WEBHOOK: optional("SLACK_ERROR_WEBHOOK", ""),
  ADMIN_EMAIL: optional("ADMIN_EMAIL", "admin@yeyo.dev").toLowerCase(),
  ADMIN_PASSWORD: optional("ADMIN_PASSWORD", ""),
  ADMIN_NAME: optional("ADMIN_NAME", "Administración"),
  RESEND_API_KEY: optional("RESEND_API_KEY", ""),
  RESEND_FROM_EMAIL: optional("RESEND_FROM_EMAIL", "Yeyo <onboarding@resend.dev>"),
  CLOUDINARY_CLOUD_NAME: optional("CLOUDINARY_CLOUD_NAME", ""),
  CLOUDINARY_API_KEY: optional("CLOUDINARY_API_KEY", ""),
  CLOUDINARY_API_SECRET: optional("CLOUDINARY_API_SECRET", ""),
  CRON_SECRET: optional("CRON_SECRET", ""),
  TELEGRAM_BOT_TOKEN: optional("TELEGRAM_BOT_TOKEN", ""),
  TELEGRAM_CHAT_ID: optional("TELEGRAM_CHAT_ID", ""),
  CONTACT_WHATSAPP: optional("CONTACT_WHATSAPP", "593963681303"),
  CONTACT_INSTAGRAM: optional("CONTACT_INSTAGRAM", "yeyo.dev"),
  CONTACT_EMAIL: optional("CONTACT_EMAIL", "me@yeyo.dev"),
  // URL pública de esta API, para el botón "marcar como contactado" de Telegram.
  API_PUBLIC_URL: optional("API_PUBLIC_URL", ""),
  FOLLOW_UP_AFTER_HOURS: Number(optional("FOLLOW_UP_AFTER_HOURS", "48")),
  // Webhook del workflow de leads de la landing de Bakano en GHL. Sin él no se manda nada.
  GHL_WEBHOOK_URL: optional("GHL_WEBHOOK_URL", ""),
} as const;
