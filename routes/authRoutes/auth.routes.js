import express from "express";
import { authController } from "../../controller/index.js";

const router = express.Router()

const {registerUser} = authController

router.post('/register',registerUser)

export default router