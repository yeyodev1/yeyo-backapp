import { env } from "../config/env";
import { label, needsList } from "../constants/lead.labels";
import type { Lead } from "../models/lead.model";
import { escapeHtml } from "./telegram.service";

type Lang = "es" | "en";

const COPY = {
  es: {
    confirmSubject: (name: string) => `Recibí tu solicitud, ${name} 🙌`,
    confirmTitle: (name: string) => `¡Gracias por escribirme, ${name}!`,
    confirmIntro:
      "Ya tengo tu solicitud y la estoy revisando. Te respondo en breve, normalmente en pocas horas hábiles, con ideas concretas para tu negocio.",
    summary: "Esto es lo que me contaste",
    needs: "Qué necesitas",
    story: "Tu mensaje",
    budget: "Presupuesto",
    timeline: "Para cuándo",
    hurry: "¿Te interesa mucho y quieres avanzar ya?",
    hurryText: "Escríbeme directo y lo vemos hoy mismo:",
    signature: "Diego Reyes (Yeyo) · CTO en Bakano",
    followSubject: (name: string) => `${name}, ¿seguimos con tu proyecto?`,
    followTitle: "Te escribo para dar seguimiento",
    followIntro: (needs: string) =>
      `Hace un par de días me escribiste sobre <b>${needs}</b>. Si ya hablamos, ignora este correo. Si todavía no, respóndeme aquí mismo y agendamos una llamada corta esta semana.`,
    followNudge: "Si prefieres algo más rápido:",
    footer: "Recibiste este correo porque dejaste una solicitud en yeyo.dev.",
  },
  en: {
    confirmSubject: (name: string) => `Got your request, ${name} 🙌`,
    confirmTitle: (name: string) => `Thanks for reaching out, ${name}!`,
    confirmIntro:
      "I have your request and I'm reviewing it. I'll get back to you shortly, usually within a few business hours, with concrete ideas for your business.",
    summary: "Here's what you told me",
    needs: "What you need",
    story: "Your message",
    budget: "Budget",
    timeline: "Timeline",
    hurry: "Really interested and want to move now?",
    hurryText: "Message me directly and we'll look at it today:",
    signature: "Diego Reyes (Yeyo) · CTO at Bakano",
    followSubject: (name: string) => `${name}, shall we keep going with your project?`,
    followTitle: "Just following up",
    followIntro: (needs: string) =>
      `A couple of days ago you wrote to me about <b>${needs}</b>. If we already talked, ignore this email. If not, just reply here and we'll book a short call this week.`,
    followNudge: "If you prefer something faster:",
    footer: "You got this email because you left a request at yeyo.dev.",
  },
};

const whatsappUrl = () => `https://wa.me/${env.CONTACT_WHATSAPP}`;
const instagramUrl = () => `https://instagram.com/${env.CONTACT_INSTAGRAM}`;
// 593963681303 → +593 96 368 1303 (Ecuador); otros formatos se muestran tal cual con "+".
const prettyPhone = () => {
  const n = env.CONTACT_WHATSAPP;
  const ec = n.match(/^593(\d{2})(\d{3})(\d{4})$/);
  return ec ? `+593 ${ec[1]} ${ec[2]} ${ec[3]}` : `+${n}`;
};

const button = (href: string, text: string, bg: string, color = "#111") =>
  `<a href="${href}" style="display:inline-block;margin:4px 8px 4px 0;padding:12px 18px;border-radius:999px;background:${bg};color:${color};font-weight:bold;text-decoration:none;border:2px solid #111">${text}</a>`;

/** Marco con la estética del sitio: amarillo, tinta negra, bordes gruesos. */
function brandLayout(lang: Lang, title: string, body: string) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3ecdc;padding:32px 12px;font-family:Arial,Helvetica,sans-serif">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:3px solid #111;border-radius:16px;overflow:hidden">
        <tr><td style="background:#ffe14d;border-bottom:3px solid #111;padding:18px 28px;font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#111">YEYO.DEV</td></tr>
        <tr><td style="padding:28px;color:#111;font-size:15px;line-height:1.6">
          <h1 style="margin:0 0 14px;font-size:24px;line-height:1.2">${title}</h1>
          ${body}
          <p style="margin:28px 0 0">— ${COPY[lang].signature}</p>
        </td></tr>
        <tr><td style="padding:14px 28px;color:#71717a;font-size:12px;border-top:1px solid #eee">${COPY[lang].footer}</td></tr>
      </table>
    </td></tr>
  </table>`;
}

const contactBlock = (lang: Lang, heading: string, text: string) => `
  <div style="margin-top:24px;padding:18px;background:#111;border-radius:12px;color:#fff">
    <p style="margin:0 0 4px;font-weight:bold;font-size:16px;color:#ffe14d">${heading}</p>
    <p style="margin:0 0 12px">${text}</p>
    ${button(whatsappUrl(), `WhatsApp ${prettyPhone()}`, "#3ddc97")}
    ${button(instagramUrl(), `Instagram @${env.CONTACT_INSTAGRAM}`, "#ff8fd0")}
  </div>`;

export function confirmationEmail(lead: Lead) {
  const lang = (lead.lang as Lang) || "es";
  const c = COPY[lang];
  const firstName = lead.name.split(/\s+/)[0]!;
  const row = (k: string, v: string) =>
    v ? `<tr><td style="padding:6px 12px 6px 0;color:#71717a;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:6px 0">${v}</td></tr>` : "";

  const body = `
    <p style="margin:0 0 20px">${c.confirmIntro}</p>
    <p style="margin:0 0 8px;font-weight:bold">${c.summary}:</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;background:#faf7ef;border-radius:10px;padding:10px 14px">
      ${row(c.needs, needsList(lead, lang).join(", "))}
      ${row(c.budget, lead.budget ? label(lang, "budget", lead.budget) : "")}
      ${row(c.timeline, lead.timeline ? label(lang, "timeline", lead.timeline) : "")}
      ${row(c.story, escapeHtml(lead.description).replace(/\n/g, "<br>"))}
    </table>
    ${contactBlock(lang, c.hurry, c.hurryText)}`;

  return { subject: c.confirmSubject(firstName), html: brandLayout(lang, c.confirmTitle(firstName), body) };
}

export function followUpEmail(lead: Lead) {
  const lang = (lead.lang as Lang) || "es";
  const c = COPY[lang];
  const firstName = lead.name.split(/\s+/)[0]!;
  const needs = needsList(lead, lang).join(", ").toLowerCase() || (lang === "es" ? "tu proyecto" : "your project");
  const body = `<p style="margin:0">${c.followIntro(escapeHtml(needs))}</p>${contactBlock(lang, c.followNudge, "")}`;
  return { subject: c.followSubject(firstName), html: brandLayout(lang, c.followTitle, body) };
}
