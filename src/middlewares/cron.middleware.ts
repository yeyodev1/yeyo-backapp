import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

/** Vercel Cron manda `Authorization: Bearer <CRON_SECRET>`. Sin secreto configurado, la ruta queda cerrada. */
export function cronMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!env.CRON_SECRET || req.headers.authorization !== `Bearer ${env.CRON_SECRET}`) {
    res.status(401).json({ message: "No autorizado" });
    return;
  }
  next();
}
