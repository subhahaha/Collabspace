import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// We keep ONE socket instance for the whole app (not one per component)
// — same principle as the axios instance in Stage 6. autoConnect: false
// means it won't try to connect until we explicitly call connectSocket(),
// which matters since we only want to connect once someone is logged in.
let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: false });
  }
  return socket;
}

// Called when entering a page that needs real-time updates. Refreshes
// the auth token each time in case it changed since the socket was
// first created (e.g. after a fresh login).
export function connectSocket() {
  const s = getSocket();
  s.auth = { token: localStorage.getItem('token') };
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}