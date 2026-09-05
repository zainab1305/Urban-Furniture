import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const apiBaseUrl = configuredApiUrl ? `${configuredApiUrl}/api` : '/api';

export const api = axios.create({ baseURL: apiBaseUrl, headers: { 'Content-Type': 'application/json' } });
