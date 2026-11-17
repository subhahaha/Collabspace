import apiClient from './axiosClient';

export const getMessagesApi = (workspaceId) =>
  apiClient.get(`/api/workspaces/${workspaceId}/messages`).then((res) => res.data);