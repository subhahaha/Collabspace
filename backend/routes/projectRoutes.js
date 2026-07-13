import express from 'express';
import { createProject, getProjectsByWorkspace, getProjectById } from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkMembership } from '../middleware/workspaceMiddleware.js';
import { checkProjectAccess } from '../middleware/projectMiddleware.js';

const router = express.Router();

// Nested under a workspace: /api/workspaces/:workspaceId/projects
// Note: checkMembership (from Stage 3) reads req.params.id, so we alias
// the route param as :id here to reuse it without modifying that middleware.
router.post('/workspaces/:id/projects', protect, checkMembership, createProject);
router.get('/workspaces/:id/projects', protect, checkMembership, getProjectsByWorkspace);

// Standalone project routes: /api/projects/:id
router.get('/projects/:id', protect, checkProjectAccess, getProjectById);

export default router;