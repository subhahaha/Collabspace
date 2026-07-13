import WorkspaceMember from '../models/WorkspaceMember.js';

// Runs AFTER `protect` (so req.user already exists).
// Checks that the logged-in user is actually a member of the workspace
// referenced in the URL (:id). If they are, attaches their membership
// (which includes their role) onto req.membership so later handlers
// can check "is this person an owner/admin?" without a second DB query.
export const checkMembership = async (req, res, next) => {
  try {
    const workspaceId = req.params.id;

    const membership = await WorkspaceMember.findOne({
      workspaceId,
      userId: req.user._id,
    });

    if (!membership) {
      // Deliberately the same error whether the workspace doesn't exist
      // or the user just isn't a member of it — we don't want to reveal
      // which workspace IDs are real to people who aren't part of them.
      return res.status(403).json({ message: 'You are not a member of this workspace' });
    }

    req.membership = membership;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking workspace membership', error: error.message });
  }
};

// A second layer on top of checkMembership — for actions only
// owners/admins should be able to do, like adding new members.
// Must run AFTER checkMembership (needs req.membership to exist).
export const requireAdmin = (req, res, next) => {
  if (!['owner', 'admin'].includes(req.membership.role)) {
    return res.status(403).json({ message: 'Only workspace owners or admins can do this' });
  }
  next();
};