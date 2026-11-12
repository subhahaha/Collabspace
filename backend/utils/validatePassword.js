// One place for the password rules, so signup and change-password can
// never drift apart. Returns an error message, or null if the password
// is acceptable.
export const validatePassword = (password) => {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/\d/.test(password)) {
    return 'Password must include at least one number';
  }
  return null;
};