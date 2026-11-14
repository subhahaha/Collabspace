import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useMatch } from 'react-router-dom';
import { getMyWorkspacesApi } from '../api/workspaceApi';
import { connectSocket } from '../socket';

const WorkspacesContext = createContext(null);

// The sidebar and the dashboard both need the workspace list (with unread
// counts). Keeping it in one place means they can never disagree, and a
// new message updates the badge in both at once.
export function WorkspacesProvider({ children }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Which workspace's chat is on screen right now (if any).
  const openMatch = useMatch('/workspaces/:workspaceId');
  const openWorkspaceId = openMatch?.params.workspaceId;
  const openWorkspaceIdRef = useRef(openWorkspaceId);
  openWorkspaceIdRef.current = openWorkspaceId;

  const reload = useCallback(async () => {
    try {
      const data = await getMyWorkspacesApi();
      setWorkspaces(data.workspaces);
      setError('');
    } catch {
      setError('Could not load workspaces.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Opening a workspace means its chat is being read (ChatPanel tells the
  // server), so clear the badge locally too.
  useEffect(() => {
    if (!openWorkspaceId) return;
    setWorkspaces((prev) =>
      prev.map((ws) =>
        ws._id === openWorkspaceId && ws.unreadCount ? { ...ws, unreadCount: 0 } : ws
      )
    );
  }, [openWorkspaceId, loading]);

  // The server pings our personal socket room whenever someone else writes
  // in one of our workspaces. Skip it for the workspace we're looking at:
  // that chat is already showing the message.
  useEffect(() => {
    const socket = connectSocket();
    const handleActivity = ({ workspaceId }) => {
      if (workspaceId === openWorkspaceIdRef.current) return;
      setWorkspaces((prev) =>
        prev.map((ws) =>
          ws._id === workspaceId ? { ...ws, unreadCount: (ws.unreadCount || 0) + 1 } : ws
        )
      );
    };
    socket.on('workspace-activity', handleActivity);
    return () => socket.off('workspace-activity', handleActivity);
  }, []);

  const removeWorkspace = (workspaceId) =>
    setWorkspaces((prev) => prev.filter((ws) => ws._id !== workspaceId));

  return (
    <WorkspacesContext.Provider value={{ workspaces, loading, error, reload, removeWorkspace }}>
      {children}
    </WorkspacesContext.Provider>
  );
}

export function useWorkspaces() {
  return useContext(WorkspacesContext);
}