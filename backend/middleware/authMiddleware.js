import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Runs before any protected route. Checks for a valid JWT in the
// Authorization header, and if valid, attaches the user to req.user
// so later controllers can access "who is making this request".
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Expecting header format: "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided, access denied' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user fresh from the DB rather than trusting the token payload
    // blindly — this also lets us catch cases where the user was deleted
    // after the token was issued.
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};