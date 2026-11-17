import { useState, useEffect } from 'react';
import { getWorkspaceMembersApi, addMemberApi, removeMemberApi } from '../api/workspaceApi';
import { useAuth } from '../context/AuthContext';

// currentRole comes from the parent (fetched via getWorkspaceByIdApi),
// which already tells us the logged-in user's role in THIS workspace.
// We use it purely to decide whether to show the invite form — the real
// enforcement happens on the backend (requireAdmin middleware), so even
// if someone tampered with this check, the API call would still be
// rejected. This is the same "UI hides it, backend actually enforces
// it" split we've used throughout the app.
export default function MembersPanel({ workspaceId, currentRole }) {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const canInvite = currentRole === 'owner' || currentRole === 'admin';

  useEffect(() => {
    loadMembers();
  }, [workspaceId]);

  const loadMembers = async () => {
    try {
      const data = await getWorkspaceMembersApi(workspaceId);
      setMembers(data.members);
    } catch (err) {
      console.error('Failed to load members', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setInviting(true);
    setError('');
    setSuccessMsg('');
    try {
      await addMemberApi(workspaceId, email.trim(), role);
      setSuccessMsg(`${email.trim()} added to the workspace.`);
      setEmail('');
      setRole('member');
      await loadMembers();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add member.');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId, name) => {
    const confirmed = window.confirm(`Remove ${name} from this workspace?`);
    if (!confirmed) return;

    try {
      await removeMemberApi(workspaceId, userId);
      await loadMembers();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove member.');
    }
  };

  return (
    <div className="pinned-card" style={styles.panel}>
      <div style={styles.headerRow}>
        <h3 style={styles.heading}>
          Members {!loading && <span style={styles.count}>({members.length})</span>}
        </h3>
        {canInvite && (
          <button
            onClick={() => {
              setShowInviteForm((prev) => !prev);
              setError('');
              setSuccessMsg('');
            }}
            style={styles.toggleBtn}
          >
            {showInviteForm ? 'Cancel' : '+ Invite'}
          </button>
        )}
      </div>

      {showInviteForm && (
        <form onSubmit={handleInvite} style={styles.inviteForm}>
          <input
            type="email"
            className="field-input"
            placeholder="teammate@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <select
            className="field-input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={styles.roleSelect}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="btn-primary" disabled={inviting}>
            {inviting ? 'Adding...' : 'Add'}
          </button>
        </form>
      )}

      {error && <p className="error-text">{error}</p>}
      {successMsg && <p style={styles.successText}>{successMsg}</p>}

      {loading ? (
        <p style={styles.emptyText}>Loading members...</p>
      ) : (
        <ul style={styles.memberList}>
          {members.map((m) => {
            const isSelf = String(m.userId._id) === String(user.id || user._id);
            const canRemove = canInvite && m.role !== 'owner' && !isSelf;
            return (
              <li key={m._id} style={styles.memberRow}>
                <span style={styles.memberName}>{m.userId.name}</span>
                <span style={styles.memberRight}>
                  <span style={styles.roleTag}>{m.role}</span>
                  {canRemove && (
                    <button
                      onClick={() => handleRemove(m.userId._id, m.userId.name)}
                      style={styles.removeBtn}
                    >
                      Remove
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const styles = {
  panel: {
    marginBottom: '24px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  heading: {
    fontSize: '15px',
  },
  count: {
    fontFamily: 'var(--font-mono)',
    fontWeight: 400,
    color: 'var(--color-ink-soft)',
    fontSize: '13px',
  },
  toggleBtn: {
    background: 'none',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    padding: '6px 12px',
    fontSize: '13px',
  },
  inviteForm: {
    display: 'flex',
    gap: '8px',
    marginBottom: '14px',
  },
  roleSelect: {
    width: '110px',
    flexShrink: 0,
  },
  successText: {
    color: 'var(--color-success)',
    fontSize: '13px',
    marginTop: '-4px',
    marginBottom: '10px',
  },
  emptyText: {
    color: 'var(--color-ink-soft)',
    fontSize: '13px',
  },
  memberList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  memberRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
  },
  memberName: {
    color: 'var(--color-ink)',
  },
  memberRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-danger)',
    fontSize: '12px',
    padding: '2px 4px',
  },
  roleTag: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--color-ink-soft)',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
};