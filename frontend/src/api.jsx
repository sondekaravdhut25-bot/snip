import axios from 'axios';
import server from './environment.js'

const API_BASE = `${server}/api`;
const TOKEN_KEY = 'snip_token';
const EMAIL_KEY = 'snip_email';

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getEmail: () => localStorage.getItem(EMAIL_KEY),
  setSession: (token, email) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EMAIL_KEY, email);
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
  },
};

const api = axios.create({ baseURL: API_BASE });

// Attach the current token to every request, if we have one
api.interceptors.request.use((config) => {
  const token = auth.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
