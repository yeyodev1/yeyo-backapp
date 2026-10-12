import { env } from "../config/env";
import { label, needsList } from "../constants/lead.labels";
import type { Lead } from "../models/lead.model";
import { escapeHtml } from "./telegram.service";

type Lang = "es" | "en";

const COPY = {
  es: {
    preheader: "Recibí tu solicitud. Te respondo en pocas horas con ideas concretas.",
    confirmSubject: (name: string) => `${name}, recibí tu solicitud ✅`,
    badge: "SOLICITUD RECIBIDA",
    confirmTitle: (name: string) => `¡Gracias, ${name}! Ya está en mis manos.`,
    confirmIntro:
      "Leí lo que me contaste y ya lo estoy revisando. En pocas horas hábiles te escribo con ideas concretas para tu negocio y, si tiene sentido, agendamos una llamada corta.",
    summary: "Lo que me contaste",
    needs: "Qué necesitas",
    story: "Tu mensaje",
    budget: "Presupuesto",
    timeline: "Para cuándo",
    business: "Tu negocio",
    stepsTitle: "Qué pasa ahora",
    steps: [
      ["Reviso tu caso", "Analizo tu negocio y lo que necesitas resolver."],
      ["Te escribo", "Te respondo con ideas y una propuesta de llamada de 30 minutos."],
      ["Propuesta clara", "Si encaja, te envío alcance, tiempos y precio cerrado."],
    ],
    minTitle: "Para que estemos alineados",
    minText:
      "Los proyectos empiezan <b>desde $500 USD</b>, que es el precio de algo muy básico. El valor final depende de lo que necesites; te lo confirmo con una propuesta clara antes de empezar.",
    hurry: "¿Te urge y quieres avanzar ya?",
    hurryText: "Escríbeme directo y lo vemos hoy mismo.",
    signature: "Diego Reyes (Yeyo)",
    role: "CTO en Bakano · Apps, automatizaciones y tiendas online",
    followSubject: (name: string) => `${name}, ¿seguimos con tu proyecto?`,
    followBadge: "SEGUIMIENTO",
    followTitle: "Sigo pendiente de tu idea",
    followIntro: (needs: string) =>
      `Hace un par de días me escribiste sobre <b>${needs}</b>. Si ya hablamos, ignora este correo. Si todavía no, respóndeme aquí mismo y agendamos una llamada corta esta semana.`,
    followNudge: "¿Prefieres algo más rápido?",
    footer: "Recibiste este correo porque dejaste una solicitud en yeyo.dev.",
  },
  en: {
    preheader: "I got your request. I'll reply within hours with concrete ideas.",
    confirmSubject: (name: string) => `${name}, I got your request ✅`,
    badge: "REQUEST RECEIVED",
    confirmTitle: (name: string) => `Thanks, ${name}! It's in my hands.`,
    confirmIntro:
      "I read what you told me and I'm already reviewing it. Within a few business hours I'll write back with concrete ideas for your business and, if it makes sense, we'll book a short call.",
    summary: "What you told me",
    needs: "What you need",
    story: "Your message",
    budget: "Budget",
    timeline: "Timeline",
    business: "Your business",
    stepsTitle: "What happens next",
    steps: [
      ["I review your case", "I look at your business and what you need to solve."],
      ["I write back", "I reply with ideas and a proposal for a 30-minute call."],
      ["A clear proposal", "If it's a fit, I send scope, timeline and a fixed price."],
    ],
    minTitle: "So we're aligned",
    minText:
      "Projects start <b>at $500 USD</b>, which covers something very basic. The final price depends on what you need; I confirm it with a clear proposal before we start.",
    hurry: "In a hurry and ready to move?",
    hurryText: "Message me directly and we'll look at it today.",
    signature: "Diego Reyes (Yeyo)",
    role: "CTO at Bakano · Apps, automations and online stores",
    followSubject: (name: string) => `${name}, shall we keep going with your project?`,
    followBadge: "FOLLOW-UP",
    followTitle: "Still thinking about your idea",
    followIntro: (needs: string) =>
      `A couple of days ago you wrote to me about <b>${needs}</b>. If we already talked, ignore this email. If not, just reply here and we'll book a short call this week.`,
    followNudge: "Prefer something faster?",
    footer: "You got this email because you left a request at yeyo.dev.",
  },
};

const INK = "#111111";
const PAPER = "#ffffff";
const CREAM = "#f6f1e4";
const YELLOW = "#ffe14d";
const ORANGE = "#ff7a1a";
const GREEN = "#3ddc97";
const PINK = "#ff8fd0";
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

const whatsappUrl = () => `https://wa.me/${env.CONTACT_WHATSAPP}`;
const instagramUrl = () => `https://instagram.com/${env.CONTACT_INSTAGRAM}`;
// 593963681303 → +593 96 368 1303 (Ecuador); otros formatos se muestran tal cual con "+".
const prettyPhone = () => {
  const n = env.CONTACT_WHATSAPP;
  const ec = n.match(/^593(\d{2})(\d{3})(\d{4})$/);
  return ec ? `+593 ${ec[1]} ${ec[2]} ${ec[3]}` : `+${n}`;
};
const firstName = (lead: Lead) => lead.name.split(/\s+/)[0]!;
const langOf = (lead: Lead): Lang => (lead.lang as Lang) || "es";

const button = (href: string, text: string, bg: string, color = INK) =>
  `<a href="${href}" style="display:inline-block;margin:6px 8px 0 0;padding:13px 20px;border-radius:999px;background:${bg};color:${color};font-weight:800;font-size:15px;text-decoration:none;border:2px solid ${INK};box-shadow:3px 3px 0 ${INK}">${text}</a>`;

const badge = (text: string, bg: string) =>
  `<span style="display:inline-block;padding:6px 12px;border-radius:999px;background:${bg};border:2px solid ${INK};font:800 11px/1 monospace;letter-spacing:1.5px;color:${INK}">${text}</span>`;

/** Marco con la estética del sitio: crema, tinta negra, sombras duras y stickers de color. */
function frame(opts: { preheader: string; badge: string; badgeBg: string; title: string; body: string; footer: string; signature?: [string, string] }) {
  const sig = opts.signature
    ? `<table cellpadding="0" cellspacing="0" style="margin-top:28px"><tr>
        <td style="vertical-align:middle;padding-right:12px"><div style="width:46px;height:46px;border-radius:12px;background:${YELLOW};border:2px solid ${INK};text-align:center;font:900 20px/46px ${FONT}">Y</div></td>
        <td style="vertical-align:middle"><div style="font-weight:800;font-size:15px">${opts.signature[0]}</div><div style="color:#666;font-size:13px">${opts.signature[1]}</div></td>
      </tr></table>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:${CREAM}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${opts.preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:28px 12px;font-family:${FONT};color:${INK}">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <tr><td style="padding:0 4px 14px">
          <span style="font:900 26px/1 ${FONT};letter-spacing:-1px;color:${YELLOW};-webkit-text-stroke:1.5px ${INK};text-shadow:2px 2px 0 ${INK}">YEYO.DEV</span>
        </td></tr>
        <tr><td style="background:${PAPER};border:3px solid ${INK};border-radius:20px;box-shadow:6px 6px 0 ${INK};padding:30px 28px">
          ${badge(opts.badge, opts.badgeBg)}
          <h1 style="margin:16px 0 14px;font-size:27px;line-height:1.15;letter-spacing:-0.5px">${opts.title}</h1>
          ${opts.body}
          ${sig}
        </td></tr>
        <tr><td style="padding:18px 6px;color:#7a7466;font-size:12px;line-height:1.5">${opts.footer}<br>yeyo.dev · WhatsApp ${prettyPhone()} · @${env.CONTACT_INSTAGRAM}</td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

const rows = (items: [string, string][]) =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};border:2px solid ${INK};border-radius:14px;font-size:14px">
    ${items
      .filter(([, v]) => v)
      .map(
        ([k, v], i) =>
          `<tr><td style="padding:12px 14px;${i ? "border-top:1px dashed #d8cfb8;" : ""}color:#6b6556;vertical-align:top;white-space:nowrap;width:120px">${k}</td><td style="padding:12px 14px 12px 0;${i ? "border-top:1px dashed #d8cfb8;" : ""}line-height:1.5">${v}</td></tr>`,
      )
      .join("")}
  </table>`;

const contactBlock = (heading: string, text: string) => `
  <div style="margin-top:24px;padding:20px;background:${INK};border-radius:16px;color:#fff">
    <p style="margin:0 0 4px;font-weight:800;font-size:17px;color:${YELLOW}">${heading}</p>
    ${text ? `<p style="margin:0 0 8px;color:#ddd">${text}</p>` : ""}
    ${button(whatsappUrl(), `WhatsApp ${prettyPhone()}`, GREEN)}
    ${button(instagramUrl(), `Instagram @${env.CONTACT_INSTAGRAM}`, PINK)}
  </div>`;

const summaryRows = (lead: Lead, lang: Lang) => {
  const c = COPY[lang];
  return rows([
    [c.business, escapeHtml((lead.businessType as string) || (lead.company as string) || "")],
    [c.needs, needsList(lead, lang).join(" · ")],
    [c.budget, lead.budget ? label(lang, "budget", lead.budget as string) : ""],
    [c.timeline, lead.timeline ? label(lang, "timeline", lead.timeline as string) : ""],
    [c.story, escapeHtml(lead.description).replace(/\n/g, "<br>")],
  ]);
};

export function confirmationEmail(lead: Lead) {
  const lang = langOf(lead);
  const c = COPY[lang];
  const steps = c.steps
    .map(
      ([t, d], i) =>
        `<tr><td style="vertical-align:top;padding:8px 12px 8px 0"><div style="width:30px;height:30px;border-radius:50%;background:${[YELLOW, ORANGE, GREEN][i]};border:2px solid ${INK};text-align:center;font:900 14px/30px ${FONT}">${i + 1}</div></td><td style="padding:8px 0"><b>${t}</b><br><span style="color:#555">${d}</span></td></tr>`,
    )
    .join("");

  const body = `
    <p style="margin:0 0 22px;font-size:16px;line-height:1.6">${c.confirmIntro}</p>
    <p style="margin:0 0 10px;font:800 12px/1 monospace;letter-spacing:1.5px;color:#6b6556">${c.summary.toUpperCase()}</p>
    ${summaryRows(lead, lang)}
    <p style="margin:26px 0 6px;font:800 12px/1 monospace;letter-spacing:1.5px;color:#6b6556">${c.stepsTitle.toUpperCase()}</p>
    <table cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.45">${steps}</table>
    <div style="margin-top:22px;padding:16px 18px;background:#fff6d6;border:2px dashed #c9a227;border-radius:14px">
      <p style="margin:0 0 4px;font-weight:800">💡 ${c.minTitle}</p>
      <p style="margin:0;color:#4a4436;line-height:1.55">${c.minText}</p>
    </div>
    ${contactBlock(c.hurry, c.hurryText)}`;

  return {
    subject: c.confirmSubject(firstName(lead)),
    html: frame({ preheader: c.preheader, badge: `✓ ${c.badge}`, badgeBg: GREEN, title: c.confirmTitle(firstName(lead)), body, footer: c.footer, signature: [c.signature, c.role] }),
  };
}

export function followUpEmail(lead: Lead) {
  const lang = langOf(lead);
  const c = COPY[lang];
  const needs = needsList(lead, lang).join(", ").toLowerCase() || (lang === "es" ? "tu proyecto" : "your project");
  const body = `<p style="margin:0;font-size:16px;line-height:1.6">${c.followIntro(escapeHtml(needs))}</p>${contactBlock(c.followNudge, "")}`;
  return {
    subject: c.followSubject(firstName(lead)),
    html: frame({ preheader: c.followTitle, badge: c.followBadge, badgeBg: YELLOW, title: c.followTitle, body, footer: c.footer, signature: [c.signature, c.role] }),
  };
}

const SOURCE_NAMES: Record<string, string> = {
  clasica: "Versión Clásica",
  muro: "El muro (stickers)",
  mundo: "El mundo (videojuego)",
  select: "Pantalla de inicio",
};

/** Aviso interno para Yeyo con todos los datos del cliente. "Responder" le escribe al cliente. */
export function ownerEmail(lead: Lead) {
  const e = escapeHtml;
  const hot = lead.timeline === "urgente" || lead.budget === "8k-mas" || lead.budget === "3k-8k";
  const when = new Date(lead.createdAt).toLocaleString("es-EC", { timeZone: "America/Guayaquil", dateStyle: "full", timeStyle: "short" });
  const wa = (lead.whatsapp as string)?.replace(/\D/g, "");
  const greeting = encodeURIComponent(`¡Hola ${firstName(lead)}! Soy Yeyo de yeyo.dev, recibí tu solicitud.`);
  const budget = lead.budget ? label("es", "budget", lead.budget as string) : "—";

  const body = `
    <p style="margin:0 0 18px;font-size:16px;line-height:1.6">${hot ? "🔥 <b>Prioridad alta.</b> " : ""}Llegó una solicitud nueva desde <b>${e(SOURCE_NAMES[lead.source as string] || (lead.source as string))}</b>. El cliente confirmó tener al menos $500 USD para invertir y ya recibió su correo de confirmación con tu WhatsApp e Instagram.</p>
    ${rows([
      ["Nombre", `<b>${e(lead.name)}</b>`],
      ["Correo", `<a href="mailto:${e(lead.email)}" style="color:${INK}">${e(lead.email)}</a>`],
      ["WhatsApp", lead.whatsapp ? e(lead.whatsapp as string) : "<i>no dejó</i>"],
      ["Negocio", e((lead.businessType as string) || (lead.company as string) || "—")],
      ["Necesita", needsList(lead, "es").join(" · ") || "—"],
      ["Presupuesto", `<b>${budget}</b>`],
      ["Para cuándo", lead.timeline ? label("es", "timeline", lead.timeline as string) : "—"],
      ["Idioma", lead.lang === "en" ? "Inglés" : "Español"],
      ["Fecha", when],
    ])}
    <p style="margin:22px 0 8px;font:800 12px/1 monospace;letter-spacing:1.5px;color:#6b6556">LO QUE CUENTA</p>
    <div style="padding:16px 18px;background:#fff6d6;border-left:5px solid ${ORANGE};border-radius:10px;font-size:15px;line-height:1.6">${e(lead.description).replace(/\n/g, "<br>")}</div>
    <div style="margin-top:22px">
      ${wa && wa.length >= 8 ? button(`https://wa.me/${wa}?text=${greeting}`, "💬 Escribirle por WhatsApp", GREEN) : ""}
      ${button(`mailto:${e(lead.email)}?subject=${encodeURIComponent("Tu proyecto con yeyo.dev")}`, "✉️ Responder por correo", YELLOW)}
    </div>
    <p style="margin:18px 0 0;color:#6b6556;font-size:13px">Si no lo marcas como contactado, en ${env.FOLLOW_UP_AFTER_HOURS} h le llega un correo de seguimiento automático.</p>`;

  return {
    subject: `${hot ? "🔥 " : ""}Nueva solicitud: ${lead.name} · ${budget}`,
    html: frame({ preheader: `${lead.name} quiere: ${needsList(lead, "es").join(", ")}`, badge: "NUEVO CLIENTE", badgeBg: ORANGE, title: `${e(lead.name)} quiere trabajar contigo`, body, footer: "Aviso interno de yeyo.dev." }),
  };
}
