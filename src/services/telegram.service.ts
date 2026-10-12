import axios from "axios";
import { env } from "../config/env";

export type InlineButton = { text: string; url: string };

/** Escapa lo que escribe el cliente: Telegram parsea HTML y un "<" suelto rompe el mensaje. */
export const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Manda un mensaje al chat de Yeyo. Nunca lanza: si Telegram falla, la
 * solicitud ya quedó guardada y el cliente igual recibe su correo.
 */
export async function notifyTelegram(html: string, buttons: InlineButton[][] = []): Promise<boolean> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID sin definir — no se avisó");
    return false;
  }
  try {
    await axios.post(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: env.TELEGRAM_CHAT_ID,
        text: html,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        ...(buttons.length ? { reply_markup: { inline_keyboard: buttons } } : {}),
      },
      { timeout: 8000 },
    );
    return true;
  } catch (error: any) {
    console.error("[telegram] no se pudo enviar:", error?.response?.data || error?.message);
    return false;
  }
}
