import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { analysisRateLimit } from "./lib/analysis-admission";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.disable("x-powered-by");
app.use("/api/analyze", analysisRateLimit);
app.use(express.json({ limit: "3mb", verify(req, res, buffer) {
  if ((req as Request).originalUrl.split("?")[0] === "/api/analyze") {
    (res as Response).locals.rawAnalysisBody = buffer.toString("utf8");
  }
} }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
