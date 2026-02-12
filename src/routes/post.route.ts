import { Router } from "express";
import { upload, verifyJWT } from "../middlewares";
import { createPost, deletePost, getAllPostForHomePage, getUserPosts, updatePost } from "../controllers";

const router = Router();

router.post('/create-post', upload.single("image"), verifyJWT, createPost);
router.get('/get-all-post', verifyJWT, getAllPostForHomePage)
router.get('/get-post/:username', verifyJWT, getUserPosts)
router.patch('/update-post/:postId', verifyJWT, updatePost)
router.delete('/delete-post/:postId', verifyJWT, deletePost)

export default router;