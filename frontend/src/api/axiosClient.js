import axios from 'axios';

// One shared axios instance for the whole app. baseURL means every call
// just needs a path like '/api/auth/login' instead of the full URL —
// and when we deploy, we change this ONE line instead of hunting through
// every file that makes an API call.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

// This runs before EVERY request made with apiClient. It's the frontend
// equivalent of what we did manually in Postman — attaching
// "Authorization: Bearer <token>" — except now it happens automatically,
// on every single call, without us repeating this logic everywhere.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;