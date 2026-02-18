import mongoose from 'mongoose';
import { ApiError, ApiResponse, asyncHandler, uploadOnCloudinary } from "../lib";
import { AuthRequest } from "../middlewares";
import { Conversation, Message } from '../models';
import { io } from '../index'


export const getOrCreateConversation = asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user?._id;
    const { receiverId } = req.body;

    if (!userId || !receiverId) {
        throw new ApiError(400, "invalid users");
    }

    if (userId.toString() === receiverId.toString()) {
        throw new ApiError(400, "cannot chat with yourself");
    }

    try {
        const participants = [
            new mongoose.Types.ObjectId(userId),
            new mongoose.Types.ObjectId(receiverId)
        ].sort((a: any, b: any) => a.toString().localeCompare(b.toString()));

        let conversation = await Conversation.findOne({
            participants,
        })

        let isNew: boolean = false;

        if (!conversation) {
            conversation = await Conversation.create({ participants });
            isNew = true;
        }

        if (isNew) {
            participants.forEach((participantId: any) => {
                io.to(participantId.toString()).emit('conversation_updated')
            })
        }

        return res
            .status(200)
            .json(new ApiResponse(200, conversation, "conversation fetched"))
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
})

export const sendMessage = asyncHandler(async (req: AuthRequest, res) => {
  try {
    const senderId = req.user?._id;
    if (!senderId) {
      throw new ApiError(404, "sender id not found");
    }
    const { conversationId, text } = req.body;
    if (!conversationId) {
      throw new ApiError(404, "conversation id not found");
    }
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new ApiError(404, "conversation not found");
    }
    if (
      !conversation.participants.some(
        (p: any) => p.toString() === senderId.toString()
      )
    ) {
      throw new ApiError(404, "not a participant");
    }
    let image;
    if (req.file?.path) {
      let imageLocalPath = req.file.path;
      image = await uploadOnCloudinary(imageLocalPath);
    }
    let message;
    if (!image) {
      message = await Message.create({
        conversation: conversationId,
        sender: senderId,
        text,
        seenBy: [senderId],
      });
    } else {
      message = await Message.create({
        conversation: conversationId,
        sender: senderId,
        text,
        image: image.url,
        seenBy: [senderId],
      });
    }
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
    });

    const populated = await message.populate("sender", "username profileImage");

    io.to(conversationId.toString()).emit("new_message", populated);

    conversation.participants.forEach((participantId: any) => {
      io.to(participantId.toString()).emit("conversation_updated");
    });

    return res
      .status(201)
      .json(new ApiResponse(201, populated, "message sent successfully"));
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
