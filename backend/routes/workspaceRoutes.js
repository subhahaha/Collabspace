import express from 'express';
import {
  createWorkspace,
  getMyWorkspaces,
  getWorkspaceById,
  addMember,
  getWorkspaceMembers,
  removeMember,
  deleteWorkspace,
} from '../controllers/workspaceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkMembership, requireAdmin, requireOwner } from '../middleware/workspaceMiddleware.js';

const router = express.Router();

// Every route here requires login (`protect`).
// Routes with :id ALSO require workspace membership (`checkMembership`).
// The order matters: protect must run before checkMembership, since
// checkMembership needs req.user to already be set.

router.post('/', protect, createWorkspace);
router.get('/', protect, getMyWorkspaces);

router.get('/:id', protect, checkMembership, getWorkspaceById);
router.get('/:id/members', protect, checkMembership, getWorkspaceMembers);

// addMember needs an extra layer: not just "are you a member" but
// "are you an owner/admin" — hence requireAdmin stacked on top.
router.post('/:id/members', protect, checkMembership, requireAdmin, addMember);
router.delete('/:id/members/:userId', protect, checkMembership, requireAdmin, removeMember);

// Deleting the whole workspace is stricter still — owner only.
router.delete('/:id', protect, checkMembership, requireOwner, deleteWorkspace);

export default router;