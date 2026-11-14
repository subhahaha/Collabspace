import mongoose from 'mongoose';

// Notes are personal: each one belongs to exactly one user (userId) and
// is only ever queried by that user. There is deliberately no workspaceId.
const noteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, trim: true, default: '' },
    content: { type: String, default: '' },
  },
  { timestamps: true }
);

const Note = mongoose.model('Note', noteSchema);

export default Note;