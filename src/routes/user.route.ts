import { Router } from "express";
import { loginUser, registerUser } from "../controllers";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router.post('/signup', upload.single("profileImage"), registerUser);
router.post('/login', loginUser)

export default router;