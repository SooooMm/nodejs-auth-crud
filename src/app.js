import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import "./utils/prisma.util.js";
import ErrorHandlingMiddleware from "./middlewares/error-handler.middleware.js";
import AuthRouter from "./routers/auth.router.js";
import UserRouter from "./routers/users.router.js";
import ResumeRouter from "./routers/resumes.router.js";

dotenv.config();

const app = express();
const PORT = 3018;

app.use(express.json());
app.use(cookieParser());
app.use("/api", [AuthRouter, UserRouter, ResumeRouter]);
app.use(ErrorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸어요!");
});
