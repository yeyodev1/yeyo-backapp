import crypto from "crypto";
import { env } from "../config/env";
import { CustomError } from "../errors/customError.error";
import { label, needsList } from "../constants/lead.labels";
import { BUDGETS, LEAD_STATUS, LeadModel, NEEDS, TIMELINES, type Lead } from "../models/lead.model";
import { sendEmail } from "./email.service";
import { confirmationEmail, followUpEmail, ownerEmail } from "./leadEmails.service";
import { escapeHtml, notifyTelegram, type InlineButton } from "./telegram.service";

export interface LeadInput {
  name?: unknown;
  email?: unknown;
  whatsapp?: unknown;
  company?: unknown;
  businessType?: unknown;
  needs?: unknown;
  description?: unknown;
  budget?: unknown;
  timeline?: unknown;
  source?: unknown;
  lang?: unknown;
  acceptsMinimum?: unknown;
  /** Honeypot: los humanos no lo ven, los bots lo llenan. */
  website?: unknown;
}

const SOURCE_NAMES: Record<string, string> = {
  clasica: "Versión Clásica",
  muro: "El muro (stickers)",
  mundo: "El mundo (videojuego)",
  select: "Pantalla de inicio",
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Límite simple por IP: suficiente para frenar a un bot sin montar Redis.
const hits = new Map<string, number[]>();
function rateLimit(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (recent.length >= 5) throw new CustomError("Demasiadas solicitudes seguidas. Intenta en unos minutos.", 429);
  hits.set(ip, [...recent, now]);
}

function sanitize(input: LeadInput) {
  const name = str(input.name, 120);
  const email = str(input.email, 160).toLowerCase();
  const description = str(input.description, 4000);
  const lang = input.lang === "en" ? "en" : "es";

  if (!name) throw new CustomError("Cuéntame tu nombre", 400);
  if (!EMAIL_RE.test(email)) throw new CustomError("Ese correo no parece válido", 400);
  if (description.length < 10) throw new CustomError("Cuéntame un poco más de lo que necesitas", 400);

  const needs = Array.isArray(input.needs)
    ? [...new Set(input.needs.filter((n): n is (typeof NEEDS)[number] => NEEDS.includes(n)))]
    : [];
  // Calificación: solo pasan presupuestos desde $500 y quien aceptó ese mínimo.
  const budget = BUDGETS.includes(input.budget as never) ? (input.budget as string) : "";
  if (!budget) throw new CustomError("Elige un presupuesto. Los proyectos empiezan desde $500 USD.", 400);
  if (input.acceptsMinimum !== true) throw new CustomError("Confirma que tienes al menos $500 USD para invertir.", 400);
  const timeline = TIMELINES.includes(input.timeline as never) ? (input.timeline as string) : "";

  return {
    name,
    email,
    description,
    lang,
    needs,
    budget,
    timeline,
    whatsapp: str(input.whatsapp, 40),
    company: str(input.company, 140),
    businessType: str(input.businessType, 140),
    source: str(input.source, 40) || "web",
  };
}

/** Firma para el botón de Telegram: así el enlace sirve solo para esa solicitud. */
const signId = (id: string) => crypto.createHmac("sha256", env.JWT_SECRET).update(id).digest("hex").slice(0, 32);

export function verifyLeadToken(id: string, token: string) {
  const expected = signId(id);
  return token.length === expected.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

const waLink = (phone: string, text: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : "";
};

export function telegramMessage(lead: Lead, emailSent: boolean) {
  const e = escapeHtml;
  const hot = lead.timeline === "urgente" || lead.budget === "8k-mas" || lead.budget === "3k-8k";
  const when = new Date(lead.createdAt).toLocaleString("es-EC", { timeZone: "America/Guayaquil", dateStyle: "medium", timeStyle: "short" });
  const needs = needsList(lead, "es");

  const lines = [
    `${hot ? "🔥" : "🚀"} <b>NUEVA SOLICITUD</b> · yeyo.dev${hot ? "  <b>· PRIORIDAD ALTA</b>" : ""}`,
    "━━━━━━━━━━━━━━━━",
    `👤 <b>${e(lead.name)}</b>`,
    `✉️ ${e(lead.email)}`,
    lead.whatsapp ? `📱 ${e(lead.whatsapp)}` : "📱 <i>sin WhatsApp</i>",
    lead.company || lead.businessType
      ? `🏢 ${[lead.company, lead.businessType].filter(Boolean).map((v) => e(v as string)).join(" — ")}`
      : "",
    "",
    "🎯 <b>Qué necesita</b>",
    needs.length ? needs.map((n) => `• ${e(n)}`).join("\n") : "• <i>no marcó opciones</i>",
    "",
    "📝 <b>Lo que cuenta</b>",
    `<blockquote>${e(lead.description)}</blockquote>`,
    `💰 <b>Presupuesto:</b> ${lead.budget ? e(label("es", "budget", lead.budget)) : "—"}`,
    `⏱ <b>Para cuándo:</b> ${lead.timeline ? e(label("es", "timeline", lead.timeline)) : "—"}`,
    "",
    `🌐 Llegó desde: ${e(SOURCE_NAMES[lead.source as string] || (lead.source as string))} · ${lead.lang === "en" ? "🇺🇸 inglés" : "🇪🇨 español"}`,
    `🕒 ${when}`,
    "━━━━━━━━━━━━━━━━",
    emailSent
      ? "✅ Ya le llegó el correo de confirmación con tu WhatsApp e Instagram."
      : "⚠️ <b>No se pudo mandar el correo de confirmación.</b> Escríbele tú.",
    `⏰ Si no lo marcas como contactado, en ${env.FOLLOW_UP_AFTER_HOURS} h le llega un correo de seguimiento.`,
  ];

  const id = String(lead._id);
  const firstName = lead.name.split(/\s+/)[0];
  const greeting =
    lead.lang === "en"
      ? `Hi ${firstName}! It's Yeyo from yeyo.dev, I got your request.`
      : `¡Hola ${firstName}! Soy Yeyo de yeyo.dev, recibí tu solicitud.`;
  const row: InlineButton[] = [];
  const wa = lead.whatsapp ? waLink(lead.whatsapp, greeting) : "";
  if (wa) row.push({ text: "💬 Escribirle por WhatsApp", url: wa });
  const buttons: InlineButton[][] = row.length ? [row] : [];
  if (env.API_PUBLIC_URL) {
    buttons.push([
      { text: "✅ Marcar como contactado", url: `${env.API_PUBLIC_URL}/api/leads/${id}/contacted?token=${signId(id)}` },
    ]);
  }

  return { html: lines.join("\n").replace(/\n{3,}/g, "\n\n"), buttons };
}

export async function createLead(input: LeadInput, ip: string) {
  // Bot detectado: respondemos como si todo saliera bien para no darle pistas.
  if (str(input.website, 200)) return { ok: true };

  rateLimit(ip);
  const data = sanitize(input);
  const lead = (await LeadModel.create({ ...data, ip })).toObject() as unknown as Lead;

  const confirm = confirmationEmail(lead);
  const owner = ownerEmail(lead);
  const [emailSent] = await Promise.all([
    sendEmail(lead.email, confirm.subject, confirm.html, { replyTo: env.CONTACT_EMAIL }),
    // Copia completa para Yeyo; "Responder" le escribe directo al cliente.
    sendEmail(env.CONTACT_EMAIL, owner.subject, owner.html, { replyTo: lead.email }),
  ]);
  const { html, buttons } = telegramMessage(lead, emailSent);
  const notified = await notifyTelegram(html, buttons);

  await LeadModel.updateOne({ _id: lead._id }, { confirmationSent: emailSent, notifiedTelegram: notified });
  return { ok: true };
}

/** Correo de seguimiento a quien sigue "nuevo" pasado el plazo. Lo dispara el cron. */
export async function sendFollowUps() {
  const limit = new Date(Date.now() - env.FOLLOW_UP_AFTER_HOURS * 60 * 60 * 1000);
  const pending = await LeadModel.find({ status: "nuevo", followUpSentAt: null, createdAt: { $lte: limit } })
    .limit(25)
    .lean();

  let sent = 0;
  for (const raw of pending) {
    const lead = raw as unknown as Lead;
    const mail = followUpEmail(lead);
    const ok = await sendEmail(lead.email, mail.subject, mail.html, { replyTo: env.CONTACT_EMAIL });
    if (!ok) continue;
    sent++;
    await LeadModel.updateOne({ _id: lead._id }, { followUpSentAt: new Date() });
    await notifyTelegram(
      `⏰ <b>Seguimiento enviado</b> a ${escapeHtml(lead.name)} (${escapeHtml(lead.email)}).\nLlevaba ${env.FOLLOW_UP_AFTER_HOURS} h sin marcarse como contactado.`,
    );
  }
  return { checked: pending.length, sent };
}

export async function markContacted(id: string, token: string) {
  if (!verifyLeadToken(id, token)) throw new CustomError("Enlace no válido", 403);
  const lead = await LeadModel.findByIdAndUpdate(id, { status: "contactado" }, { new: true }).lean();
  if (!lead) throw new CustomError("No encontré esa solicitud", 404);
  return lead;
}

export async function listLeads(page = 1, status?: string) {
  const filter = status && LEAD_STATUS.includes(status as never) ? { status } : {};
  const perPage = 20;
  const [items, total] = await Promise.all([
    LeadModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * perPage).limit(perPage).lean(),
    LeadModel.countDocuments(filter),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function updateStatus(id: string, status: unknown) {
  if (!LEAD_STATUS.includes(status as never)) throw new CustomError("Estado no válido", 400);
  const lead = await LeadModel.findByIdAndUpdate(id, { status }, { new: true }).lean();
  if (!lead) throw new CustomError("No encontré esa solicitud", 404);
  return lead;
}
