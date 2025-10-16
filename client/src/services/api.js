import axios from 'axios';

const runtimeBase = (() => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  if (typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost') {
    // En prod (Pages, Netlify...), utiliser le même domaine (chemin /api proxy ou edge)
    return '';
  }
  // Dev local
  return 'http://localhost:5000';
})();

const api = axios.create({
  baseURL: runtimeBase,
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
