import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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
      return `${field}을(를) 입력해주세요.`;
    }
  }
};

const validateEmail = (email) => {
  const pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i;
  if (!pattern.test(email)) {
    return "이메일 형식이 올바르지 않습니다.";
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

    const missingFieldMessage = checkRequiredFields(["email", "password", "passwordConfirm", "name"], req.body);
    if (missingFieldMessage) {
      return res.status(400).json({ message: missingFieldMessage });
    }

    const emailValidationMessage = validateEmail(email);
    if (emailValidationMessage) {
      return res.status(400).json({ message: missingFieldMessage });
    }

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
        userId: user.id,
        name
      }
    });

    delete userInfo.userId;
    return res.status(201).json(createResponse(201, "회원가입에 성공했습니다.", userInfo));
  } catch (error) {
    next(error);
  }
});

router.post("/auth/sign-in", async (req, res, next) => {
  const { email, password } = req.body;

  const missingFieldMessage = checkRequiredFields(["email", "password"], req.body);
  if (missingFieldMessage) {
    return res.status(400).json({ message: missingFieldMessage });
  }

  const emailValidationMessage = validateEmail(email);
  if (emailValidationMessage) {
    return res.status(400).json({ message: emailValidationMessage });
  }

  const user = await prisma.users.findFirst({
    where: { email }
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json(createResponse(401, "인증 정보가 유효하지 않습니다."));
  }

  const token = jwt.sign(
    {
      userId: user.id
    },
    process.env.SECRET_KEY,
    {
      expiresIn: "12h"
    }
  );

  req.header.authorization = `Bearer ${token}`;
  return res.status(200).json({
    message: "액세스 토큰이 발급 완료되었습니다.",
    Authorization: `Bearer ${token}`
  });
});

export default router;
