import { Router } from "express";
import { upload, verifyJWT } from "../middlewares";
import { createPost } from "../controllers";

const router = Router();

router.post('/create-post', upload.single("image"), verifyJWT, createPost);

export default router;