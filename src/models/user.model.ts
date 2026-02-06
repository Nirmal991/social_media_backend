import mongoose, { Model, Document } from "mongoose";
import bcrypt from "bcrypt";
import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { ACCESS_TOKEN_EXPIRY, JWT_SECRET } from "../lib";

export interface IUser {
  username: string;
  email: string;
  password: string;
  bio?: string;
  profileImage?: string;
  posts: mongoose.Types.ObjectId;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  refreshToken?: String | undefined;
}

export interface IUserMethods {
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

export interface IUserDocument extends IUser, Document, IUserMethods {}

const userSchema = new mongoose.Schema<
  IUserDocument,
  Model<IUserDocument>,
  IUserMethods
>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    bio: {
      type: String,
    },
    profileImage: {
      type: String,
    },
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    password: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre<IUserDocument>("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  const accessTokenSecret: Secret = JWT_SECRET as Secret;

  const options: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"],
  };

  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email,
    },
    accessTokenSecret,
    options
  );
};

userSchema.methods.generateRefreshToken = function () {
  const refreshTokenSecret: Secret = process.env.REFRESH_TOKEN_SECRET as Secret;
  const options: SignOptions = {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY as SignOptions["expiresIn"],
  };

  return jwt.sign(
    {
      _id: this.id,
    },
    refreshTokenSecret,
    options
  );
};

export const User = mongoose.model<IUserDocument>("User", userSchema);