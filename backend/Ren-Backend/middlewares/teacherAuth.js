import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET;

export const teacherAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ msg: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const user = jwt.verify(token, jwtSecret);

    if (!user.role) {
      return res.status(403).json({ msg: "Role missing in token" });
    }

    req.user = user;
    next();

  } catch (err) {
    console.error("JWT error:", err.message);
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
};

