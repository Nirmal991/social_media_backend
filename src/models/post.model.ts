import mongoose, { Model, HydratedDocument } from "mongoose";

export interface IPost {
    content: string,
    image?: string,
    owner: mongoose.Types.ObjectId,
    comments: mongoose.Types.ObjectId[],
    likes: mongoose.Types.ObjectId[],
}

export type PostDocument = HydratedDocument<IPost>;

const postSchema = new mongoose.Schema<IPost>(
    {
        content: {
            type: String,
            required: true,
        },
        image: {
            type: String,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        comments: [
            { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
        ],
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        ],

    },
    { timestamps: true })

export const Post = mongoose.model<IPost>("Post", postSchema);