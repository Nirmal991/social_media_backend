import { Router } from "express";
import userRouter from './user.route';

const $ = Router();

// $.use(data);

$.use('/api/auth', userRouter);

export default $;
