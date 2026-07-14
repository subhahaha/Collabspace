import apiClient from './axiosClient';

export const createProjectApi = (workspaceId, title, description) =>
  apiClient
    .post(`/api/workspaces/${workspaceId}/projects`, { title, description })
    .then((res) => res.data);

export const getProjectsByWorkspaceApi = (workspaceId) =>
  apiClient.get(`/api/workspaces/${workspaceId}/projects`).then((res) => res.data);

export const getProjectByIdApi = (projectId) =>
  apiClient.get(`/api/projects/${projectId}`).then((res) => res.data);