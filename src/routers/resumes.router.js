import express from "express";
import Joi from "joi";
import { prisma } from "../utils/prisma.util.js";
import accessTokenMiddleware from "../middlewares/require-access-token.middleware.js";
import requireRoles from "../middlewares/require-roles.middleware.js";
import ROLE from "../constants/user.constant.js";
import STATUS from "../constants/resume.constant.js";
import { Prisma } from "@prisma/client";

const router = express.Router();

const resumeFields = {
  title: Joi.string().label("제목"),
  summary: Joi.string().min(150).label("자기소개"),
  status: Joi.string()
    .valid(STATUS.APPLY, STATUS.DROP, STATUS.FINAL_PASS, STATUS.INTERVIEW1, STATUS.INTERVIEW2, STATUS.PASS)
    .label("지원 상태"),
  reason: Joi.string().label("사유")
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

const updateResumeSchema = Joi.object({
  status: resumeFields.title.required().messages({
    "any.required": "변경하고자 하는 지원 상태를 입력해 주세요.",
    "any.only": "유효하지 않은 지원 상태입니다."
  }),
  reason: resumeFields.reason.required().messages({
    "any.required": "지원 상태 변경 사유를 입력해 주세요."
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
        status: STATUS.APPLY
      }
    });

    return res.status(200).json(createResponse(201, "이력서 생성에 성공했습니다.", resume));
  } catch (err) {
    next(err);
  }
});

router.get("/resumes", accessTokenMiddleware, async (req, res, next) => {
  try {
    const { id, role } = req.user;
    const { sort, status } = req.query;

    let whereCondition = {
      userId: +id
    };
    if (role === ROLE.RECRUITER) whereCondition = {};
    if (status) whereCondition.status = status.toUpperCase();

    const resumes = await prisma.resumes.findMany({
      where: whereCondition,
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
    const { id: userId, role } = req.user;
    const { id } = req.params;

    let whereCondition = {
      id: +id,
      userId: +userId
    };
    if (role === ROLE.RECRUITER) delete whereCondition.userId;

    const resume = await prisma.resumes.findFirst({
      where: whereCondition,
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
    안;
    return res.status(200).json(createResponse(200, "이력서 삭제에 성공했습니다.", { id: deletedResumes.id }));
  } catch (err) {
    next(err);
  }
});

router.patch("/resumes/:id/status", accessTokenMiddleware, requireRoles([ROLE.RECRUITER]), async (req, res, next) => {
  try {
    const { id: UserId } = req.user;
    const { id } = req.params;

    const validation = await updateResumeSchema.validateAsync(req.body);
    const { status, reason } = validation;

    const resume = await prisma.resumes.findFirst({
      where: { id: +id }
    });
    if (!resume) return res.status(404).json({ message: "이력서가 존재하지 않습니다." });

    const [updatedResume, resumeHistory] = await prisma.$transaction(
      async (tx) => {
        const updatedResume = await tx.resumes.update({
          where: { id: resume.id },
          data: { status }
        });

        const resumeHistory = await tx.resumesHistories.create({
          data: {
            userId: resume.userId,
            resumeId: resume.id,
            oldValue: resume.status,
            newValue: updatedResume.status,
            reason: reason
          }
        });

        return [updatedResume, resumeHistory];
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
      }
    );

    res.status(200).json({
      message: "지원 상태가 성공적으로 변경되었습니다.",
      data: resumeHistory
    });
  } catch (error) {
    next(error);
  }
});

router.get("/resumes/:id/logs", accessTokenMiddleware, requireRoles([ROLE.RECRUITER]), async (req, res, next) => {
  try {
    const { id } = req.params;

    const resumeHistories = await prisma.resumesHistories.findMany({
      where: {
        resumeId: +id
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        resumeId: true,
        oldValue: true,
        newValue: true,
        reason: true,
        createdAt: true,
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

    const formattedResumes = resumeHistories.map((history) => ({
      id: history.id,
      name: history.user.userInfos.name,
      resumeId: history.resumeId,
      oldValue: history.oldValue,
      newValue: history.newValue,
      reason: history.reason,
      createdAt: history.createdAt
    }));

    res.status(200).json({
      message: "이력서 로그 목록 조회 완료되었습니다.",
      data: formattedResumes
    });
  } catch (error) {
    next(error);
  }
});

export default router;
