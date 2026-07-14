import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { getProjectByIdApi } from '../api/projectApi';
import { getWorkspaceMembersApi } from '../api/workspaceApi';
import { getTasksByProjectApi, createTaskApi, updateTaskApi, deleteTaskApi } from '../api/taskApi';
import KanbanColumn from '../components/KanbanColumn';
import TaskModal from '../components/TaskModal';

const STATUSES = ['todo', 'in-progress', 'done'];

export default function ProjectBoardPage() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null); // null = creating a new task

  // Requires the pointer to move a few pixels before a drag starts —
  // without this, a plain click (to open the edit modal) would
  // sometimes get misread as the start of a drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    loadBoard();
  }, [projectId]);

  const loadBoard = async () => {
    try {
      const projectData = await getProjectByIdApi(projectId);
      setProject(projectData.project);

      const [membersData, tasksData] = await Promise.all([
        getWorkspaceMembersApi(projectData.project.workspaceId),
        getTasksByProjectApi(projectId),
      ]);
      setMembers(membersData.members);
      setTasks(tasksData.tasks);
    } catch (err) {
      console.error('Failed to load board', err);
    } finally {
      setLoading(false);
    }
  };

  const tasksByStatus = (status) => tasks.filter((t) => t.status === status);

  // Fires when a drag ends anywhere on the board. `over.id` is either
  // another task's id (dropped near another card) or a column's status
  // string (dropped on empty column space) — we normalize both cases
  // down to "which status column did this land in."
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    let newStatus = over.id;
    if (STATUSES.indexOf(newStatus) === -1) {
      // over.id was a task id, not a column id — find that task's status.
      const overTask = tasks.find((t) => t._id === over.id);
      newStatus = overTask ? overTask.status : task.status;
    }

    if (newStatus === task.status) return;

    // Optimistic update: change the UI immediately so the drag feels
    // instant, then sync to the backend. If the request fails, we
    // roll back by reloading the real data.
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)));

    try {
      await updateTaskApi(taskId, { status: newStatus });
    } catch (err) {
      console.error('Failed to update task status', err);
      loadBoard();
    }
  };

  const openCreateModal = () => {
    setActiveTask(null);
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setActiveTask(task);
    setModalOpen(true);
  };

  const handleSaveTask = async (taskData) => {
    if (activeTask) {
      const { task } = await updateTaskApi(activeTask._id, taskData);
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    } else {
      const { task } = await createTaskApi(projectId, taskData);
      setTasks((prev) => [...prev, task]);
    }
  };

  const handleDeleteTask = async (taskId) => {
    await deleteTaskApi(taskId);
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  };

  if (loading) {
    return <div className="page-loading">Loading board...</div>;
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <Link to={`/workspaces/${project.workspaceId}`} style={styles.backLink}>
            ← Back to workspace
          </Link>
          <h1 style={styles.heading}>{project.title}</h1>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          + New Task
        </button>
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div style={styles.board}>
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus(status)}
              onTaskClick={openEditModal}
            />
          ))}
        </div>
      </DndContext>

      {modalOpen && (
        <TaskModal
          task={activeTask}
          members={members}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: '32px',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  backLink: {
    fontSize: '13px',
    color: 'var(--color-ink-soft)',
    textDecoration: 'none',
  },
  heading: {
    fontSize: '22px',
    marginTop: '6px',
  },
  board: {
    display: 'flex',
    gap: '18px',
  },
};