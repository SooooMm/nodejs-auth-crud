import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma.util.js";
import { HTTP_STATUS } from "../constants/http-status.constant.js";
import { MESSAGES } from "../constants/message.constant.js";
import { HASH_SALT_ROUNDS } from "../constants/auth.constant.js";
import { ACCESS_TOKEN_SECRET_KEY, ACCESS_TOKEN_EXPIRES_IN } from "../constants/env.constant.js";
import { signUpValidator } from "../middlewares/validators/sign-up-validator.middleware.js";
import { signInValidator } from "../middlewares/validators/sign-in-validator.middleware.js";

const router = express.Router();

const createResponse = (status, message, data) => {
  const response = {
    status,
    message
  };
  if (data) response.data = data;

  return response;
};

router.post("/sign-up", signUpValidator, async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    const isExistUser = await prisma.users.findFirst({
      where: {
        email
      }
    });

    if (isExistUser) {
      return res
        .status(HTTP_STATUS.CONFLICT)
        .json(createResponse(HTTP_STATUS.CONFLICT, MESSAGES.AUTH.COMMON.EMAIL.DUPLICATED));
    }

    const hashedPassword = await bcrypt.hash(password, HASH_SALT_ROUNDS);
    const user = await prisma.users.create({
      data: {
        email,
        password: hashedPassword
      }
    });

    const userInfo = await prisma.userInfos.create({
      data: {
        userId: user.id,
        name
      }
    });
    delete userInfo.userId;
    return res.status(HTTP_STATUS.CREATED).json(createResponse(201, MESSAGES.AUTH.SIGN_UP.SECCEED, userInfo));
  } catch (error) {
    next(error);
  }
});

router.post("/sign-in", signInValidator, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.users.findFirst({
      where: { email }
    });

    const isPasswordMatched = user && bcrypt.compareSync(password, user.password);
    if (!isPasswordMatched) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(createResponse(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH.UNAUTHORIZED));
    }

    const payload = { id: user.id };
    const token = jwt.sign(payload, ACCESS_TOKEN_SECRET_KEY, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN
    });

    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.AUTH.SIGN_IN.SECCEED,
      data: {
        token
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
