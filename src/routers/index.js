import express from "express";
import authRouter from "./auth.router.js";
import userRouter from "./users.router.js";
import resumeRouter from "./resumes.router.js";

const apiRouter = express.Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/resumes", resumeRouter);

export { apiRouter };
