import { Router } from "express";
import { cronMiddleware } from "../middlewares/cron.middleware";
import * as leadController from "../controllers/lead.controller";

const router = Router();

router.use(cronMiddleware);
router.get("/lead-followups", leadController.followUps);

export default router;
