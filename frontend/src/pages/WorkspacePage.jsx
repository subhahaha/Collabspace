import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getWorkspaceByIdApi } from '../api/workspaceApi';
import { getProjectsByWorkspaceApi, createProjectApi } from '../api/projectApi';

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWorkspace();
  }, [workspaceId]);

  const loadWorkspace = async () => {
    try {
      const [workspaceData, projectsData] = await Promise.all([
        getWorkspaceByIdApi(workspaceId),
        getProjectsByWorkspaceApi(workspaceId),
      ]);
      setWorkspace(workspaceData.workspace);
      setProjects(projectsData.projects);
    } catch (err) {
      setError('Could not load this workspace.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;

    setCreating(true);
    setError('');
    try {
      const { project } = await createProjectApi(workspaceId, newProjectTitle.trim());
      setProjects((prev) => [project, ...prev]);
      setNewProjectTitle('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create project.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="page-loading">Loading workspace...</div>;
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <Link to="/dashboard" style={styles.backLink}>
          ← Back to dashboard
        </Link>
        <h1 style={styles.heading}>{workspace.name}</h1>
      </header>

      <form onSubmit={handleCreateProject} style={styles.createForm}>
        <input
          type="text"
          className="field-input"
          placeholder="New project title"
          value={newProjectTitle}
          onChange={(e) => setNewProjectTitle(e.target.value)}
          style={styles.createInput}
        />
        <button type="submit" className="btn-primary" disabled={creating}>
          {creating ? 'Creating...' : '+ Create Project'}
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}

      {projects.length === 0 ? (
        <p style={styles.emptyText}>
          No projects yet — create one above to start a Kanban board.
        </p>
      ) : (
        <div style={styles.grid}>
          {projects.map((project) => (
            <div
              key={project._id}
              className="pinned-card"
              style={styles.projectCard}
              onClick={() => navigate(`/projects/${project._id}`)}
            >
              <h3 style={styles.projectTitle}>{project.title}</h3>
              {project.description && (
                <p style={styles.projectDescription}>{project.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: '32px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '24px',
  },
  backLink: {
    fontSize: '13px',
    color: 'var(--color-ink-soft)',
    textDecoration: 'none',
  },
  heading: {
    fontSize: '22px',
    marginTop: '6px',
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
  projectCard: {
    cursor: 'pointer',
  },
  projectTitle: {
    fontSize: '16px',
    marginBottom: '6px',
  },
  projectDescription: {
    fontSize: '13px',
    color: 'var(--color-ink-soft)',
    margin: 0,
  },
};