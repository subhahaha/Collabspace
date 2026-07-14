import apiClient from './axiosClient';

export const createTaskApi = (projectId, taskData) =>
  apiClient.post(`/api/projects/${projectId}/tasks`, taskData).then((res) => res.data);

export const getTasksByProjectApi = (projectId) =>
  apiClient.get(`/api/projects/${projectId}/tasks`).then((res) => res.data);

// updates can be a partial object, e.g. { status: 'in-progress' } for a
// drag-and-drop move, or { title: 'New title' } for an edit.
export const updateTaskApi = (taskId, updates) =>
  apiClient.patch(`/api/tasks/${taskId}`, updates).then((res) => res.data);

export const deleteTaskApi = (taskId) =>
  apiClient.delete(`/api/tasks/${taskId}`).then((res) => res.data);