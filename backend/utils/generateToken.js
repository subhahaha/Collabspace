import jwt from 'jsonwebtoken';

// Signs a JWT containing the user's ID. We keep the payload minimal —
// just enough to identify the user on future requests. Anything else
// (name, email) should be fetched from the DB when needed, not stuffed
// into the token, since token payloads are visible to anyone who has the token.
export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};