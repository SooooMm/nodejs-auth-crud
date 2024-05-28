import express from "express";
import { prisma } from "../utils/prisma.util.js";
import accessTokenMiddleware from "../middlewares/require-access-token.middleware.js";
import Joi from "joi";

const router = express.Router();

const resumeFields = {
  title: Joi.string().label("제목"),
  summary: Joi.string().min(150).label("자기소개"),
  status: Joi.string().valid("APPLY", "DROP", "PASS", "INTERVIEW1", "INTERVIEW2", "FINAL_PASS").label("지원 상태")
};

const createResumeSchema = Joi.object({
  title: resumeFields.title.required().messages({
    "any.required": "제목을(를) 입력해 주세요."
  }),
  summary: resumeFields.summary.required().messages({
    "any.required": "자기소개을(를) 입력해 주세요.",
    "string.min": "자기소개는 150자 이상 작성해야 합니다."
  })
});

const createResponse = (status, message, data) => {
  const response = {
    status,
    message
  };
  if (data) response.data = data;

  return response;
};

var isEmpty = function (value) {
  if (
    value == "" ||
    value == null ||
    value == undefined ||
    (value != null && typeof value == "object" && !Object.keys(value).length)
  ) {
    return true;
  } else {
    return false;
  }
};

router.post("/resumes", accessTokenMiddleware, async (req, res, next) => {
  try {
    const { id } = req.user;
    const validation = await createResumeSchema.validateAsync(req.body);
    const { title, summary } = validation;

    const resume = await prisma.resumes.create({
      data: {
        userId: +id,
        title,
        summary,
        status: "APPLY"
      }
    });

    return res.status(200).json(createResponse(201, "이력서 생성에 성공했습니다.", resume));
  } catch (err) {
    next(err);
  }
});

router.get("/resumes", accessTokenMiddleware, async (req, res, next) => {
  try {
    const { id } = req.user;
    const { sort } = req.query;

    const resumes = await prisma.resumes.findMany({
      where: {
        userId: +id
      },
      orderBy: {
        createdAt: sort ? sort.toLowerCase() : "desc"
      },
      select: {
        id: true,
        title: true,
        summary: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          include: {
            userInfos: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    const formattedResumes = resumes.map((resume) => ({
      id: resume.id,
      name: resume.user.userInfos.name,
      title: resume.title,
      summary: resume.summary,
      status: resume.status,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt
    }));

    return res.status(200).json(createResponse(200, "이력서 목록 조회에 성공했습니다.", formattedResumes));
  } catch (err) {
    next(err);
  }
});

router.get("/resumes/:id", accessTokenMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const resume = await prisma.resumes.findFirst({
      where: {
        id: +id,
        userId: +userId
      },
      select: {
        id: true,
        title: true,
        summary: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          include: {
            userInfos: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!resume) return res.status(404).json({ message: "이력서가 존재하지 않습니다." });

    const formattedResume = {
      id: resume.id,
      name: resume.user.userInfos.name,
      title: resume.title,
      summary: resume.summary,
      status: resume.status,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt
    };

    return res.status(200).json(createResponse(200, "이력서 세부 조회에 성공했습니다.", formattedResume));
  } catch (err) {
    next(err);
  }
});

router.patch("/resumes/:id", accessTokenMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updatedData = req.body;
    const { title, summary } = updatedData;

    if (isEmpty(updatedData) || (!isEmpty(updatedData) && !title && !summary))
      return res.status(400).json({ message: "수정 할 정보를 입력해 주세요." });

    const resume = await prisma.resumes.findFirst({
      where: {
        id: +id,
        userId: +userId
      }
    });
    if (!resume) return res.status(404).json({ message: "이력서가 존재하지 않습니다." });

    const updatedResume = await prisma.resumes.update({
      data: {
        ...updatedData
      },
      where: {
        id: +id,
        userId: +userId
      }
    });

    return res.status(200).json(createResponse(200, "이력서 수정에 성공했습니다.", updatedResume));
  } catch (err) {
    next(err);
  }
});

router.delete("/resumes/:id", accessTokenMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const resume = await prisma.resumes.findFirst({
      where: {
        id: +id,
        userId: +userId
      }
    });
    if (!resume) return res.status(404).json({ message: "이력서가 존재하지 않습니다." });

    const deletedResumes = await prisma.resumes.delete({
      where: {
        id: +id,
        userId: +userId
      }
    });

    return res.status(200).json(createResponse(200, "이력서 삭제에 성공했습니다.", { id: deletedResumes.id }));
  } catch (err) {
    next(err);
  }
});

export default router;
