import { Router } from "express";
import { registerUser } from "../controllers";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router.post('/signup', upload.single("profileImage"), registerUser);

export default router;