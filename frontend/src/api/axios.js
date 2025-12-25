import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use your machine's IP address for mobile testing
// Replace with your actual local IP or backend URL
// const API_URL = 'http://10.0.2.2:5000/api'; // Android emulator
// const API_URL = 'http://localhost:5000/api'; // iOS simulator
const API_URL = 'http://10.51.2.37:5000/api'; // Physical device

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
        }
        return Promise.reject(error);
    }
);

export default api;
