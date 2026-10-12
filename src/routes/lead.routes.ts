import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";
import * as leadController from "../controllers/lead.controller";

const router = Router();

router.post("/", leadController.create);
router.get("/:id/contacted", leadController.contacted);

router.use(authMiddleware, adminMiddleware);

router.get("/", leadController.list);
router.patch("/:id/status", leadController.updateStatus);

export default router;
