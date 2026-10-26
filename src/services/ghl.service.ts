import { env } from "../config/env";
import { label, needsList } from "../constants/lead.labels";
import type { Lead } from "../models/lead.model";

/** Ecuador por defecto: 09xxxxxxxx → +5939xxxxxxxx. Lo que ya trae código de país se respeta. */
function toE164(phone: string) {
  const d = phone.replace(/[^\d+]/g, "");
  if (/^\+\d{8,15}$/.test(d)) return d;
  if (/^0\d{9}$/.test(d)) return `+593${d.slice(1)}`;
  if (/^593\d{9}$/.test(d)) return `+${d}`;
  return "";
}

/**
 * Manda la solicitud al GoHighLevel de Bakano por el mismo webhook y con el mismo payload que la
 * landing web.bakano.ec, así cae en su workflow (contacto + nota + oportunidad). No pasa por el
 * /api/lead de la landing para no reportarle a Meta CAPI una conversión que no vino de esa web.
 * Nunca lanza: si GHL falla, la solicitud ya quedó en Mongo, Telegram y correo.
 */
export async function sendLeadToGhl(lead: Lead) {
  if (!env.GHL_WEBHOOK_URL) return false;
  const [nombre = "", ...resto] = lead.name.trim().split(/\s+/);
  const needs = lead.needs || [];
  // Las ramas del workflow solo conocen web y tienda; lo demás crea contacto y nota sin oportunidad.
  const interes = needs.includes("tienda") ? "tienda" : needs.includes("web") ? "web" : needs[0] || "";
  const plan = interes === "tienda" ? "Tienda Online + PayPhone" : interes === "web" ? "Pagina Web Pro" : "Solo informacion";
  const event_id = `yeyodev_${String(lead._id)}`;
  const negocio = [lead.company, lead.businessType].filter(Boolean).join(" — ");
  const notas = [
    "🧾 Lead formulario yeyo.dev",
    "📝 Entra a GHL por la misma vía que la landing web.bakano.ec, pero NO llenó la landing: llegó por el formulario de yeyo.dev. No se reportó a Meta CAPI.",
    `🎯 Necesita: ${needsList(lead, "es").join(", ") || "—"}`,
    `💰 Presupuesto: ${lead.budget ? label("es", "budget", lead.budget) : "—"}`,
    `⏱ Para cuándo: ${lead.timeline ? label("es", "timeline", lead.timeline) : "—"}`,
    `🏪 Negocio: ${negocio || "—"}`,
    `✉️ Email: ${lead.email}`,
    `📝 Lo que cuenta: ${lead.description}`,
    `🌐 Versión del portafolio: ${lead.source || "web"}`,
    `🆔 Event ID: ${event_id}`,
  ].join("\n");

  try {
    const res = await fetch(env.GHL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        etapa: "reconstruccion_lead",
        event_id,
        nombre,
        apellido: resto.join(" "),
        full_name: lead.name.trim(),
        telefono: toE164(lead.whatsapp || ""),
        email: lead.email,
        negocio,
        interes,
        plan_nombre: plan,
        valor: interes === "tienda" ? "600" : interes === "web" ? "500" : "",
        inversion_confirmada: "si",
        origen: "formulario-yeyo.dev",
        origen_url: env.FRONTEND_URL,
        tags: "formulario-yeyo-dev,lead-caliente",
        notas,
      }),
    });
    if (!res.ok) console.error("GHL rechazó el lead:", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("GHL no respondió:", e);
    return false;
  }
}
