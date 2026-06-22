import rateLimit from "express-rate-limit";

/**
 * Generic limiter factory
 */
const createLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      msg: message
    }
  });

/**
 * LOGIN LIMITERS
 */
export const teacherLoginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many login attempts. Try again after 15 minutes."
});

export const studentLoginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Try again later."
});

/**
 * SCAN LIMITER (STRICT)
 */
export const scanLimiter = createLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: "Too many scans. Please slow down."
});

