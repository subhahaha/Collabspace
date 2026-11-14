import apiClient from './axiosClient';

export const getNotesApi = () => apiClient.get('/api/notes').then((res) => res.data);

export const createNoteApi = (title, content) =>
  apiClient.post('/api/notes', { title, content }).then((res) => res.data);

export const updateNoteApi = (noteId, title, content) =>
  apiClient.put(`/api/notes/${noteId}`, { title, content }).then((res) => res.data);

export const deleteNoteApi = (noteId) =>
  apiClient.delete(`/api/notes/${noteId}`).then((res) => res.data);