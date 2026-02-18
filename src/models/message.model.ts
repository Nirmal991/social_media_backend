import mongoose, { Model } from 'mongoose';

interface IMessage {
    conversation: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    text?: string;
    image?: string;
    seenBy: mongoose.Types.ObjectId[];
    createdAt: Date;
}

export interface IMessageDocument extends IMessage, Document { }

const messageSchema = new mongoose.Schema<
    IMessageDocument,
    Model<IMessageDocument>
>(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            index: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
        },
        seenBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps: true,
    }
);

messageSchema.pre("validate", function () {
    if (!this.text && !this.image) {
        throw new Error("Message must contain text or image");
    }
});

messageSchema.pre("save", function () {
    if (this.isNew && this.sender && (!this.seenBy || this.seenBy.length === 0)) {
        this.seenBy = [this.sender];
    }
});

messageSchema.index({ conversation: 1, createdAt: -1 });

export const Message = mongoose.model<IMessageDocument>(
    "Message",
    messageSchema
);
