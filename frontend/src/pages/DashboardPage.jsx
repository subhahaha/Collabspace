import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyWorkspacesApi, createWorkspaceApi, deleteWorkspaceApi } from '../api/workspaceApi';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const data = await getMyWorkspacesApi();
      setWorkspaces(data.workspaces);
    } catch (err) {
      setError('Could not load workspaces.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setCreating(true);
    setError('');
    try {
      await createWorkspaceApi(newWorkspaceName.trim());
      setNewWorkspaceName('');
      // Re-fetch rather than manually inserting into state — keeps this
      // simple for now; we'll revisit if the list ever gets large enough
      // that a full refetch feels slow.
      await loadWorkspaces();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create workspace.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWorkspace = async (e, workspaceId, workspaceName) => {
    e.stopPropagation(); // don't trigger the card's navigate-to-workspace click
    const confirmed = window.confirm(
      `Delete "${workspaceName}"? This will permanently delete all its projects and tasks. This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteWorkspaceApi(workspaceId);
      setWorkspaces((prev) => prev.filter((ws) => ws._id !== workspaceId));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete workspace.');
    }
  };

  if (loading) {
    return <div className="page-loading">Loading your workspaces...</div>;
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.heading}>CollabSpace</h1>
        <div style={styles.headerRight}>
          <span style={styles.userName}>{user?.name}</span>
          <button onClick={logout} style={styles.logoutBtn}>Log out</button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.topRow}>
          <h2 style={styles.sectionTitle}>Your workspaces</h2>
        </div>

        <form onSubmit={handleCreateWorkspace} style={styles.createForm}>
          <input
            type="text"
            className="field-input"
            placeholder="New workspace name"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            style={styles.createInput}
          />
          <button type="submit" className="btn-primary" disabled={creating}>
            {creating ? 'Creating...' : '+ Create'}
          </button>
        </form>

        {error && <p className="error-text">{error}</p>}

        {workspaces.length === 0 ? (
          <p style={styles.emptyText}>
            No workspaces yet — create one above to get started.
          </p>
        ) : (
          <div style={styles.grid}>
            {workspaces.map((ws) => (
              <div
                key={ws._id}
                className="pinned-card"
                style={styles.workspaceCard}
                onClick={() => navigate(`/workspaces/${ws._id}`)}
              >
                <h3 style={styles.workspaceName}>{ws.name}</h3>
                <div style={styles.cardFooter}>
                  <span style={styles.roleTag}>{ws.role}</span>
                  {ws.role === 'owner' && (
                    <button
                      onClick={(e) => handleDeleteWorkspace(e, ws._id, ws.name)}
                      style={styles.deleteBtn}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 32px',
    background: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
  },
  heading: {
    fontSize: '20px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userName: {
    fontSize: '14px',
    color: 'var(--color-ink-soft)',
  },
  logoutBtn: {
    background: 'none',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    padding: '8px 14px',
    fontSize: '13px',
    color: 'var(--color-ink)',
  },
  main: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '40px 32px',
  },
  topRow: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '18px',
  },
  createForm: {
    display: 'flex',
    gap: '10px',
    marginBottom: '24px',
  },
  createInput: {
    flex: 1,
  },
  emptyText: {
    color: 'var(--color-ink-soft)',
    fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '16px',
  },
  workspaceCard: {
    cursor: 'pointer',
  },
  workspaceName: {
    fontSize: '16px',
    marginBottom: '10px',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteBtn: {
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