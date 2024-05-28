import express from "express";
import { prisma } from "../utils/prisma.util.js";
import accessTokenMiddleware from "../middlewares/require-access-token.middleware.js";

const router = express.Router();

const createResponse = (status, message, data) => {
  const response = {
    status,
    message
  };
  if (data) response.data = data;

  return response;
};

router.get("/users/me", accessTokenMiddleware, async (req, res, next) => {
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

    return res.status(200).json(createResponse(200, "사용자 정보 조회를 완료했습니다.", responseUserData));
  } catch (err) {
    next(err);
  }
});

export default router;
