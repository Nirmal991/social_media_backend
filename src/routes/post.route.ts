import { Router } from "express";
import { upload, verifyJWT } from "../middlewares";
import { createPost, getAllPostForHomePage, getUserPosts } from "../controllers";

const router = Router();

router.post('/create-post', upload.single("image"), verifyJWT, createPost);
router.get('/get-all-post', verifyJWT, getAllPostForHomePage)
router.get('/get-post/:username', verifyJWT, getUserPosts)

export default router;