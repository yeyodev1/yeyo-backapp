import { Schema, model, InferSchemaType } from "mongoose";

export const NEEDS = ["app", "automatizacion", "web", "tienda", "dashboard", "ia", "integracion", "otro"] as const;
// Proyectos desde $500 USD (algo muy básico); no hay opción por debajo de eso.
export const MIN_BUDGET_USD = 500;
export const BUDGETS = ["500-1.5k", "1.5k-3k", "3k-8k", "8k-mas"] as const;
// Rangos que ya no se ofrecen pero existen en solicitudes guardadas.
const LEGACY_BUDGETS = ["800-1.5k"];
export const TIMELINES = ["urgente", "1-mes", "1-3-meses", "explorando"] as const;
export const LEAD_STATUS = ["nuevo", "contactado", "cerrado", "descartado"] as const;

const leadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    whatsapp: { type: String, trim: true, maxlength: 40, default: "" },
    company: { type: String, trim: true, maxlength: 140, default: "" },
    businessType: { type: String, trim: true, maxlength: 140, default: "" },
    needs: [{ type: String, enum: NEEDS }],
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    budget: { type: String, enum: [...BUDGETS, ...LEGACY_BUDGETS, ""], default: "" },
    timeline: { type: String, enum: [...TIMELINES, ""], default: "" },
    // De qué versión del portafolio llegó (clasica, muro, mundo).
    source: { type: String, trim: true, maxlength: 40, default: "web" },
    lang: { type: String, enum: ["es", "en"], default: "es" },
    status: { type: String, enum: LEAD_STATUS, default: "nuevo", index: true },
    notifiedTelegram: { type: Boolean, default: false },
    confirmationSent: { type: Boolean, default: false },
    followUpSentAt: { type: Date, default: null },
    ip: { type: String, default: "" },
  },
  { timestamps: true },
);

export type Lead = InferSchemaType<typeof leadSchema> & { _id: unknown; createdAt: Date };
export const LeadModel = model("Lead", leadSchema);
