import { Request, Response, NextFunction } from "express";
import * as leadService from "../services/lead.service";

const clientIp = (req: Request) =>
  String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0]!.trim();

/** POST /api/leads — formulario público de los tres mundos. */
export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await leadService.createLead(req.body || {}, clientIp(req)));
  } catch (error) {
    next(error);
  }
}

/** GET /api/leads/:id/contacted?token= — botón de Telegram. Responde HTML porque se abre en el navegador. */
export async function contacted(req: Request, res: Response, next: NextFunction) {
  try {
    const lead = await leadService.markContacted(String(req.params.id), String(req.query.token || ""));
    res
      .type("html")
      .send(
        `<body style="font-family:Arial;display:grid;place-items:center;height:100vh;background:#ffe14d;margin:0"><div style="text-align:center"><h1>✅ Listo</h1><p>${lead.name} quedó como contactado. No le llegará el correo de seguimiento.</p></div></body>`,
      );
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await leadService.listLeads(Number(req.query.page) || 1, req.query.status as string | undefined));
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await leadService.updateStatus(String(req.params.id), req.body?.status));
  } catch (error) {
    next(error);
  }
}

/** GET /api/cron/lead-followups — lo llama Vercel Cron con Bearer CRON_SECRET. */
export async function followUps(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await leadService.sendFollowUps());
  } catch (error) {
    next(error);
  }
}
