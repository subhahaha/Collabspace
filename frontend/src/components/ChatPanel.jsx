import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMessagesApi } from '../api/messageApi';
import { connectSocket, disconnectSocket } from '../socket';

// Just the time, e.g. "10:32 AM" — the date itself is now handled
// separately by the divider labels between groups of messages.
const formatTime = (isoString) =>
  new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

// Label shown once per group of messages from the same day — "Today"
// if it's today, "Yesterday" if it's yesterday, otherwise a short date.
const formatDateDivider = (isoString) => {
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const isSameDay = (isoA, isoB) => new Date(isoA).toDateString() === new Date(isoB).toDateString();

export default function ChatPanel({ workspaceId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Runs when this panel mounts (i.e. when you open a workspace).
  // IMPORTANT: socket connection + listener setup happens synchronously
  // here (no `await` before it). If this were wrapped in an async
  // function, React StrictMode's dev-mode double-invoke (mount ->
  // cleanup -> mount, done deliberately to catch bugs like this one)
  // can run the cleanup before the async code finishes connecting,
  // leaving an orphaned listener behind — which is exactly what caused
  // messages to appear twice. Keeping this part synchronous means
  // cleanup always matches up correctly with what was set up.
  useEffect(() => {
    const socket = connectSocket();
    socket.emit('join-workspace', workspaceId);

    const handleNewMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };
    const handleSocketError = (err) => {
      console.error('Socket error:', err.message);
    };

    socket.on('new-message', handleNewMessage);
    socket.on('error', handleSocketError);

    // History loading is separate and can safely be async — even if
    // StrictMode causes this to run twice, it just re-fetches and
    // overwrites state with the same result, which is harmless.
    getMessagesApi(workspaceId)
      .then((data) => setMessages(data.messages))
      .catch((err) => console.error('Failed to load message history', err))
      .finally(() => setLoading(false));

    return () => {
      socket.emit('leave-workspace', workspaceId);
      // Passing the exact function reference removes only OUR listener,
      // rather than wiping out every 'new-message' listener on the
      // socket (which matters once other components also use it).
      socket.off('new-message', handleNewMessage);
      socket.off('error', handleSocketError);
    };
  }, [workspaceId]);

  // Auto-scroll to the latest message whenever the list changes.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;

    const socket = connectSocket();
    // We don't add the message to state here — we wait for the server's
    // 'new-message' broadcast to come back (including to us). This keeps
    // one single source of truth for what's actually in the chat, rather
    // than a local "optimistic" copy that could drift from reality.
    socket.emit('send-message', { workspaceId, text: draft.trim() });
    setDraft('');
  };

  return (
    <div style={styles.panel}>
      <h3 style={styles.heading}>Chat</h3>

      <div style={styles.messageList}>
        {loading ? (
          <p style={styles.emptyText}>Loading messages...</p>
        ) : messages.length === 0 ? (
          <p style={styles.emptyText}>No messages yet — say hello!</p>
        ) : (
          messages.map((msg, index) => {
            // Explicit String() conversion guards against comparing
            // an ObjectId-like value to a plain string, which would
            // silently fail (=== is strict — "123" === "123" is true,
            // but two differently-typed representations of the same
            // id might not be, depending on where they came from).
            const isMine = String(msg.senderId._id) === String(user.id || user._id);

            // Show a date divider before the first message overall, and
            // before the first message of any NEW day — this replaces
            // repeating the date on every single message.
            const prevMsg = messages[index - 1];
            const showDivider = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);

            return (
              <div key={msg._id} style={{ display: 'flex', flexDirection: 'column' }}>
                {showDivider && (
                  <div style={styles.dateDivider}>
                    <span>{formatDateDivider(msg.createdAt)}</span>
                  </div>
                )}
                <div
                  style={{
                    ...styles.messageRow,
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                  }}
                >
                  <span style={styles.sender}>
                    {isMine ? 'You' : msg.senderId.name}
                    <span style={styles.timestamp}> · {formatTime(msg.createdAt)}</span>
                  </span>
                  <p
                    style={{
                      ...styles.messageText,
                      ...(isMine ? styles.messageTextMine : {}),
                    }}
                  >
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={styles.inputRow}>
        <input
          type="text"
          className="field-input"
          placeholder="Type a message..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="btn-primary">Send</button>
      </form>
    </div>
  );
}

const styles = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
  },
  heading: {
    fontSize: '14px',
    padding: '14px 16px',
    borderBottom: '1px solid var(--color-border)',
  },
  messageList: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  emptyText: {
    fontSize: '13px',
    color: 'var(--color-ink-soft)',
  },
  messageRow: {
    maxWidth: '85%',
    display: 'flex',
    flexDirection: 'column',
  },
  dateDivider: {
    textAlign: 'center',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--color-ink-soft)',
    margin: '4px 0 12px 0',
  },
  sender: {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--color-ink-soft)',
    marginBottom: '3px',
  },
  timestamp: {
    opacity: 0.7,
  },
  messageText: {
    fontSize: '14px',
    margin: 0,
    background: 'var(--color-bg)',
    padding: '8px 12px',
    borderRadius: 'var(--radius)',
    display: 'inline-block',
  },
  messageTextMine: {
    background: 'var(--color-accent)',
    color: 'var(--color-accent-ink)',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    padding: '12px',
    borderTop: '1px solid var(--color-border)',
  },
};