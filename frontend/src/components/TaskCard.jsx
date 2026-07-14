import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Each card is registered with useSortable using its task._id as the
// unique id — this is how dnd-kit tracks which card is where, and lets
// it calculate smooth positions while dragging.
export default function TaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="pinned-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <p style={styles.title}>{task.title}</p>
      {task.assigneeId && (
        <span style={styles.assignee}>{task.assigneeId.name}</span>
      )}
      {task.dueDate && (
        <span style={styles.dueDate}>
          {new Date(task.dueDate).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}

const styles = {
  title: {
    fontSize: '14px',
    fontWeight: 500,
    margin: 0,
    marginBottom: '8px',
    cursor: 'grab',
  },
  assignee: {
    display: 'inline-block',
    fontSize: '12px',
    color: 'var(--color-ink-soft)',
    marginRight: '10px',
  },
  dueDate: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--color-ink-soft)',
  },
};