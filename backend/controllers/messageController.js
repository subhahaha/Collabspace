import Message from '../models/Message.js';

// GET /api/workspaces/:id/messages
// Loads existing chat history when someone opens the chat panel.
// Sockets only handle messages sent WHILE connected — this fills in
// everything that happened before that.
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ workspaceId: req.params.id })
      .populate('senderId', 'name email avatar')
      .sort({ createdAt: 1 })
      .limit(100); // most recent 100 — enough for a portfolio project;
                   // a real app would paginate for older history.

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};