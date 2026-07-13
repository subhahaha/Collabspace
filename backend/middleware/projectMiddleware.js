import Project from '../models/Project.js';
import WorkspaceMember from '../models/WorkspaceMember.js';

// Used for routes shaped like /api/projects/:id or /api/projects/:projectId/...
// A project doesn't have its own membership list — access to a project is
// really just "are you a member of the workspace this project lives in?"
// So this middleware looks up the project, finds its workspaceId, then
// checks membership there — same idea as checkMembership in Stage 3,
// just one hop further down the chain.
export const checkProjectAccess = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const membership = await WorkspaceMember.findOne({
      workspaceId: project.workspaceId,
      userId: req.user._id,
    });

    if (!membership) {
      return res.status(403).json({ message: 'You do not have access to this project' });
    }

    // Attach both — controllers often need the project itself (e.g. to
    // read its workspaceId) and the user's role (e.g. for permission checks).
    req.project = project;
    req.membership = membership;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking project access', error: error.message });
  }
};