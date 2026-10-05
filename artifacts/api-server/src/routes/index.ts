import { Router, type IRouter } from "express";
import { PRIVACY_POLICY } from "../lib/privacy-policy";
import healthRouter from "./health";
import analyzeRouter from "./analyze";
import communityRouter from "./community";

const router: IRouter = Router();

router.get("/privacy", (_req, res) => {
  res.type("text/plain").send(PRIVACY_POLICY);
});
router.use(healthRouter);
router.use(analyzeRouter);
router.use(communityRouter);

export default router;
