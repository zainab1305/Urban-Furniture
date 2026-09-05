import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const apiBaseUrl = configuredApiUrl ? `${configuredApiUrl}/api` : '/api';
const apiOrigin = configuredApiUrl || `${window.location.protocol}//${window.location.hostname}:5000`;

export function getAssetUrl(assetPath) {
  if (!assetPath || assetPath.startsWith('data:') || assetPath.startsWith('blob:') || /^https?:\/\//i.test(assetPath)) {
    return assetPath;
  }
  return `${apiOrigin}${assetPath.startsWith('/') ? assetPath : `/${assetPath}`}`;
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
