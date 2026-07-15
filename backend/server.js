import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { initSocket } from './sockets/socketHandler.js';

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Simple health check route — useful for confirming the server is alive,
// and a good first thing to test in Postman.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CollabSpace API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
// projectRoutes and taskRoutes each define their own full paths internally
// (e.g. /workspaces/:id/projects, /projects/:id/tasks), so we mount them
// at the bare /api root rather than a fixed prefix.
app.use('/api', projectRoutes);
app.use('/api', taskRoutes);
app.use('/api', messageRoutes);

const httpServer = createServer(app);

// Socket.io attaches to the raw HTTP server (not the Express app) — this
// is exactly why we set server.js up with createServer() back in Stage 1
// instead of just using app.listen().
const io = new Server(httpServer, {
  cors: { origin: '*' }, // fine for a student project; a real app would
                          // restrict this to the actual frontend domain.
});
initSocket(io);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});