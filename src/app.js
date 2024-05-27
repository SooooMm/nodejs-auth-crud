import express from "express";
import cookieParser from "cookie-parser";
import {} from "./utils/prisma.util.js";
import dotenv from "dotenv";
import ErrorHandlingMiddleware from "./middlewares/error-handler.middleware.js";
import AuthRouter from "./routers/auth.router.js";

dotenv.config();

const app = express();
const PORT = 3018;

app.use(express.json());
app.use(cookieParser());
app.use("/api", [AuthRouter]);
app.use(ErrorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸어요!");
});
