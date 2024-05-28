export default function (allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "접근 권한이 없습니다." });
    }

    next();
  };
}
