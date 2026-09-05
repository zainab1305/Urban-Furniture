import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const browserApiUrl = typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? `${window.location.protocol}//${window.location.hostname}:5000`
  : '';
const apiBaseUrl = configuredApiUrl ? `${configuredApiUrl}/api` : browserApiUrl ? `${browserApiUrl}/api` : '/api';

export function assetUrl(assetPath) {
  if (!assetPath || assetPath.startsWith('data:') || assetPath.startsWith('blob:') || assetPath.startsWith('http')) {
    return assetPath;
  }

  if (configuredApiUrl) {
    return `${configuredApiUrl}${assetPath}`;
  }

  if (browserApiUrl) {
    return `${browserApiUrl}${assetPath}`;
  }

  return assetPath;
}

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

// Attach bearer token if available in sessionStorage (backup to httpOnly cookie)
api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('uf_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      sessionStorage.removeItem('uf_auth_token');
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export async function loginApi({ loginId, password }) {
  const response = await api.post('/auth/login', { loginId, password });
  if (response.data?.data?.token) {
    sessionStorage.setItem('uf_auth_token', response.data.data.token);
  }
  return response.data;
}

export async function signupApi({ loginId, email, password, confirmPassword, name }) {
  const response = await api.post('/auth/signup', {
    loginId,
    email,
    password,
    confirmPassword,
    name
  });
  if (response.data?.data?.token) {
    sessionStorage.setItem('uf_auth_token', response.data.data.token);
  }
  return response.data;
}

export async function logoutApi() {
  try {
    await api.post('/auth/logout');
  } finally {
    sessionStorage.removeItem('uf_auth_token');
  }
}

export async function getSessionApi() {
  const response = await api.get('/auth/session');
  return response.data;
}

export async function checkLoginIdApi(loginId) {
  const response = await api.get('/auth/check-login-id', {
    params: { loginId }
  });
  return response.data;
}

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  users: params => api.get('/admin/users', { params }),
  createUser: payload => api.post('/admin/users', payload),
  updateUser: (id, payload) => api.patch(`/admin/users/${id}`, payload),
  archiveUser: id => api.delete(`/admin/users/${id}`)
};
