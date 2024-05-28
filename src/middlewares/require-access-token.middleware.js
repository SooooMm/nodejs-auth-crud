import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma.util.js";

export default async function (req, res, next) {
  try {
    const { authorization } = req.headers;
    if (!authorization) throw new Error("인증 정보가 없습니다.");

    const [tokenType, token] = authorization.split(" ");
    if (tokenType !== "Bearer") throw new Error("지원하지 않는 인증 방식입니다.");

    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    const userId = decodedToken.userId;

    const user = await prisma.users.findFirst({
      where: { id: +userId }
    });

    if (!user) {
      throw new Error("인증 정보와 일치하는 사용자가 없습니다.");
    }

    req.user = user;
    console.log(req.user);
    next();
  } catch (error) {
    switch (error.name) {
      case "TokenExpiredError":
        return res.status(401).json({ message: "인증 정보가 만료되었습니다.”" });
      case "JsonWebTokenError":
        return res.status(401).json({ message: "인증 정보가 유효하지 않습니다." });
      default:
        return res.status(401).json({ message: error.message ?? "비정상적인 요청입니다." });
    }
  }
}
