import { useState, useEffect } from 'react';
import { changePasswordApi } from '../api/authApi';

// Same rules as the backend (utils/validatePassword.js). Checking here
// too just means the person gets instant feedback instead of waiting on
// a round trip; the backend still enforces them regardless.
const validateNewPassword = (password) => {
  if (password.length < 8) return 'New password must be at least 8 characters';
  if (!/\d/.test(password)) return 'New password must include at least one number';
  return '';
};

export default function SettingsModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateNewPassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }

    setSaving(true);
    try {
      await changePasswordApi(currentPassword, newPassword);
      setSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update password.');
    } finally {
      setSaving(false);
    }
  };

  const inputType = showPasswords ? 'text' : 'password';

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div className="pinned-card" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.heading}>Settings</h2>
        <h3 style={styles.sectionTitle}>Change password</h3>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label className="field-label" htmlFor="currentPassword">Current password</label>
            <input
              id="currentPassword"
              type={inputType}
              className="field-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div style={styles.field}>
            <label className="field-label" htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              type={inputType}
              className="field-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <p style={styles.hint}>At least 8 characters, including a number.</p>
          </div>

          <div style={styles.field}>
            <label className="field-label" htmlFor="confirmPassword">Confirm new password</label>
            <input
              id="confirmPassword"
              type={inputType}
              className="field-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <label style={styles.showRow}>
            <input
              type="checkbox"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
            />
            Show passwords
          </label>

          {error && <p className="error-text">{error}</p>}
          {success && <p style={styles.successText}>{success}</p>}

          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.closeBtn}>
              Close
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(27, 35, 64, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    width: '420px',
    maxWidth: '90vw',
  },
  heading: {
    fontSize: '18px',
    marginBottom: '4px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--color-ink-soft)',
    marginBottom: '18px',
  },
  field: {
    marginBottom: '16px',
  },
  hint: {
    fontSize: '12px',
    color: 'var(--color-ink-soft)',
    margin: '6px 0 0 0',
  },
  showRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: 'var(--color-ink-soft)',
    marginBottom: '8px',
  },
  successText: {
    color: 'var(--color-success)',
    fontSize: '13px',
    marginTop: '8px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '16px',
  },
  closeBtn: {
    background: 'none',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    padding: '10px 16px',
    fontSize: '14px',
    color: 'var(--color-ink)',
  },
};