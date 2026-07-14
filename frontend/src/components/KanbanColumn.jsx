import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

const COLUMN_LABELS = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};

// A column represents one status value ('todo', 'in-progress', 'done').
// useDroppable registers this column as a valid drop target — when a
// card is dropped here, we'll know which column (status) it landed in.
export default function KanbanColumn({ status, tasks, onTaskClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      style={{ ...styles.column, ...(isOver ? styles.columnOver : {}) }}
    >
      <div style={styles.columnHeader}>
        <h3 style={styles.columnTitle}>{COLUMN_LABELS[status]}</h3>
        <span style={styles.count}>{tasks.length}</span>
      </div>

      <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div style={styles.cardList}>
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

const styles = {
  column: {
    background: 'rgba(27, 35, 64, 0.03)',
    borderRadius: 'var(--radius)',
    padding: '14px',
    minHeight: '200px',
    flex: 1,
    transition: 'background 0.15s ease',
  },
  columnOver: {
    background: 'rgba(232, 163, 61, 0.12)',
  },
  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    padding: '0 4px',
  },
  columnTitle: {
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    color: 'var(--color-ink-soft)',
  },
  count: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--color-ink-soft)',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
};