import mongoose, { HydratedDocument } from 'mongoose';


export interface IComment {
    post: mongoose.Types.ObjectId,
    comment: string,
    commentedBy: mongoose.Types.ObjectId,
}

export type CommentDocument = HydratedDocument<IComment>

const commentSchema = new mongoose.Schema<IComment>(
    {
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
        },
        comment: {
            type: String,
            required: true,
        },
        commentedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {timestamps: true})

export const Comment = mongoose.model<IComment>("Comment", commentSchema);