import express from 'express';
import { signup, login, changePassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.put('/change-password', protect, changePassword);

// Protected route — tests that the JWT middleware works.
// Returns whoever the token belongs to.
router.get('/me', protect, (req, res) => {
  res.status(200).json({ user: req.user });
});

export default router;