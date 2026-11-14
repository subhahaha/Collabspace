import { useState, useEffect } from 'react';

const MAX_TITLE = 100;
const MAX_CONTENT = 5000;

// One form for both creating (note = null) and editing a note.
export default function NoteModal({ note, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) {
      setError('Write a title or some content first.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(title, content);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save note.');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this note? This cannot be undone.')) return;
    try {
      await onDelete(note._id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete note.');
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div className="pinned-card" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.heading}>{note ? 'Edit note' : 'New note'}</h2>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label className="field-label" htmlFor="noteTitle">Title (optional)</label>
            <input
              id="noteTitle"
              type="text"
              className="field-input"
              value={title}
              maxLength={MAX_TITLE}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div style={styles.field}>
            <label className="field-label" htmlFor="noteContent">Note</label>
            <textarea
              id="noteContent"
              className="field-input"
              rows={10}
              value={content}
              maxLength={MAX_CONTENT}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ideas, reminders, anything you want to remember..."
              style={styles.textarea}
            />
            <p style={styles.counter}>{content.length} / {MAX_CONTENT}</p>
          </div>

          {error && <p className="error-text">{error}</p>}

          <div style={styles.actions}>
            {note ? (
              <button type="button" onClick={handleDelete} style={styles.deleteBtn}>
                Delete
              </button>
            ) : (
              <span />
            )}
            <div style={styles.actionsRight}>
              <button type="button" onClick={onClose} style={styles.cancelBtn}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(27, 35, 64, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: { width: '520px', maxWidth: '92vw' },
  heading: { fontSize: '18px', marginBottom: '18px' },
  field: { marginBottom: '16px' },
  textarea: { resize: 'vertical', lineHeight: 1.5 },
  counter: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--color-ink-soft)',
    margin: '6px 0 0 0',
    textAlign: 'right',
  },
  actions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' },
  actionsRight: { display: 'flex', gap: '10px' },
  cancelBtn: {
    background: 'none',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    padding: '10px 16px',
    fontSize: '14px',
    color: 'var(--color-ink)',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-danger)',
    fontSize: '13px',
    padding: '8px 4px',
  },
};