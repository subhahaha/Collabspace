import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
            <div style={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="field-input"
                style={styles.passwordInput}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {/* type="button" matters here: without it, a button inside
                  a form defaults to submit and would try to log you in. */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={styles.toggleBtn}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {showPassword ? (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  ) : (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  )}
                </svg>
              </button>
            </div>
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
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    // leave room on the right so long passwords don't run under the button
    paddingRight: '42px',
  },
  toggleBtn: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    color: 'var(--color-ink-soft)',
    padding: '4px',
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
    color: 'var(--color-link)',
    fontWeight: 600,
  },
};