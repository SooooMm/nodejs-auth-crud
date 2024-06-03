import express from "express";
import cookieParser from "cookie-parser";
import { SERVER_PORT } from "./constants/env.constant.js";
import { HTTP_STATUS } from "./constants/http-status.constant.js";
import "./utils/prisma.util.js";
import ErrorHandlingMiddleware from "./middlewares/error-handler.middleware.js";
import { apiRouter } from "./routers/index.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", apiRouter);

app.get("/health-check", (req, res) => {
  return res.status(HTTP_STATUS.OK).send("ok");
});

app.use(ErrorHandlingMiddleware);

app.listen(SERVER_PORT, () => {
  console.log(`${SERVER_PORT}번 포트에서 실행중입니다.`);
});
