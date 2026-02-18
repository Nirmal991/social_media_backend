import { ApiError, ApiResponse, asyncHandler, uploadOnCloudinary } from "../lib";
import { AuthRequest } from "../middlewares";
import { Post, User } from "../models";
import { UploadApiResponse } from "cloudinary";

export const createPost = asyncHandler(async (req: AuthRequest, res) => {
  try {
    let imageLocalPath: string | undefined;
    let image: UploadApiResponse | null = null;
    let post;

    if (req.file?.path) {
      imageLocalPath = req.file.path;
      image = await uploadOnCloudinary(imageLocalPath);
    }

    const { content } = req.body;
    const userId = req.user?._id;

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "user not found");
    }

    if (!image) {
      post = await Post.create({
        content,
        owner: userId,
      });
    } else {
      post = await Post.create({
        content,
        image: image.url,
        owner: userId,
      });
    }

    user.posts.push(post._id);
    await user.save();

    return res
      .status(201)
      .json(new ApiResponse(201, post, "post created successfully"));
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

export const getAllPostForHomePage = asyncHandler(async (req: AuthRequest, res) => {

  try {
    const userId = req.user?._id;
    if (!userId) {
    }
    const posts = await Post.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $unwind: {
          path: "$owner",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          "owner.password": 0,
          "owner.refreshToken": 0,
          "owner.__v": 0,
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "comments",
          foreignField: "_id",
          as: "comments",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "comments.commentedBy",
          foreignField: "_id",
          as: "commentUsers",
        },
      },
      {
        $addFields: {
          comments: {
            $map: {
              input: "$comments",
              as: "comment",
              in: {
                _id: "$$comment._id",
                comment: "$$comment.comment",
                createdAt: "$$comment.createdAt",
                commentedBy: {
                  $let: {
                    vars: {
                      user: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$commentUsers",
                              as: "user",
                              cond: {
                                $eq: ["$$user._id", "$$comment.commentedBy"],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      _id: "$$user._id",
                      username: "$$user.username",
                      profileImage: "$$user.profileImage",
                    },
                  },
                },
              },
            },
          },
        },
      },

      // 🔥 ONLY NEW PART (LIKES)
      {
        $addFields: {
          commentsCount: { $size: "$comments" },
          likeCount: { $size: "$likes" },
        },
      },

      {
        $project: {
          commentUsers: 0,
          __v: 0,
          // keep likes if frontend needs it
          // remove this line if you want full likes array
          // likes: 1
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    console.log(posts);

    return res
      .status(200)
      .json(new ApiResponse(200, posts, "posts fetched successfully"));
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

export const getUserPosts = asyncHandler(async (req: AuthRequest, res) => {

  try {
    const { username } = req.params;

    if (!username) {
      throw new ApiError(404, "username not found");
    }

    const posts = await Post.aggregate([
      // 1️⃣ Join owner 
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      { $unwind: "$owner" },

      // 2️⃣ Match by username
      {
        $match: {
          "owner.username": username,
        },
      },

      // 3️⃣ Join comments
      {
        $lookup: {
          from: "comments",
          localField: "comments",
          foreignField: "_id",
          as: "comments",
        },
      },

      // 4️⃣ Join comment users
      {
        $lookup: {
          from: "users",
          localField: "comments.commentedBy",
          foreignField: "_id",
          as: "commentUsers",
        },
      },

      // 5️⃣ Shape comments
      {
        $addFields: {
          comments: {
            $map: {
              input: "$comments",
              as: "comment",
              in: {
                _id: "$$comment._id",
                comment: "$$comment.comment",
                createdAt: "$$comment.createdAt",
                commentedBy: {
                  $let: {
                    vars: {
                      user: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$commentUsers",
                              as: "user",
                              cond: {
                                $eq: ["$$user._id", "$$comment.commentedBy"],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      _id: "$$user._id",
                      username: "$$user.username",
                      profileImage: "$$user.profileImage",
                    },
                  },
                },
              },
            },
          },
        },
      },

      // 🔥 FIX: ensure likes always exists + counts
      {
        $addFields: {
          likes: { $ifNull: ["$likes", []] },
        },
      },
      {
        $addFields: {
          commentCount: { $size: "$comments" },
          likeCount: { $size: "$likes" },
        },
      },

      // 6️⃣ Final projection
      {
        $project: {
          content: 1,
          image: 1,
          createdAt: 1,
          commentCount: 1,
          likeCount: 1,
          likes: 1,
          comments: 1,
          owner: {
            _id: "$owner._id",
            username: "$owner.username",
            profileImage: "$owner.profileImage",
          },
          // ❌ hide raw likes array (optional)
          // likes: 0,
        },
      },

      { $sort: { createdAt: -1 } },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, posts, "user posts fetched successfully"));
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

export const getUserPostById = asyncHandler(async (req: AuthRequest, res) => {
  console.log("getUserPostById controller hit");
  const userId = req.user?._id;
  const { postId } = req.params;

  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  const post = await Post.findById(postId)
    .populate("owner", "username profileImage")
    .populate({
      path: "comments",
      populate: {
        path: "commentedBy",
        select: "username profileImage",
      },
    })
    .populate("likes", "username profileImage");

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (post.owner._id.toString() !== userId?.toString()) {
    throw new ApiError(403, "You are not allowed to access this post");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, post, "Post fetched successfully"));
});


export const updatePost = asyncHandler(async (req: AuthRequest, res) => {

  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(400, "User not found");
  }

  const { postId } = req.params;
  const { content } = req.body

  if (!content || content === "") {
    throw new ApiError(400, "content is required and it cannot be empty");
  }

  if (!postId) {
    throw new ApiError(400, "post not found");
  }

  try {
    const post = await Post.findById(postId);

    if (!post?.owner.equals(userId)) {
      throw new ApiError(401, "you are unauthorized to perform this action");
    }

    post.content = content
    await post.save({ validateBeforeSave: false })

    return res
      .status(200)
      .json(new ApiResponse(200, post, "Content updated successfully"));
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

export const deletePost = asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "User not found")
  }

  const { postId } = req.params;

  if (!postId) {
    throw new ApiError(400, "Post not found")
  }

  try {
    const deletedPost = await Post.findByIdAndDelete(postId)

    if (!deletedPost) {
      throw new ApiError(401, "you are not authorized to deleted post")
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Post Deleted Successfylly"))
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

