import { useState, useEffect } from 'react';

// Handles both creating a new task (task=null) and editing an existing
// one (task passed in) — same form, different submit behavior. This
// avoids duplicating the whole form layout in two places.
export default function TaskModal({ task, members, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId?._id || '');
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? task.dueDate.slice(0, 10) : ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    setError('');
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div className="pinned-card" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.heading}>{task ? 'Edit Task' : 'New Task'}</h2>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label className="field-label" htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              className="field-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div style={styles.field}>
            <label className="field-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              className="field-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label className="field-label" htmlFor="assignee">Assignee</label>
              <select
                id="assignee"
                className="field-input"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId._id} value={m.userId._id}>
                    {m.userId.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label className="field-label" htmlFor="dueDate">Due date</label>
              <input
                id="dueDate"
                type="date"
                className="field-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          <div style={styles.actions}>
            {task && (
              <button
                type="button"
                onClick={() => onDelete(task._id).then(onClose)}
                style={styles.deleteBtn}
              >
                Delete
              </button>
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
  modal: {
    width: '440px',
    maxWidth: '90vw',
  },
  heading: {
    fontSize: '18px',
    marginBottom: '18px',
  },
  field: {
    marginBottom: '16px',
    flex: 1,
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
  },
  actionsRight: {
    display: 'flex',
    gap: '10px',
  },
  cancelBtn: {
    background: 'none',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    padding: '10px 16px',
    fontSize: '14px',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-danger)',
    fontSize: '13px',
    padding: '8px 4px',
  },
};