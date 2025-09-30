import express from "express";
import { authController } from "../../controller/index.js";
import { rateLimiter } from "../../middlewares/rateLimiter.js";
import { authenticateJWT } from "../../middlewares/authenticateJWT.js";
import { requestPasswordReset, resetPasswordWithOtp } from "../../controller/authControllers/auth.controller.js";

const router = express.Router()


// router.post('/register', rateLimiter, register)
router.post('/login', rateLimiter, authController.login)
router.post('/refresh-token', rateLimiter, authenticateJWT, authController.refreshTokenRotation)
// router.post('/reset-password', authenticateJWT, authController.resetPassword)

router.post("/request-reset", requestPasswordReset);
router.post("/reset-password-otp", resetPasswordWithOtp);

export default router