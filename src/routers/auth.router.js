import express from "express";
import bcrypt from "bcrypt";
import { prisma } from "../utils/prisma.util.js";

const router = express.Router();

const createResponse = (status, message, data) => {
  const response = {
    status,
    message
  };
  if (data) response.data = data;

  return response;
};

const checkRequiredFields = (fields, body) => {
  for (const field of fields) {
    if (!body[field]) {
      return res.status(400).json(createResponse(400, `${field}을(를) 입력해주세요.`));
    }
  }
};

const validateEmail = (email) => {
  const pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i;
  if (!pattern.test(email)) {
    return res.status(400).json(createResponse(400, "이메일 형식이 올바르지 않습니다."));
  }
};

const validatePassword = (password, passwordConfirm) => {
  if (password.length < 6) {
    return "비밀번호는 6자리 이상이어야 합니다.";
  }
  if (password !== passwordConfirm) {
    return "입력한 두 비밀번호가 일치하지 않습니다.";
  }
};

router.post("/auth/sign-up", async (req, res, next) => {
  try {
    const { email, password, passwordConfirm, name } = req.body;

    checkRequiredFields(["email", "password", "passwordConfirm", "name"], req.body);
    validateEmail(email);

    const passwordValidationMessage = validatePassword(password, passwordConfirm);
    if (passwordValidationMessage) {
      return res.status(400).json({ message: passwordValidationMessage });
    }

    const isExistUser = await prisma.users.findFirst({
      where: {
        email
      }
    });

    if (isExistUser) {
      return res.status(409).json(createResponse(409, "이미 가입 된 사용자입니다."));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      data: {
        email,
        password: hashedPassword
      }
    });

    const userInfo = await prisma.userInfos.create({
      data: {
        userId: user.id, // 생성한 유저의 userId를 바탕으로 사용자 정보를 생성합니다.
        name
      }
    });

    delete userInfo.userId;
    return res.status(201).json(createResponse(201, "회원가입에 성공했습니다.", userInfo));
  } catch (error) {
    next(error);
  }
});

export default router;
