import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('sugamseva_token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('sugamseva_token');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('sugamseva_token');
};

// Initialize token on load
const token = getAuthToken();
if (token) {
  setAuthToken(token);
}

export default api;
