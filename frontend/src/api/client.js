import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event('inventory:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export function getApiError(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (data?.errors?.length) return data.errors.join(' ');
  return data?.error || error?.message || fallback;
}

export default api;
