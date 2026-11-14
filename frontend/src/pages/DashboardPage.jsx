import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createWorkspaceApi, deleteWorkspaceApi } from '../api/workspaceApi';
import { useWorkspaces } from '../context/WorkspacesContext';

// Account controls (theme, settings, log out) now live in the sidebar, and
// the workspace list comes from shared state so both places stay in sync.
export default function DashboardPage() {
  const navigate = useNavigate();
  const { workspaces, loading, error: loadError, reload, removeWorkspace } = useWorkspaces();

  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Refresh when you land here, so unread counts are current.
  useEffect(() => {
    reload();
  }, [reload]);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setCreating(true);
    setError('');
    try {
      await createWorkspaceApi(newWorkspaceName.trim());
      setNewWorkspaceName('');
      await reload();
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
      removeWorkspace(workspaceId);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete workspace.');
    }
  };

  if (loading) {
    return <div className="page-loading">Loading your workspaces...</div>;
  }

  const shownError = error || loadError;

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Your workspaces</h1>

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

      {shownError && <p className="error-text">{shownError}</p>}

      {workspaces.length === 0 ? (
        <p style={styles.emptyText}>No workspaces yet. Create one above to get started.</p>
      ) : (
        <div style={styles.grid}>
          {workspaces.map((ws) => {
            const unreadLabel = `${ws.unreadCount} new message${ws.unreadCount === 1 ? '' : 's'}`;
            return (
              <div
                key={ws._id}
                className="pinned-card"
                style={styles.workspaceCard}
                onClick={() => navigate(`/workspaces/${ws._id}`)}
              >
                {ws.unreadCount > 0 && (
                  <span style={styles.unreadBadge} title={unreadLabel} aria-label={unreadLabel}>
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
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: '900px', margin: '0 auto', padding: '32px' },
  heading: { fontSize: '22px', marginBottom: '20px' },
  createForm: { display: 'flex', gap: '10px', marginBottom: '24px' },
  createInput: { flex: 1 },
  emptyText: { color: 'var(--color-ink-soft)', fontSize: '14px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' },
  workspaceCard: { cursor: 'pointer' },
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
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
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