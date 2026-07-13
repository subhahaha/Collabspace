import Project from '../models/Project.js';
import WorkspaceMember from '../models/WorkspaceMember.js';

// POST /api/workspaces/:id/projects
export const createProject = async (req, res) => {
  try {
    const { title, description } = req.body;
    const workspaceId = req.params.id;

    if (!title) {
      return res.status(400).json({ message: 'Project title is required' });
    }

    // req.membership was already attached by checkMembership in Stage 3's
    // workspace middleware — confirms this user belongs to the workspace.
    const project = await Project.create({
      workspaceId,
      title,
      description: description || '',
    });

    res.status(201).json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

// GET /api/workspaces/:id/projects
export const getProjectsByWorkspace = async (req, res) => {
  try {
    const projects = await Project.find({ workspaceId: req.params.id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ projects });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};

// GET /api/projects/:id
// checkProjectAccess already fetched the project and confirmed access,
// so req.project is already available — no second DB query needed here.
export const getProjectById = async (req, res) => {
  res.status(200).json({ project: req.project, role: req.membership.role });
};