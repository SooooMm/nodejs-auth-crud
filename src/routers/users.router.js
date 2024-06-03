import express from "express";
import { prisma } from "../utils/prisma.util.js";
import accessTokenMiddleware from "../middlewares/require-access-token.middleware.js";
import { HTTP_STATUS } from "../constants/http-status.constant.js";
import { MESSAGES } from "../constants/message.constant.js";

const router = express.Router();

const createResponse = (status, message, data) => {
  const response = {
    status,
    message
  };
  if (data) response.data = data;

  return response;
};

router.get("/me", accessTokenMiddleware, async (req, res, next) => {
  try {
    const { id } = req.user;
    const user = await prisma.users.findFirst({
      where: { id: +id },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        userInfos: {
          select: {
            name: true,
            role: true
          }
        }
      }
    });

    const { userInfos, ...rest } = user;
    const responseUserData = { ...rest, ...userInfos };

    return res
      .status(HTTP_STATUS.OK)
      .json(createResponse(HTTP_STATUS.OK, MESSAGES.USERS.READ_ME.SUCCEED, responseUserData));
  } catch (err) {
    next(err);
  }
});

export default router;
