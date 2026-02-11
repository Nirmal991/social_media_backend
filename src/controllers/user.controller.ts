import { ApiError, asyncHandler, signUpSchema, uploadOnCloudinary, ApiResponse, loginSchema, REFRESH_TOKEN_SECRET, removeFromCloudnary } from "../lib"
import { AccessTokenPayload, AuthRequest, verifyJWT } from "../middlewares";
import { User } from "../models";
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { Request } from "express";

const generateAccessAndRefreshToken = async (userId: string) => {

    try {
        const user = await User.findById(userId)

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user?.generateAccessToken();
        const refreshToken = user?.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

export const registerUser = asyncHandler(async (req, res) => {

    const { error, value } = signUpSchema.validate(req.body, {
        abortEarly: false,
    })

    if (error) {
        throw new ApiError(400, 'Validation Error', error.details.map((err) => err.message))
    }

    const { username, email, password } = value;
    try {
        const existingUser = await User.findOne({
            $or: [{ username, email }],
        });

        if (existingUser) {
            throw new ApiError(409, "User eith this email and username already exist")
        }

        let profileImageURL
        let profileImageLocalPath;
        if (req.file?.path) {
            profileImageLocalPath = req.file?.path;
            const cloudinaryResult = await uploadOnCloudinary(profileImageLocalPath);
            if (cloudinaryResult?.url) {
                profileImageURL = cloudinaryResult.url;
            }
        }

        let user;
        if (profileImageURL) {
            user = await User.create({
                username,
                email,
                password,
                profileImage: profileImageURL,
            });
        } else {
            user = await User.create({
                username,
                email,
                password,
            });
        }

        const createdUser = await User.findOne({
            $or: [{ username, email }]
        })

        if (!createdUser) {
            throw new ApiError(500, "Something went wroung while creating rhe user")
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(createdUser._id)

        createdUser.refreshToken = refreshToken;
        await createdUser.save({ validateBeforeSave: false });

        const loggedInUser = await User.findById(createdUser._id).select(
            "-password -refreshToken"
        )

        const cookiesOptions = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(201)
            .cookie("accessToken", accessToken, cookiesOptions)
            .cookie("refreshToken", refreshToken, cookiesOptions)
            .json(
                new ApiResponse(201, {
                    success: true,
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                }, "user Register Successfully")
            )
    } catch (error) {
        console.error("Error: ", error);

        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                errors: error.errors,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            errors: [],
        });
    }
})

export const loginUser = asyncHandler(async (req, res) => {
    const { error, value } = loginSchema.validate(req.body, {
        abortEarly: false,
    });

    if (error) {
        throw new ApiError(400, "Validation Error", error.details.map((err) => err.message))
    }

    const { username, email, password } = value;

    try {
        const user = await User.findOne({
            $or: [{ username }, { email }],
        })

        if (!user) {
            throw new ApiError(404, "User not found!!")
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid credentails")
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

        user.refreshToken = refreshToken;
        user.save({ validateBeforeSave: false });

        const loggedInUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );

        const cookiesOptions = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, cookiesOptions)
            .cookie("refreshToken", refreshToken, cookiesOptions)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser,
                        accessToken,
                        refreshToken,
                    },
                    "user loggedin successfully"
                )
            );
    } catch (error) {
        console.error("Error: ", error);

        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                errors: error.errors,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            errors: [],
        });
    }
})

export const logoutUser = asyncHandler(async (req: AuthRequest, res) => {

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
})

export const getCurrentUser = asyncHandler(async (req: AuthRequest, res) => {
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "User fetched successfully"
        ))
})

export const refreshAccessToken = asyncHandler(async (req: AuthRequest, res) => {
    try {
        const incomingRefreshTOken =
            req.cookies?.refreshToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!incomingRefreshTOken) {
            throw new ApiError(401, "unauthorized request");
        }

        const decodedToken = jwt.verify(
            incomingRefreshTOken,
            REFRESH_TOKEN_SECRET
        ) as AccessTokenPayload;

        const userId = decodedToken?._id;

        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(401, "invalid refresh token");
        }

        if (incomingRefreshTOken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token invalid or expired");
        }

        const newRefreshToken = user.generateRefreshToken();
        const newAccessToken = user.generateAccessToken();

        user.refreshToken = newRefreshToken;
        user.save({ validateBeforeSave: false });

        const cookieOptions = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(201)
            .cookie("refreshToken", newRefreshToken, cookieOptions)
            .cookie("accessToken", newAccessToken, cookieOptions)
            .json(
                new ApiResponse(
                    201,
                    {
                        refreshToken: newRefreshToken,
                        accessToken: newAccessToken,
                    },
                    "refresh token successfully created"
                )
            );
    } catch (error: unknown) {
        console.error("Error: ", error);

        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                errors: error.errors,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            errors: [],
        });
    }
});

export const changePassword = asyncHandler(
    async (req: AuthRequest, res) => {
        try {
            const { oldPassword, newPassword, confirmNewPassword } = req.body;

            if (newPassword !== confirmNewPassword) {
                throw new ApiError(
                    400,
                    "new password and confirm new password do not match"
                );
            }

            const userId = req.user?._id;
            const user = await User.findById(userId);

            if (!user) {
                throw new ApiError(401, "unauthorized request");
            }

            const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);

            if (!isOldPasswordCorrect) {
                throw new ApiError(401, "Your old password is not correct");
            }

            user.password = confirmNewPassword;
            user.save({ validateBeforeSave: false });

            return res
                .status(200)
                .json(new ApiResponse(200, null, "password successfully changed"));
        } catch (error: unknown) {
            console.error("Error: ", error);

            if (error instanceof ApiError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                    errors: error.errors,
                });
            }

            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                errors: [],
            });
        }
    }
);


export const addBio = asyncHandler(async (req: AuthRequest, res) => {
    const { bio } = req.body;

    if (!bio || bio == "") {
        throw new ApiError(401, "Bio cannot be empty");
    }

    try {
        const user = await User.findById(req.user?._id);

        if (!user) {
            throw new ApiError(401, "user not found")
        }

        user.bio = bio.trim();
        await user.save({ validateBeforeSave: false });

        return res
            .status(201)
            .json(new ApiResponse(201, null, "bio added successfully"));
    } catch (error) {
        console.error("Error: ", error);

        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                errors: error.errors,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            errors: [],
        });
    }
})

export const updateBio = asyncHandler(async (req: AuthRequest, res) => {
    try {
        const { updatedBio } = req.body;

        if (!updatedBio || updatedBio === "") {
            throw new ApiError(400, "Bio cannot be empty")
        }

        const user = await User.findByIdAndUpdate(req.user?._id, {
            $set: { bio: updatedBio }
        },
            { new: true })

        return res
            .status(200)
            .json(new ApiResponse(200, null, "bio updated successfull"));
    } catch (error) {

        console.error("Error: ", error);

        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                errors: error.errors,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            errors: [],
        });
    }
})

export const updateProfileImage = asyncHandler(async (req: AuthRequest, res) => {
    let profileImagePath = req.file?.path;
    if (!profileImagePath) {
        throw new ApiError(400, "Profile Image not found");
    }

    try {
        const user = await User.findById(req.user?._id)
        if (!user) {
            fs.unlinkSync(profileImagePath);
            throw new ApiError(404, "user not found");
        }

        if (!user.profileImage) {
            const profileImage = await uploadOnCloudinary(profileImagePath);
            user.profileImage = profileImage?.url;
            user.save({ validateBeforeSave: false })
            return res.status(201).json(new ApiResponse(201, null, "Profile Image Added Successfully"))
        } else {
            const oldProfileImage = user.profileImage;
            await removeFromCloudnary(oldProfileImage);
            const newProfileImage = await uploadOnCloudinary(profileImagePath);
            user.profileImage = newProfileImage?.url;
            user.save({ validateBeforeSave: false })
            return res.status(201).json(new ApiResponse(201, null, "Profile Image Updated Successfully"))
        }
    } catch (error) {
        console.error("Error: ", error);

        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                errors: error.errors,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            errors: [],
        });
    }
})

export const getUserProfileData = asyncHandler(async (req: AuthRequest, res) => {
    const { username } = req.params;
    const loggedInUserId = req.user?._id;

    if (!username) {
        throw new ApiError(400, "username not found");
    }

    try {
        const profileData = await User.aggregate([
            {
                $match: {
                    username: username,
                },
            },
            {
                $lookup: {
                    from: "posts",
                    localField: "_id",
                    foreignField: "owner",
                    as: "posts",
                }
            },
            {
                $addFields: {
                    postCount: { $size: "$posts" },
                    followersCount: { $size: "$followers" },
                    followingCount: { $size: "$following" },
                    isFollowing: loggedInUserId ? { $in: [loggedInUserId, "$followers"] } : false
                },
            },
            {
                $project: {
                    username: 1,
                    email: 1,
                    bio: 1,
                    profileImage: 1,
                    postCount: 1,
                    followersCount: 1,
                    followingCount: 1,
                    isFollowing: 1,
                },
            },
        ])

        if (!profileData.length) {
            throw new ApiError(404, "user not found");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, profileData[0], "user data fetched successfully")
            );
    } catch (error) {
        console.error("Error: ", error);

        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                errors: error.errors,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            errors: [],
        });
    }
})

export const followUser = asyncHandler(async (req: AuthRequest, res) => {
    const loggedInUserId = req.user?._id
    const { username } = req.params;

    if (!loggedInUserId) {
        throw new ApiError(400, "Login Fisrt")
    }

    try {
        const userToFollowed = await User.findOne({ username });

        if (!userToFollowed) {
            throw new ApiError(400, "User Not Found")
        }

        if (userToFollowed?._id.equals(loggedInUserId)) {
            throw new ApiError(400, "you cannot follow yourself");
        }

        await User.findByIdAndUpdate(userToFollowed._id,
            {
                $addToSet: {
                    followers: loggedInUserId,
                }
            }
        );
        await User.findByIdAndUpdate(
            loggedInUserId,
            {
                $addToSet: {
                    following: userToFollowed._id,
                },
            }
        );

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    null,
                    `you are following ${userToFollowed.username} now`
                )
            );
    } catch (error) {
        console.error("Error: ", error);

        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                errors: error.errors,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            errors: [],
        });
    }
})

export const UnfollowUser = asyncHandler(async (req: AuthRequest, res) => {
    const { username } = req.params;
    const loggedInUser = req.user?._id;

    if (!loggedInUser) {
        throw new ApiError(400, "logged in user id not found");
    }

    try {
        const userToUnfollow = await User.findOne({ username });
        if (!userToUnfollow) {
            throw new ApiError(400, "user not found")
        }

        if (userToUnfollow._id.equals(loggedInUser)) {
            throw new ApiError(400, "you cannot unfollow yourself");
        }

        await User.findByIdAndUpdate(userToUnfollow._id, {
            $pull: {
                followers: loggedInUser
            }
        })

        await User.findByIdAndUpdate(loggedInUser, {
            $pull: {
                following: userToUnfollow._id,
            }
        })

        return res.status(200)
        .json(new ApiResponse(200, null, `you unfollow ${userToUnfollow.username}`))
    } catch (error) {
        console.error("Error: ", error);

        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                errors: error.errors,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            errors: [],
        });
    }
})

// export const toggleFollowUser = asyncHandler(
//   async (req: AuthRequest, res) => {
//     const currentUserId = req.user?._id;
//     const { targetUserId } = req.params;

//     if (!currentUserId) {
//       throw new ApiError(401, "Unauthorized");
//     }

//     if (currentUserId.toString() === targetUserId) {
//       throw new ApiError(400, "You cannot follow yourself");
//     }

//     const currentUser = await User.findById(currentUserId);
//     const targetUser = await User.findById(targetUserId);

//     if (!currentUser || !targetUser) {
//       throw new ApiError(404, "User not found");
//     }

//     const isFollowing = currentUser.following.includes(targetUser._id);

//     if (isFollowing) {
//      
//       currentUser.following.pull(targetUser._id);
//       targetUser.followers.pull(currentUser._id);

//       await currentUser.save();
//       await targetUser.save();

//       return res
//         .status(200)
//         .json(new ApiResponse(200, null, "User unfollowed"));
//     } else {
//       // 🔺 FOLLOW
//       currentUser.following.push(targetUser._id);
//       targetUser.followers.push(currentUser._id);

//       await currentUser.save();
//       await targetUser.save();

//       return res
//         .status(200)
//         .json(new ApiResponse(200, null, "User followed"));
//     }
//   }
// );

