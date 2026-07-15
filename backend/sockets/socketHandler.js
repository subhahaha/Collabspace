import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import Message from '../models/Message.js';

// Runs once when a browser establishes a socket connection, BEFORE any
// events are allowed to fire. This is the socket equivalent of the
// `protect` HTTP middleware from Stage 2 — except sockets don't have
// "headers" the same way, so the token is sent differently (see the
// frontend socket setup) and read here via socket.handshake.auth.
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      return next(new Error('User no longer exists'));
    }

    socket.user = user; // attach, same idea as req.user in HTTP middleware
    next();
  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
};

// Called once from server.js, given the raw Socket.io server instance.
export const initSocket = (io) => {
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.name} (${socket.id})`);

    // A user must explicitly "join" a workspace's room before they'll
    // receive messages from it — this mirrors opening a chat screen in
    // a real app. We re-check membership here (not just trusting the
    // frontend) so someone can't join a room for a workspace they're
    // not actually part of.
    socket.on('join-workspace', async (workspaceId) => {
      const membership = await WorkspaceMember.findOne({
        workspaceId,
        userId: socket.user._id,
      });
      if (!membership) {
        socket.emit('error', { message: 'You are not a member of this workspace' });
        return;
      }
      socket.join(workspaceId);
    });

    socket.on('leave-workspace', (workspaceId) => {
      socket.leave(workspaceId);
    });

    // The core chat event: someone sends a message.
    socket.on('send-message', async ({ workspaceId, text }) => {
      try {
        if (!text || !text.trim()) return;

        const membership = await WorkspaceMember.findOne({
          workspaceId,
          userId: socket.user._id,
        });
        if (!membership) {
          socket.emit('error', { message: 'You are not a member of this workspace' });
          return;
        }

        const message = await Message.create({
          workspaceId,
          senderId: socket.user._id,
          text: text.trim(),
        });

        // Populate sender info before broadcasting, so the frontend can
        // display the name/avatar without a separate lookup.
        const populatedMessage = await message.populate('senderId', 'name email avatar');

        // Broadcast to EVERYONE in the room, including the sender — this
        // keeps the sender's own UI in sync with exactly what the server
        // actually saved, rather than trusting a local optimistic copy.
        io.to(workspaceId).emit('new-message', populatedMessage);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.name} (${socket.id})`);
    });
  });
};