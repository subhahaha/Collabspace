import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

const Project = mongoose.model('Project', projectSchema);

export default Project;