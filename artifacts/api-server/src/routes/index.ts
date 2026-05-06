import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeRouter from "./analyze";
import communityRouter from "./community";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeRouter);
router.use(communityRouter);

export default router;
