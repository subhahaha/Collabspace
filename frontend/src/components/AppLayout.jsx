import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { WorkspacesProvider } from '../context/WorkspacesContext';
import Sidebar from './Sidebar';
import Icon from './Icon';
import './layout.css';

// Wraps every logged-in page: sidebar on the left, the page itself on the
// right (<Outlet /> is where React Router puts the matched page).
export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // On phones the sidebar is a slide-over; close it after you navigate.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <WorkspacesProvider>
      <div className="app-shell">
        <div
          className={`sidebar-backdrop${sidebarOpen ? ' open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />
        <Sidebar open={sidebarOpen} />
        <main className="app-main">
          <div className="mobile-topbar">
            <button
              className="icon-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Icon>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </Icon>
            </button>
            CollabSpace
          </div>
          <Outlet />
        </main>
      </div>
    </WorkspacesProvider>
  );
}