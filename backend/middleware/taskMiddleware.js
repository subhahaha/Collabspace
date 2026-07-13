import Task from '../models/Task.js';
import Project from '../models/Project.js';
import WorkspaceMember from '../models/WorkspaceMember.js';

// Used for routes shaped like /api/tasks/:id.
// Same chain-of-trust idea as checkProjectAccess, but one level deeper:
// task -> belongs to a project -> belongs to a workspace -> check membership there.
// This is the tradeoff of not duplicating workspaceId onto every single
// collection "just in case" — we look it up through the chain instead.
export const checkTaskAccess = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Associated project not found' });
    }

    const membership = await WorkspaceMember.findOne({
      workspaceId: project.workspaceId,
      userId: req.user._id,
    });

    if (!membership) {
      return res.status(403).json({ message: 'You do not have access to this task' });
    }

    req.task = task;
    req.project = project;
    req.membership = membership;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking task access', error: error.message });
  }
};