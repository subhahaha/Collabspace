import apiClient from './axiosClient';

export const signupApi = (name, email, password) =>
  apiClient.post('/api/auth/signup', { name, email, password }).then((res) => res.data);

export const loginApi = (email, password) =>
  apiClient.post('/api/auth/login', { email, password }).then((res) => res.data);

export const getMeApi = () => apiClient.get('/api/auth/me').then((res) => res.data);