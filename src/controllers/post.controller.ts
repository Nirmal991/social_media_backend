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
