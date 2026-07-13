import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

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

// Route imports will be added here in later stages:
// app.use('/api/messages', messageRoutes);

const httpServer = createServer(app);

// Socket.io will attach to httpServer in a later stage, once chat is built.

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});