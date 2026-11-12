import mongoose from 'mongoose';

const workspaceMemberSchema = new mongoose.Schema(
  {
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    // When this person last opened the workspace chat. Null means "never";
    // we fall back to when they joined, so messages from before they
    // joined are never counted as unread.
    lastReadAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Prevent the same user from being added twice to the same workspace.
workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

const WorkspaceMember = mongoose.model('WorkspaceMember', workspaceMemberSchema);

export default WorkspaceMember;