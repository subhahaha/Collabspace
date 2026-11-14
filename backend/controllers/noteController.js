import mongoose from 'mongoose';
import Note from '../models/Note.js';

const MAX_TITLE = 100;
const MAX_CONTENT = 5000;

// Shared by create and update so the rules live in one place.
// Returns an error message, or null if the input is fine.
const validateNote = (title, content) => {
  if (!title.trim() && !content.trim()) return 'A note needs a title or some content';
  if (title.length > MAX_TITLE) return `Title can be at most ${MAX_TITLE} characters`;
  if (content.length > MAX_CONTENT) return `Note can be at most ${MAX_CONTENT} characters`;
  return null;
};

// GET /api/notes  (only the logged-in user's own notes)
export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.status(200).json({ notes });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notes', error: error.message });
  }
};

// POST /api/notes
export const createNote = async (req, res) => {
  try {
    const title = typeof req.body.title === 'string' ? req.body.title : '';
    const content = typeof req.body.content === 'string' ? req.body.content : '';

    const problem = validateNote(title, content);
    if (problem) return res.status(400).json({ message: problem });

    const note = await Note.create({ userId: req.user._id, title, content });
    res.status(201).json({ note });
  } catch (error) {
    res.status(500).json({ message: 'Error creating note', error: error.message });
  }
};

// PUT /api/notes/:id
// The query includes userId, so someone else's note id simply isn't found.
// That doubles as the ownership check: no separate "is this yours" step.
export const updateNote = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    const title = typeof req.body.title === 'string' ? req.body.title : note.title;
    const content = typeof req.body.content === 'string' ? req.body.content : note.content;

    const problem = validateNote(title, content);
    if (problem) return res.status(400).json({ message: problem });

    note.title = title;
    note.content = content;
    await note.save();

    res.status(200).json({ note });
  } catch (error) {
    res.status(500).json({ message: 'Error updating note', error: error.message });
  }
};

// DELETE /api/notes/:id
export const deleteNote = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    res.status(200).json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting note', error: error.message });
  }
};