import apiClient from './axiosClient';

export const createWorkspaceApi = (name) =>
  apiClient.post('/api/workspaces', { name }).then((res) => res.data);

export const getMyWorkspacesApi = () =>
  apiClient.get('/api/workspaces').then((res) => res.data);

export const getWorkspaceByIdApi = (workspaceId) =>
  apiClient.get(`/api/workspaces/${workspaceId}`).then((res) => res.data);

export const addMemberApi = (workspaceId, email, role) =>
  apiClient.post(`/api/workspaces/${workspaceId}/members`, { email, role }).then((res) => res.data);

export const getWorkspaceMembersApi = (workspaceId) =>
  apiClient.get(`/api/workspaces/${workspaceId}/members`).then((res) => res.data);

export const deleteWorkspaceApi = (workspaceId) =>
  apiClient.delete(`/api/workspaces/${workspaceId}`).then((res) => res.data);

export const removeMemberApi = (workspaceId, userId) =>
  apiClient.delete(`/api/workspaces/${workspaceId}/members/${userId}`).then((res) => res.data);