import { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate, useMatch } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWorkspaces } from '../context/WorkspacesContext';
import { getProjectsByWorkspaceApi } from '../api/projectApi';
import SettingsModal from './SettingsModal';
import Icon from './Icon';

const navClass = ({ isActive }) => `nav-item${isActive ? ' active' : ''}`;

export default function Sidebar({ open }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { workspaces } = useWorkspaces();
  const navigate = useNavigate();

  const activeWorkspaceId = useMatch('/workspaces/:workspaceId')?.params.workspaceId;
  const activeProjectId = useMatch('/projects/:projectId')?.params.projectId;

  const [expanded, setExpanded] = useState({}); // workspaceId -> is the project list open
  const [projectsByWorkspace, setProjectsByWorkspace] = useState({}); // workspaceId -> projects
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Whichever workspace you're viewing opens itself in the sidebar.
  useEffect(() => {
    if (!activeWorkspaceId) return;
    setExpanded((prev) => (prev[activeWorkspaceId] ? prev : { ...prev, [activeWorkspaceId]: true }));
  }, [activeWorkspaceId]);

  const loadProjects = useCallback(async (workspaceId) => {
    try {
      const data = await getProjectsByWorkspaceApi(workspaceId);
      setProjectsByWorkspace((prev) => ({ ...prev, [workspaceId]: data.projects }));
    } catch {
      // The sidebar is secondary UI: if this fails the list just stays as it was.
    }
  }, []);

  const reloadExpanded = useCallback(() => {
    Object.keys(expanded)
      .filter((id) => expanded[id])
      .forEach(loadProjects);
  }, [expanded, loadProjects]);

  // Load when a workspace is expanded, and refresh when you navigate
  // (e.g. back from a board).
  useEffect(() => {
    reloadExpanded();
  }, [reloadExpanded, activeWorkspaceId, activeProjectId]);

  // WorkspacePage fires this after creating a project, so the new project
  // shows up here immediately.
  useEffect(() => {
    window.addEventListener('projects-changed', reloadExpanded);
    return () => window.removeEventListener('projects-changed', reloadExpanded);
  }, [reloadExpanded]);

  const toggleExpanded = (workspaceId) =>
    setExpanded((prev) => ({ ...prev, [workspaceId]: !prev[workspaceId] }));

  const initial = user?.name?.[0]?.toUpperCase() || '?';

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <button className="sidebar-brand" onClick={() => navigate('/dashboard')}>
        CollabSpace
      </button>

      <nav className="sidebar-scroll">
        <NavLink to="/dashboard" className={navClass}>
          <Icon>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </Icon>
          Dashboard
        </NavLink>
        <NavLink to="/my-tasks" className={navClass}>
          <Icon>
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </Icon>
          My Tasks
        </NavLink>
        <NavLink to="/notes" className={navClass}>
          <Icon>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </Icon>
          Notes
        </NavLink>

        <div className="sidebar-label">Workspaces</div>
        {workspaces.length === 0 && <div className="nav-empty">No workspaces yet</div>}

        {workspaces.map((ws) => {
          const isOpen = !!expanded[ws._id];
          const projects = projectsByWorkspace[ws._id];
          return (
            <div key={ws._id}>
              <div className={`nav-item${activeWorkspaceId === ws._id ? ' active' : ''}`}>
                <button
                  type="button"
                  className="nav-ghost"
                  onClick={() => toggleExpanded(ws._id)}
                  aria-label={isOpen ? `Collapse ${ws.name}` : `Expand ${ws.name}`}
                  aria-expanded={isOpen}
                >
                  <span className={`nav-chevron${isOpen ? ' expanded' : ''}`}>
                    <Icon size={14}>
                      <polyline points="9 18 15 12 9 6" />
                    </Icon>
                  </span>
                </button>
                <button
                  type="button"
                  className="nav-ghost nav-ghost-main"
                  onClick={() => navigate(`/workspaces/${ws._id}`)}
                >
                  <span className="nav-label">{ws.name}</span>
                </button>
                {ws.unreadCount > 0 && (
                  <span className="nav-count" title={`${ws.unreadCount} new messages`}>
                    {ws.unreadCount > 9 ? '9+' : ws.unreadCount}
                  </span>
                )}
              </div>

              {isOpen && (
                <div className="nav-sub">
                  {projects && projects.length === 0 && (
                    <span className="nav-empty">No projects yet</span>
                  )}
                  {(projects || []).map((project) => (
                    <NavLink
                      key={project._id}
                      to={`/projects/${project._id}`}
                      className={`nav-item${activeProjectId === project._id ? ' active' : ''}`}
                    >
                      <span className="nav-label">{project.title}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-account">
        <div className="account-row">
          <div className="account-avatar">{initial}</div>
          <div className="account-name">{user?.name}</div>
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <Icon>
              {theme === 'dark' ? (
                <>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </>
              ) : (
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              )}
            </Icon>
          </button>
        </div>
        <div className="account-actions">
          <button onClick={() => setSettingsOpen(true)}>Settings</button>
          <button onClick={logout}>Log out</button>
        </div>
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </aside>
  );
}