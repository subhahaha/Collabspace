import { useParams, Link } from 'react-router-dom';

// Placeholder for now — Stage 7 will replace this with the actual
// project list + Kanban board for this workspace.
export default function WorkspacePage() {
  const { workspaceId } = useParams();

  return (
    <div style={{ padding: '40px' }}>
      <Link to="/dashboard" style={{ color: 'var(--color-ink-soft)', fontSize: '14px' }}>
        ← Back to dashboard
      </Link>
      <h1 style={{ marginTop: '16px' }}>Workspace</h1>
      <p style={{ color: 'var(--color-ink-soft)' }}>
        Workspace ID: <code style={{ fontFamily: 'var(--font-mono)' }}>{workspaceId}</code>
      </p>
      <p style={{ color: 'var(--color-ink-soft)' }}>
        Kanban board coming in Stage 7.
      </p>
    </div>
  );
}