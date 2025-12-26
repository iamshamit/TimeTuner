# 📋 PHASE 11: Frontend - Foundation & Setup

> **Duration:** 2-3 days  
> **Dependencies:** Phase 1  
> **Note:** Using React + Vite (NOT Next.js)

---

## 🎯 Phase Objectives

Set up the React frontend with Vite, configure styling, state management, routing, and API client.

---

## 📑 Task Breakdown

---

### 11.1-11.2 React + Vite & UI Library Setup

```bash
# Create React project with Vite
npm create vite@latest frontend -- --template react
cd frontend
npm install

# Install core dependencies
npm install react-router-dom axios zustand @tanstack/react-query

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Configure Tailwind (`tailwind.config.js`):**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { 50: '#eff6ff', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
        secondary: { 50: '#f8fafc', 500: '#64748b', 600: '#475569' }
      }
    }
  },
  plugins: []
}
```

**Add to `src/index.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: #3b82f6;
  --secondary: #64748b;
}
```

---

### 11.3-11.5 Folder Structure & Routing

```
frontend/src/
├── components/
│   ├── common/          # Button, Input, Modal, Table
│   ├── layout/          # Header, Sidebar, MainLayout
│   └── timetable/       # TimetableGrid, EventCard
├── pages/
│   ├── auth/            # Login, Register
│   ├── dashboard/
│   ├── faculties/
│   ├── rooms/
│   ├── batches/
│   ├── subjects/
│   ├── timetables/
│   └── solver/
├── hooks/               # Custom hooks
├── services/            # API services
├── store/               # Zustand stores
├── lib/                 # Utilities
├── App.jsx
└── main.jsx
```

```jsx
// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import FacultyList from './pages/faculties/FacultyList';
import RoomList from './pages/rooms/RoomList';
import TimetableList from './pages/timetables/TimetableList';
import TimetableView from './pages/timetables/TimetableView';
import SolverPage from './pages/solver/SolverPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 }
  }
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/faculties" element={<FacultyList />} />
            <Route path="/rooms" element={<RoomList />} />
            <Route path="/subjects" element={<SubjectList />} />
            <Route path="/batches" element={<BatchList />} />
            <Route path="/timetables" element={<TimetableList />} />
            <Route path="/timetables/:id" element={<TimetableView />} />
            <Route path="/solver" element={<SolverPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

---

### 11.6-11.7 State Management & API Client

```javascript
// store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      
      login: (user, token) => set({ user, accessToken: token, isAuthenticated: true }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
      updateToken: (token) => set({ accessToken: token }),
      
      getToken: () => get().accessToken
    }),
    { name: 'auth-storage' }
  )
);

export default useAuthStore;
```

```javascript
// services/api.js
import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 30000
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        useAuthStore.getState().updateToken(data.accessToken);
        error.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api.request(error.config);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### 11.8-11.10 Environment, Theme & Base Components

```javascript
// lib/utils.js
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}
```

```jsx
// components/common/Button.jsx
export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-gray-600 hover:bg-gray-100'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      className={`rounded-lg font-medium transition-colors disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

```jsx
// components/common/Input.jsx
export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
```

```jsx
// components/common/Card.jsx
export default function Card({ children, title, actions, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-6 py-4 border-b">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
```

---

## ✅ Phase 11 Completion Checklist

```
□ Vite + React project created
□ Tailwind CSS configured
□ Folder structure organized
□ React Router configured
□ Zustand store created
□ API client with interceptors
□ Environment variables set
□ Base components (Button, Input, Card)
□ Theme system ready
□ Changes committed to Git
```

---

## ⏭️ Next: Phase 12 - Frontend Auth & Layout
