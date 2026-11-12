import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getMyWorkspacesApi, createWorkspaceApi, deleteWorkspaceApi } from '../api/workspaceApi';
import { connectSocket } from '../socket';
import SettingsModal from '../components/SettingsModal';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  // Live indicator: the server sends 'workspace-activity' to our personal
  // socket room whenever someone else writes in one of our workspaces.
  // We just bump that card's unread count. (The count is recomputed from
  // the database on the next page load, so this only needs to be right
  // for the time you're sitting on this page.)
  useEffect(() => {
    const socket = connectSocket();
    const handleActivity = ({ workspaceId }) => {
      setWorkspaces((prev) =>
        prev.map((ws) =>
          ws._id === workspaceId ? { ...ws, unreadCount: (ws.unreadCount || 0) + 1 } : ws
        )
      );
    };
    socket.on('workspace-activity', handleActivity);
    return () => socket.off('workspace-activity', handleActivity);
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
          <button
            onClick={toggleTheme}
            style={styles.themeBtn}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
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
              {theme === 'dark' ? (
                <>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </>
              ) : (
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              )}
            </svg>
          </button>
          <button onClick={() => setSettingsOpen(true)} style={styles.logoutBtn}>Settings</button>
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
                {ws.unreadCount > 0 && (
                  <span
                    style={styles.unreadBadge}
                    title={`${ws.unreadCount} new message${ws.unreadCount === 1 ? '' : 's'}`}
                    aria-label={`${ws.unreadCount} new message${ws.unreadCount === 1 ? '' : 's'}`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      fillOpacity="0.2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {ws.unreadCount > 9 ? '9+' : ws.unreadCount}
                  </span>
                )}
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

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
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
  themeBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    padding: '7px',
    color: 'var(--color-ink)',
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
    paddingRight: '56px', // keep long names clear of the unread badge and pin dot
  },
  unreadBadge: {
    position: 'absolute',
    top: '8px',
    right: '30px', // sits just left of the amber pin dot
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--color-accent)',
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