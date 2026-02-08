import { ApiError, asyncHandler, signUpSchema, uploadOnCloudinary, ApiResponse, loginSchema } from "../lib"
import { User } from "../models";

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

        const accessToken = createdUser.generateAccessToken();
        const refreshToken = createdUser.generateRefreshToken();

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

        if (!password) {
            throw new ApiError(401, "Invalid credentails")
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

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