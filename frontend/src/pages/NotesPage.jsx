import { useState, useEffect } from 'react';
import { getNotesApi, createNoteApi, updateNoteApi, deleteNoteApi } from '../api/noteApi';
import NoteModal from '../components/NoteModal';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeNote, setActiveNote] = useState(null); // null = writing a new note

  useEffect(() => {
    getNotesApi()
      .then((data) => setNotes(data.notes))
      .catch(() => setError('Could not load your notes.'))
      .finally(() => setLoading(false));
  }, []);

  const openNew = () => {
    setActiveNote(null);
    setModalOpen(true);
  };

  const openExisting = (note) => {
    setActiveNote(note);
    setModalOpen(true);
  };

  const handleSave = async (title, content) => {
    if (activeNote) {
      const { note } = await updateNoteApi(activeNote._id, title, content);
      // An edited note jumps to the top, matching the server's newest-first order.
      setNotes((prev) => [note, ...prev.filter((n) => n._id !== note._id)]);
    } else {
      const { note } = await createNoteApi(title, content);
      setNotes((prev) => [note, ...prev]);
    }
  };

  const handleDelete = async (noteId) => {
    await deleteNoteApi(noteId);
    setNotes((prev) => prev.filter((n) => n._id !== noteId));
  };

  const query = search.trim().toLowerCase();
  const visibleNotes = query
    ? notes.filter((n) => `${n.title} ${n.content}`.toLowerCase().includes(query))
    : notes;

  if (loading) {
    return <div className="page-loading">Loading your notes...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.topRow}>
        <div>
          <h1 style={styles.heading}>Notes</h1>
          <p style={styles.subheading}>Your private notes. Only you can see these.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ New note</button>
      </div>

      {notes.length > 0 && (
        <input
          type="text"
          className="field-input"
          placeholder="Search notes"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />
      )}

      {error && <p className="error-text">{error}</p>}

      {!error && notes.length === 0 && (
        <p style={styles.empty}>No notes yet. Click "New note" to jot something down.</p>
      )}

      {notes.length > 0 && visibleNotes.length === 0 && (
        <p style={styles.empty}>No notes match "{search}".</p>
      )}

      <div style={styles.grid}>
        {visibleNotes.map((note) => (
          <div
            key={note._id}
            className="pinned-card"
            style={styles.noteCard}
            onClick={() => openExisting(note)}
          >
            <h3 style={styles.noteTitle}>{note.title || 'Untitled'}</h3>
            {note.content && <p style={styles.notePreview}>{note.content}</p>}
            <span style={styles.noteDate}>
              {new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </div>
        ))}
      </div>

      {modalOpen && (
        <NoteModal
          note={activeNote}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

const styles = {
  page: { padding: '32px', maxWidth: '900px', margin: '0 auto' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  heading: { fontSize: '22px' },
  subheading: { color: 'var(--color-ink-soft)', fontSize: '14px', margin: '6px 0 0 0' },
  search: { marginBottom: '20px' },
  empty: { color: 'var(--color-ink-soft)', fontSize: '14px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' },
  noteCard: { cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '120px' },
  noteTitle: { fontSize: '15px', paddingRight: '16px' },
  notePreview: {
    fontSize: '13px',
    color: 'var(--color-ink-soft)',
    margin: 0,
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 4,
    WebkitBoxOrient: 'vertical',
  },
  noteDate: {
    marginTop: 'auto',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--color-ink-soft)',
  },
};