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
import noteRoutes from './routes/noteRoutes.js';
import { initSocket } from './sockets/socketHandler.js';

dotenv.config();
connectDB();

const app = express();

// Only these websites may call the API from a browser. CLIENT_URL can hold
// several addresses separated by commas (e.g. your Vercel URL plus a custom
// domain). Trailing slashes are stripped, because the browser's Origin
// header never has one and a mismatch would silently block everything.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
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
app.use('/api/notes', noteRoutes);

const httpServer = createServer(app);

// Socket.io attaches to the raw HTTP server (not the Express app) — this
// is exactly why we set server.js up with createServer() back in Stage 1
// instead of just using app.listen().
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins }, // same allow-list as the REST API
});
initSocket(io);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});