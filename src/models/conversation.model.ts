import mongoose, { Model } from 'mongoose';

interface IConversation {
    participants: mongoose.Types.ObjectId[];
    lastMessage?: mongoose.Types.ObjectId;
}

export interface IConversationDocument extends IConversation, Document { };

const conversationSchema = new mongoose.Schema<IConversationDocument>(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            }
        ],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        }
    }, { timestamps: true });

conversationSchema.pre("save", function () {
    this.participants.sort((a: any, b: any) =>
        a.toString().localeCompare(b.toString())
    );
});

export const Conversation = mongoose.model<IConversationDocument>("Converstaion", conversationSchema);