import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyTasksApi } from '../api/taskApi';

const DAY = 24 * 60 * 60 * 1000;

const STATUS_LABELS = { todo: 'To Do', 'in-progress': 'In Progress' };

const SECTIONS = [
  { key: 'overdue', label: 'Overdue' },
  { key: 'soon', label: 'Due in the next 7 days' },
  { key: 'later', label: 'Later' },
  { key: 'none', label: 'No due date' },
];

// Due dates are saved as UTC midnight (that's what a <input type="date">
// value becomes). Rebuild them as a plain local calendar date so "today"
// comparisons don't shift by a day depending on the time zone.
const toLocalDate = (iso) => {
  const d = new Date(iso);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

function groupTasks(tasks) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today.getTime() + 7 * DAY);

  const groups = { overdue: [], soon: [], later: [], none: [] };
  tasks.forEach((task) => {
    if (!task.dueDate) {
      groups.none.push(task);
      return;
    }
    const due = toLocalDate(task.dueDate);
    if (due < today) groups.overdue.push(task);
    else if (due <= weekEnd) groups.soon.push(task);
    else groups.later.push(task);
  });

  const byDueDate = (a, b) => new Date(a.dueDate) - new Date(b.dueDate);
  groups.overdue.sort(byDueDate);
  groups.soon.sort(byDueDate);
  groups.later.sort(byDueDate);
  return groups;
}

export default function MyTasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyTasksApi()
      .then((data) => setTasks(data.tasks))
      .catch(() => setError('Could not load your tasks.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="page-loading">Loading your tasks...</div>;
  }

  const groups = groupTasks(tasks);

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>My Tasks</h1>
      <p style={styles.subheading}>
        {tasks.length === 0
          ? 'Open tasks assigned to you, from every workspace.'
          : `${tasks.length} open task${tasks.length === 1 ? '' : 's'} assigned to you, across all workspaces.`}
      </p>

      {error && <p className="error-text">{error}</p>}

      {!error && tasks.length === 0 && (
        <p style={styles.empty}>
          Nothing assigned to you right now. When someone assigns you a task on a board, it shows up here.
        </p>
      )}

      {SECTIONS.map(({ key, label }) =>
        groups[key].length === 0 ? null : (
          <section key={key} style={styles.section}>
            <h2 style={{ ...styles.sectionTitle, ...(key === 'overdue' ? styles.overdueTitle : {}) }}>
              {label} <span style={styles.count}>{groups[key].length}</span>
            </h2>
            <div style={styles.list}>
              {groups[key].map((task) => (
                <div
                  key={task._id}
                  className="pinned-card"
                  style={styles.taskCard}
                  onClick={() => navigate(`/projects/${task.projectId}`)}
                >
                  <div style={styles.taskMain}>
                    <p style={styles.taskTitle}>{task.title}</p>
                    <p style={styles.taskWhere}>
                      {task.workspaceName} / {task.projectTitle}
                    </p>
                  </div>
                  <div style={styles.taskMeta}>
                    <span style={styles.statusTag}>{STATUS_LABELS[task.status]}</span>
                    {task.dueDate && (
                      <span style={{ ...styles.dueDate, ...(key === 'overdue' ? styles.overdueDate : {}) }}>
                        {toLocalDate(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      )}
    </div>
  );
}

const styles = {
  page: { padding: '32px', maxWidth: '800px', margin: '0 auto' },
  heading: { fontSize: '22px' },
  subheading: { color: 'var(--color-ink-soft)', fontSize: '14px', margin: '6px 0 28px 0' },
  empty: { color: 'var(--color-ink-soft)', fontSize: '14px' },
  section: { marginBottom: '28px' },
  sectionTitle: {
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    color: 'var(--color-ink-soft)',
    marginBottom: '12px',
  },
  overdueTitle: { color: 'var(--color-danger)' },
  count: { fontFamily: 'var(--font-mono)', fontWeight: 400, marginLeft: '4px' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  taskCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    cursor: 'pointer',
    padding: '14px 40px 14px 18px', // right padding clears the pin dot
  },
  taskMain: { minWidth: 0 },
  taskTitle: { fontSize: '14px', fontWeight: 500, margin: 0 },
  taskWhere: { fontSize: '12px', color: 'var(--color-ink-soft)', margin: '4px 0 0 0' },
  taskMeta: { display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 },
  statusTag: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    color: 'var(--color-ink-soft)',
  },
  dueDate: { fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-ink-soft)' },
  overdueDate: { color: 'var(--color-danger)' },
};