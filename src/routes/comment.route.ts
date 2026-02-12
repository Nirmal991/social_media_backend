import Router from 'express';
import { verifyJWT } from '../middlewares';
import { createComment, deleteComment, getCommentByPostId } from '../controllers';

const router = Router();
router.post('/create-comment/:postId', verifyJWT, createComment);
router.get('/get-comment-post/:postId', verifyJWT, getCommentByPostId)
router.delete("/delete-comment/post/:postId/comment/:commentId", verifyJWT, deleteComment)

export default router;