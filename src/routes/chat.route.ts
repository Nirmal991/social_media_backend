import express, { Router } from 'express';
import { upload, verifyJWT } from '../middlewares';
import { getMessage, getOrCreateConversation, getUserConversations, markSeen, sendMessage } from '../controllers';

const router = Router();

router.post('/conversation', verifyJWT, getOrCreateConversation)
router.post('/message', verifyJWT, upload.single("image"), sendMessage)
router.get('/messages/:conversationId', verifyJWT, getMessage)
router.patch('/seen/:conversationId', verifyJWT, markSeen)
router.get('/conversations', verifyJWT, getUserConversations)

export default router;