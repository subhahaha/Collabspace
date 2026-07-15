import express from 'express';
import { getMessages } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkMembership } from '../middleware/workspaceMiddleware.js';

const router = express.Router();

router.get('/workspaces/:id/messages', protect, checkMembership, getMessages);

export default router;