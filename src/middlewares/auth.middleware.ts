import { Request } from "express";
import { ApiError, asyncHandler, JWT_SECRET } from "../lib";
import jwt, { JwtPayload } from "jsonwebtoken";
import { IUserDocument, User } from "../models";

export interface AuthRequest extends Request {
  user?: IUserDocument  
}

export interface AccessTokenPayload extends JwtPayload {
  _id: string;
  user: string;
  email: string;
}

export const verifyJWT = asyncHandler(
  async (req: AuthRequest, res, next) => {
    try {
      const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        throw new ApiError(401, "unauthorized request");
      }

      const decodedToken = jwt.verify(
        token,
        JWT_SECRET
      ) as AccessTokenPayload;

      const user = await User.findById(decodedToken._id).select(
        "-password -refreshToken -posts"
      );

      if (!user) {
        throw new ApiError(401, "invalid access token");
      }

      req.user = user; // now TypeScript is happy
      next();
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
  }
);

