import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check client-side first — catches obvious problems instantly,
    // without waiting on a round trip to the backend just to be told
    // something we could already tell locally.
    if (!hasMinLength || !hasNumber) {
      setError('Password must be at least 8 characters and include a number.');
      return;
    }

    setSubmitting(true);
    try {
      await signup(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div className="pinned-card" style={styles.card}>
        <h1 style={styles.heading}>CollabSpace</h1>
        <p style={styles.subheading}>Create your account</p>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label className="field-label" htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={styles.field}>
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.field}>
            <label className="field-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {password.length > 0 && (
              <div style={styles.requirements}>
                <span style={hasMinLength ? styles.reqMet : styles.reqUnmet}>
                  At least 8 characters
                </span>
                <span style={hasNumber ? styles.reqMet : styles.reqUnmet}>
                  Includes a number
                </span>
              </div>
            )}
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn-primary" style={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p style={styles.footerText}>
          Already have an account? <Link to="/login" style={styles.link}>Log in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '360px',
  },
  heading: {
    fontSize: '22px',
  },
  subheading: {
    color: 'var(--color-ink-soft)',
    fontSize: '14px',
    margin: '6px 0 24px 0',
  },
  field: {
    marginBottom: '16px',
  },
  requirements: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    marginTop: '6px',
    fontSize: '12px',
  },
  reqMet: {
    color: 'var(--color-success)',
  },
  reqUnmet: {
    color: 'var(--color-ink-soft)',
  },
  submitBtn: {
    width: '100%',
    marginTop: '4px',
  },
  footerText: {
    fontSize: '13px',
    color: 'var(--color-ink-soft)',
    marginTop: '20px',
    textAlign: 'center',
  },
  link: {
    color: 'var(--color-accent-ink)',
    fontWeight: 600,
  },
};