import express from "express";
import cookieParser from "cookie-parser";
import ErrorHandlingMiddleware from "./middlewares/error-handler.middleware.js";

const app = express();
const PORT = 3018;

app.use(express.json());
app.use(cookieParser());
app.use(ErrorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸어요!");
});
