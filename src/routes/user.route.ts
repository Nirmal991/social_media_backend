import { Router } from "express";
import { addBio, changePassword, getCurrentUser, getUserProfileData, loginUser, logoutUser, refreshAccessToken, registerUser, updateBio, updateProfileImage } from "../controllers";
import { upload, verifyJWT } from "../middlewares";

const router = Router();

router.post('/signup', upload.single("profileImage"), registerUser);
router.post('/login', loginUser)


router.post('/logout',verifyJWT ,logoutUser)
router.get('/getCurrentUser', verifyJWT, getCurrentUser)
router.post('/refreshToken', refreshAccessToken)
router.post('/changePassword',verifyJWT, changePassword)
router.post('/addBio',verifyJWT, addBio)
router.patch('/updateBio',verifyJWT, updateBio)
router.patch('/update-profile-image', verifyJWT,upload.single("profileImage"), updateProfileImage)
router.get('/get-user-profile-data/:username', verifyJWT ,getUserProfileData)

export default router;