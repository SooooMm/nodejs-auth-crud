import { HTTP_STATUS } from "../constants/http-status.constant.js";

export default function (err, req, res, next) {
  if (err.name === "ValidationError") {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      status: HTTP_STATUS.BAD_REQUEST,
      message: err.message
    });
  }
  console.log(err);

  // 그 밖의 예상치 못한 에러 처리
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: "예상치 못한 에러가 발생했습니다. 관리자에게 문의해 주세요."
  });
}
