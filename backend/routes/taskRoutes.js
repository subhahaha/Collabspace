import express from 'express';
import { createTask, getTasksByProject, updateTask, deleteTask } from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkProjectAccess } from '../middleware/projectMiddleware.js';
import { checkTaskAccess } from '../middleware/taskMiddleware.js';

const router = express.Router();

// Nested under a project: /api/projects/:projectId/tasks
router.post('/projects/:projectId/tasks', protect, checkProjectAccess, createTask);
router.get('/projects/:projectId/tasks', protect, checkProjectAccess, getTasksByProject);

// Standalone task routes: /api/tasks/:id
// This is the endpoint the frontend calls on every drag-and-drop move.
router.patch('/tasks/:id', protect, checkTaskAccess, updateTask);
router.delete('/tasks/:id', protect, checkTaskAccess, deleteTask);

export default router;