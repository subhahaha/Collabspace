import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';

// POST /api/projects/:projectId/tasks
export const createTask = async (req, res) => {
  try {
    const { title, description, assigneeId, dueDate } = req.body;
    const { projectId } = req.params;

    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    // If an assignee was specified, make sure they're actually a member
    // of this workspace — otherwise you could assign a task to someone
    // who has no access to see or complete it.
    if (assigneeId) {
      const assigneeIsMember = await WorkspaceMember.findOne({
        workspaceId: req.project.workspaceId,
        userId: assigneeId,
      });
      if (!assigneeIsMember) {
        return res.status(400).json({ message: 'Assignee must be a member of this workspace' });
      }
    }

    const task = await Task.create({
      projectId,
      title,
      description: description || '',
      assigneeId: assigneeId || null,
      dueDate: dueDate || null,
    });

    res.status(201).json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

// GET /api/projects/:projectId/tasks
// Returns ALL tasks for a project — the frontend groups these into
// columns (todo / in-progress / done) by filtering on `status` client-side,
// rather than us having 3 separate endpoints for 3 columns.
export const getTasksByProject = async (req, res) => {
  try {
    const tasks = await Task.find({ projectId: req.params.projectId })
      .populate('assigneeId', 'name email avatar')
      .sort({ createdAt: 1 });

    res.status(200).json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

// PATCH /api/tasks/:id
// This is the endpoint that powers drag-and-drop: when a card moves from
// "To Do" to "In Progress", the frontend just calls this with
// { status: "in-progress" }. Same endpoint also handles editing title,
// reassigning, changing due date — anything about an existing task.
export const updateTask = async (req, res) => {
  try {
    const { title, description, status, assigneeId, dueDate } = req.body;

    if (status && !['todo', 'in-progress', 'done'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    if (assigneeId) {
      const assigneeIsMember = await WorkspaceMember.findOne({
        workspaceId: req.project.workspaceId,
        userId: assigneeId,
      });
      if (!assigneeIsMember) {
        return res.status(400).json({ message: 'Assignee must be a member of this workspace' });
      }
    }

    // Only update fields that were actually provided — this lets the
    // frontend send a partial update like { status: "done" } without
    // needing to resend the whole task object every time.
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (assigneeId !== undefined) updates.assigneeId = assigneeId;
    if (dueDate !== undefined) updates.dueDate = dueDate;

    const updatedTask = await Task.findByIdAndUpdate(req.task._id, updates, { new: true }).populate(
      'assigneeId',
      'name email avatar'
    );

    res.status(200).json({ task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.task._id);
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};

// GET /api/tasks/mine
// Every OPEN task assigned to the logged-in user, across all their
// workspaces. Tasks only know their project, and projects only know their
// workspace, so we walk that chain: memberships -> projects -> tasks.
// Starting from the user's CURRENT memberships also means that if someone
// is removed from a workspace, their tasks there stop showing up.
export const getMyTasks = async (req, res) => {
  try {
    const memberships = await WorkspaceMember.find({ userId: req.user._id }).select('workspaceId');
    const workspaceIds = memberships.map((m) => m.workspaceId);

    const [workspaces, projects] = await Promise.all([
      Workspace.find({ _id: { $in: workspaceIds } }).select('name'),
      Project.find({ workspaceId: { $in: workspaceIds } }).select('title workspaceId'),
    ]);

    const workspaceNames = new Map(workspaces.map((w) => [String(w._id), w.name]));
    const projectsById = new Map(projects.map((p) => [String(p._id), p]));

    const tasks = await Task.find({
      assigneeId: req.user._id,
      projectId: { $in: projects.map((p) => p._id) },
      status: { $ne: 'done' },
    }).sort({ createdAt: -1 });

    const result = tasks.map((task) => {
      const project = projectsById.get(String(task.projectId));
      return {
        _id: task._id,
        title: task.title,
        status: task.status,
        dueDate: task.dueDate,
        projectId: project._id,
        projectTitle: project.title,
        workspaceId: project.workspaceId,
        workspaceName: workspaceNames.get(String(project.workspaceId)) || '',
      };
    });

    res.status(200).json({ tasks: result });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your tasks', error: error.message });
  }
};