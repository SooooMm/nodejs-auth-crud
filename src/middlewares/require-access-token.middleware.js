import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma.util.js";
import { ACCESS_TOKEN_SECRET_KEY } from "../constants/env.constant.js";
import { HTTP_STATUS } from "../constants/http-status.constant.js";
import { MESSAGES } from "../constants/message.constant.js";

export default async function (req, res, next) {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: MESSAGES.AUTH.COMMON.JWT.NO_TOKEN
      });
    }

    const [tokenType, token] = authorization.split(" ");

    if (tokenType !== "Bearer") {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: MESSAGES.AUTH.COMMON.JWT.NOT_SUPPORTED_TYPE
      });
    }

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: MESSAGES.AUTH.COMMON.JWT.NO_TOKEN
      });
    }

    let payload;
    try {
      payload = jwt.verify(token, ACCESS_TOKEN_SECRET_KEY);
    } catch (error) {
      switch (error.name) {
        case "TokenExpiredError":
          return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            status: HTTP_STATUS.UNAUTHORIZED,
            message: MESSAGES.AUTH.COMMON.JWT.EXPIRED
          });
        default:
          return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            status: HTTP_STATUS.UNAUTHORIZED,
            message: MESSAGES.AUTH.COMMON.JWT.INVALID
          });
      }
    }

    const { id } = payload;
    const user = await prisma.users.findUnique({
      where: { id: +id },
      select: {
        id: true,
        userInfos: {
          select: {
            role: true
          }
        }
      }
      // omit: { password: true }
    });

    const formattedUser = {
      id: user.id,
      role: user.userInfos.role
    };

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: MESSAGES.AUTH.COMMON.JWT.NO_USER
      });
    }

    req.user = formattedUser;
    next();
  } catch (error) {
    next(error);
  }
}
