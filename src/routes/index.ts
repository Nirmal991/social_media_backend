import { Router } from "express";
import userRouter from './user.route';
import postRouter from './post.route';
import commentRouter from './comment.route';
import likeRouter from './like.route';

const $ = Router();

// $.use(data);

$.use('/api/auth', userRouter);
$.use('/api/post',  postRouter);
$.use('/api/comment', commentRouter)
$.use('/api/likes',likeRouter)

export default $;
