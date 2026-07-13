import express from 'express';
import { signup, login } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

// Protected route — tests that the JWT middleware works.
// Returns whoever the token belongs to.
router.get('/me', protect, (req, res) => {
  res.status(200).json({ user: req.user });
});

export default router;