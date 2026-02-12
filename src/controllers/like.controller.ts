import { ApiError, ApiResponse, asyncHandler } from "../lib";
import { AuthRequest } from "../middlewares";
import { Post } from "../models";
import mongoose from 'mongoose';

export const togglePostLike = asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user?._id;
    if (!userId) {

    }
    const { postId } = req.params;
    if (!postId) {

    }

    try {
        const post = await Post.findById(postId);
        if (!post) {
            throw new ApiError(404, "post not found");
        }

        const isLiked = post.likes.includes(userId);

        if (isLiked) {
            await Post.findByIdAndUpdate(postId, {
                $pull: { likes: userId }
            })

            return res
                .status(201)
                .json(new ApiResponse(201, null, "you unliked the post"))
        } else {
            await Post.findByIdAndUpdate(postId, {
                $addToSet: { likes: userId }
            })
            return res
                .status(201)
                .json(new ApiResponse(201, null, "you liked the post"))
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

export const getUserWhoLikePost = asyncHandler(async (req: AuthRequest, res) => {

    const userId = req.user?._id

    const { postId } = req.params

    if (!postId) {

    }

    try {
        const result = await Post.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(postId),
                },
            },
            {
                $addFields: {
                    likes: { $ifNull: ["$likes", []] },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "likes",
                    foreignField: "_id",
                    as: "likedUsers",
                },
            },
            {
                $project: {
                    _id: 0,
                    likedUsers: {
                        $map: {
                            input: "$likedUsers",
                            as: "user",
                            in: {
                                _id: "$$user._id",
                                username: "$$user.username",
                                profileImage: "$$user.profileImage",
                            },
                        },
                    },
                },
            },
        ]);

        if (!result.length) {
            throw new ApiError(404, "post not found");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, result, "liked users fetched successfully"));
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