import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

// POST /api/workspaces
// Creates a workspace AND automatically makes the creator its owner.
// These are two separate documents (Workspace + WorkspaceMember) that
// need to be created together — if one succeeds and the other fails,
// we'd end up with a broken state (a workspace with no owner, or an
// orphaned membership). We handle that by cleaning up if step 2 fails.
export const createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Workspace name is required' });
    }

    const workspace = await Workspace.create({ name, ownerId: req.user._id });

    try {
      await WorkspaceMember.create({
        workspaceId: workspace._id,
        userId: req.user._id,
        role: 'owner',
      });
    } catch (memberError) {
      // Roll back the workspace if we couldn't create the membership,
      // so we never leave an "ownerless" workspace behind.
      await Workspace.findByIdAndDelete(workspace._id);
      throw memberError;
    }

    res.status(201).json({ workspace });
  } catch (error) {
    res.status(500).json({ message: 'Error creating workspace', error: error.message });
  }
};

// GET /api/workspaces
// Returns every workspace the logged-in user belongs to (any role).
export const getMyWorkspaces = async (req, res) => {
  try {
    const memberships = await WorkspaceMember.find({ userId: req.user._id });
    const workspaceIds = memberships.map((m) => m.workspaceId);

    const workspaces = await Workspace.find({ _id: { $in: workspaceIds } });

    // Attach the user's role in each workspace — the frontend will want
    // this to decide what UI to show (e.g. only owners see "delete workspace").
    const workspacesWithRole = workspaces.map((ws) => {
      const membership = memberships.find((m) => m.workspaceId.toString() === ws._id.toString());
      return { ...ws.toObject(), role: membership.role };
    });

    res.status(200).json({ workspaces: workspacesWithRole });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workspaces', error: error.message });
  }
};

// GET /api/workspaces/:id
// checkMembership middleware already confirmed the user belongs here.
export const getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    res.status(200).json({ workspace, role: req.membership.role });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workspace', error: error.message });
  }
};

// POST /api/workspaces/:id/members
// Adds a user to the workspace by email. Only owner/admin (checked by
// requireAdmin middleware) can do this.
export const addMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const workspaceId = req.params.id;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) {
      return res.status(404).json({ message: 'No user found with that email' });
    }

    const existingMembership = await WorkspaceMember.findOne({
      workspaceId,
      userId: userToAdd._id,
    });
    if (existingMembership) {
      return res.status(409).json({ message: 'This user is already a member of the workspace' });
    }

    const membership = await WorkspaceMember.create({
      workspaceId,
      userId: userToAdd._id,
      role: role && ['admin', 'member'].includes(role) ? role : 'member',
    });

    res.status(201).json({ membership });
  } catch (error) {
    res.status(500).json({ message: 'Error adding member', error: error.message });
  }
};

// GET /api/workspaces/:id/members
export const getWorkspaceMembers = async (req, res) => {
  try {
    const memberships = await WorkspaceMember.find({ workspaceId: req.params.id }).populate(
      'userId',
      'name email avatar'
    );

    res.status(200).json({ members: memberships });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching members', error: error.message });
  }
};

// DELETE /api/workspaces/:id/members/:userId
// Removes a member from the workspace — the fix for exactly the kind of
// mistake you'd want undoable: typo'd an email, added the wrong person.
// Restricted to owner/admin (requireAdmin), same as inviting. We
// deliberately block removing the OWNER through this endpoint — that's
// not an accidental-invite scenario, and doing so would leave the
// workspace ownerless. Deleting the whole workspace is the intentional
// path for that, not a member-removal button.
export const removeMember = async (req, res) => {
  try {
    const { id: workspaceId, userId } = req.params;

    const membershipToRemove = await WorkspaceMember.findOne({ workspaceId, userId });
    if (!membershipToRemove) {
      return res.status(404).json({ message: 'This user is not a member of the workspace' });
    }

    if (membershipToRemove.role === 'owner') {
      return res.status(400).json({ message: 'The workspace owner cannot be removed' });
    }

    await WorkspaceMember.findByIdAndDelete(membershipToRemove._id);

    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing member', error: error.message });
  }
};

// DELETE /api/workspaces/:id
// Deleting a workspace should also clean up everything that lives inside
// it — otherwise you'd end up with "orphaned" projects, tasks, and
// memberships in the database that reference a workspace that no longer
// exists. We delete child records first, then the workspace itself.
export const deleteWorkspace = async (req, res) => {
  try {
    const workspaceId = req.params.id;

    const projects = await Project.find({ workspaceId });
    const projectIds = projects.map((p) => p._id);

    await Task.deleteMany({ projectId: { $in: projectIds } });
    await Project.deleteMany({ workspaceId });
    await WorkspaceMember.deleteMany({ workspaceId });
    await Workspace.findByIdAndDelete(workspaceId);

    res.status(200).json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting workspace', error: error.message });
  }
};