import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors and extract data
api.interceptors.response.use(
    (response) => {
        // Return response.data (which maps to our backend { success, message, data })
        return response.data;
    },
    (error) => {
        console.error("API error response:", error.response);
        const customError = {
            message: error.response?.data?.message || "Something went wrong. Please try again.",
            status: error.response?.status || 500,
            success: false,
            data: error.response?.data?.data || null
        };
        return Promise.reject(customError);
    }
);

export default api;
