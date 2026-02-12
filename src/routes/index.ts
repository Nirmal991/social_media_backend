import { Router } from "express";
import userRouter from './user.route';
import postRouter from './post.route';
import commentRouter from './comment.route';

const $ = Router();

// $.use(data);

$.use('/api/auth', userRouter);
$.use('/api/post',  postRouter);
$.use('/api/comment', commentRouter)

export default $;
