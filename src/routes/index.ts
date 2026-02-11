import { Router } from "express";
import userRouter from './user.route';
import postRouter from './post.route';

const $ = Router();

// $.use(data);

$.use('/api/auth', userRouter);
$.use('/api/post',  postRouter);

export default $;
