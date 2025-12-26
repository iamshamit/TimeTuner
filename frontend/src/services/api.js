import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
    timeout: 30000,
    withCredentials: true
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip refresh for auth endpoints (login, register, refresh-token)
        const isAuthEndpoint = originalRequest.url?.includes('/auth/');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            try {
                const { data } = await axios.post(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/auth/refresh-token`,
                    {},
                    { withCredentials: true }
                );

                useAuthStore.getState().updateToken(data.data.accessToken);
                originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
                return api.request(originalRequest);
            } catch (refreshError) {
                useAuthStore.getState().logout();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    changePassword: (data) => api.patch('/auth/change-password', data),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password })
};

// Entity APIs
export const departmentsAPI = {
    getAll: (params) => api.get('/departments', { params }),
    getOne: (id) => api.get(`/departments/${id}`),
    create: (data) => api.post('/departments', data),
    update: (id, data) => api.patch(`/departments/${id}`, data),
    delete: (id) => api.delete(`/departments/${id}`)
};

export const facultiesAPI = {
    getAll: (params) => api.get('/faculties', { params }),
    getOne: (id) => api.get(`/faculties/${id}`),
    create: (data) => api.post('/faculties', data),
    update: (id, data) => api.patch(`/faculties/${id}`, data),
    delete: (id) => api.delete(`/faculties/${id}`),
    assignSubjects: (id, subjects) => api.post(`/faculties/${id}/subjects`, { subjects })
};

export const roomsAPI = {
    getAll: (params) => api.get('/rooms', { params }),
    getOne: (id) => api.get(`/rooms/${id}`),
    create: (data) => api.post('/rooms', data),
    update: (id, data) => api.patch(`/rooms/${id}`, data),
    delete: (id) => api.delete(`/rooms/${id}`),
    getAvailable: (params) => api.get('/rooms/available', { params })
};

export const subjectsAPI = {
    getAll: (params) => api.get('/subjects', { params }),
    getOne: (id) => api.get(`/subjects/${id}`),
    create: (data) => api.post('/subjects', data),
    update: (id, data) => api.patch(`/subjects/${id}`, data),
    delete: (id) => api.delete(`/subjects/${id}`)
};

export const batchesAPI = {
    getAll: (params) => api.get('/batches', { params }),
    getOne: (id) => api.get(`/batches/${id}`),
    create: (data) => api.post('/batches', data),
    update: (id, data) => api.patch(`/batches/${id}`, data),
    delete: (id) => api.delete(`/batches/${id}`),
    assignFaculty: (id, data) => api.post(`/batches/${id}/assign-faculty`, data)
};

export const solverAPI = {
    createJob: (data) => api.post('/solver/jobs', data),
    getJob: (id) => api.get(`/solver/jobs/${id}`),
    getJobs: (params) => api.get('/solver/jobs', { params }),
    cancelJob: (id) => api.post(`/solver/jobs/${id}/cancel`),
    validate: (data) => api.post('/solver/validate', data),
    health: () => api.get('/solver/health')
};

export const timetablesAPI = {
    getAll: (params) => api.get('/timetables', { params }),
    getOne: (id) => api.get(`/timetables/${id}`),
    update: (id, data) => api.patch(`/timetables/${id}`, data),
    delete: (id) => api.delete(`/timetables/${id}`),
    submit: (id) => api.post(`/timetables/${id}/submit`),
    approve: (id) => api.post(`/timetables/${id}/approve`),
    publish: (id) => api.post(`/timetables/${id}/publish`),
    addComment: (id, comment) => api.post(`/timetables/${id}/comments`, { comment }),
    getBatchTimetable: (batchId) => api.get(`/timetables/batch/${batchId}`),
    getFacultyTimetable: (facultyId) => api.get(`/timetables/faculty/${facultyId}`)
};

export const timeSlotsAPI = {
    getAll: (params) => api.get('/time-slots', { params }),
    getOne: (id) => api.get(`/time-slots/${id}`),
    create: (data) => api.post('/time-slots', data),
    update: (id, data) => api.patch(`/time-slots/${id}`, data),
    delete: (id) => api.delete(`/time-slots/${id}`)
};
