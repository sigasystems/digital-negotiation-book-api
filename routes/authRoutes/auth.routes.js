import express from "express";
import { authController } from "../../controller/index.js";
import { rateLimiter } from "../../middlewares/rateLimiter.js";
import { authenticateJWT } from "../../middlewares/authenticateJWT.js";

const router = express.Router()

const {register, login, refreshTokenRotation} = authController

router.post('/register', rateLimiter, register)
router.post('/login', rateLimiter, login)
router.post('/refresh-token', rateLimiter, authenticateJWT, refreshTokenRotation)

export default router