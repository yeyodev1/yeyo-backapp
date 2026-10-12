import type { Lead } from "../models/lead.model";

type Lang = "es" | "en";

/** Textos legibles para los valores que guarda el formulario. */
export const LABELS: Record<Lang, Record<string, Record<string, string>>> = {
  es: {
    needs: {
      app: "App o sistema a medida",
      automatizacion: "Automatización de procesos",
      web: "Página web",
      tienda: "Tienda online",
      dashboard: "Dashboard / reportes",
      ia: "Inteligencia artificial / chatbot",
      integracion: "Integrar sistemas (facturación, CRM, WhatsApp)",
      otro: "Otra cosa",
    },
    budget: {
      "800-1.5k": "$800 – $1.500",
      "1.5k-3k": "$1.500 – $3.000",
      "3k-8k": "$3.000 – $8.000",
      "8k-mas": "Más de $8.000",
    },
    timeline: {
      urgente: "Urgente (esta semana)",
      "1-mes": "Dentro de un mes",
      "1-3-meses": "En 1 a 3 meses",
      explorando: "Solo estoy explorando",
    },
  },
  en: {
    needs: {
      app: "Custom app or system",
      automatizacion: "Process automation",
      web: "Website",
      tienda: "Online store",
      dashboard: "Dashboard / reports",
      ia: "AI / chatbot",
      integracion: "Connect systems (billing, CRM, WhatsApp)",
      otro: "Something else",
    },
    budget: {
      "800-1.5k": "$800 – $1,500",
      "1.5k-3k": "$1,500 – $3,000",
      "3k-8k": "$3,000 – $8,000",
      "8k-mas": "$8,000+",
    },
    timeline: {
      urgente: "Urgent (this week)",
      "1-mes": "Within a month",
      "1-3-meses": "In 1–3 months",
      explorando: "Just exploring",
    },
  },
};

export const label = (lang: Lang, group: "needs" | "budget" | "timeline", value: string) =>
  LABELS[lang][group]?.[value] || value;

export const needsList = (lead: Pick<Lead, "needs" | "lang">, lang: Lang = lead.lang as Lang) =>
  (lead.needs || []).map((n) => label(lang, "needs", n));
