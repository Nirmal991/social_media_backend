import { verify } from "crypto";
import { Router } from "express";
import { verifyJWT } from "../middlewares";
import { getUserWhoLikePost, togglePostLike } from "../controllers/like.controller";

const router = Router();

router.post('/post/:postId/toggle-like', verifyJWT, togglePostLike)
router.get("/post/:postId",verifyJWT, getUserWhoLikePost)

export default router;