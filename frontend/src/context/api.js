import axios from 'axios';
const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL, // Make sure this is correctly set in your .env file
    withCredentials: true,
});

export const googleAuth = (code) => api.get(`/api/auth/google?code=${code}`);
