import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // Mirrors the backend's deliberately vague message — we don't
      // want the frontend accidentally revealing more than the API does.
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div className="pinned-card" style={styles.card}>
        <h1 style={styles.heading}>CollabSpace</h1>
        <p style={styles.subheading}>Log in to your workspace</p>

        <form onSubmit={handleSubmit}>
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
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn-primary" style={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p style={styles.footerText}>
          Don't have an account? <Link to="/signup" style={styles.link}>Sign up</Link>
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