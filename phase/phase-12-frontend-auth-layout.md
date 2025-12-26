# 📋 PHASE 12: Frontend - Authentication & Layout

> **Duration:** 2-3 days  
> **Dependencies:** Phase 11, Phase 3

---

## 🎯 Phase Objectives

Implement login/register UI, protected routes, and the main application layout with sidebar navigation.

---

## 📑 Task Breakdown

---

### 12.1-12.3 Login Page & Auth Context

```jsx
// pages/auth/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  
  const loginMutation = useMutation({
    mutationFn: (data) => api.post('/auth/login', data),
    onSuccess: (response) => {
      const { user, accessToken } = response.data.data;
      login(user, accessToken);
      navigate('/dashboard');
    },
    onError: (error) => {
      setErrors({ general: error.response?.data?.message || 'Login failed' });
    }
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    
    if (!formData.email) setErrors(prev => ({ ...prev, email: 'Email required' }));
    if (!formData.password) setErrors(prev => ({ ...prev, password: 'Password required' }));
    if (!formData.email || !formData.password) return;
    
    loginMutation.mutate(formData);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">TimeTuner</h1>
          <p className="text-gray-600 mt-2">Smart Timetable Scheduler</p>
        </div>
        
        {errors.general && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {errors.general}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            placeholder="admin@college.edu"
          />
          
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
            placeholder="••••••••"
          />
          
          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

---

### 12.4-12.6 Protected Routes & Token Management

```jsx
// components/common/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
}
```

---

### 12.7-12.10 Main Layout with Sidebar

```jsx
// components/layout/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

```jsx
// components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, DoorOpen, BookOpen, GraduationCap, 
  Calendar, Wand2, Settings
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/faculties', icon: Users, label: 'Faculties', roles: ['admin', 'hod', 'scheduler'] },
  { to: '/rooms', icon: DoorOpen, label: 'Rooms' },
  { to: '/subjects', icon: BookOpen, label: 'Subjects' },
  { to: '/batches', icon: GraduationCap, label: 'Batches' },
  { to: '/timetables', icon: Calendar, label: 'Timetables' },
  { to: '/solver', icon: Wand2, label: 'Generate', roles: ['admin', 'hod', 'scheduler'] }
];

export default function Sidebar() {
  const user = useAuthStore((state) => state.user);
  
  const filteredItems = navItems.filter(item => 
    !item.roles || item.roles.includes(user?.role)
  );
  
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-primary-600">TimeTuner</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-primary-50 text-primary-600 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100"
        >
          <Settings size={20} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
```

```jsx
// components/layout/Header.jsx
import { Bell, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          Welcome back, {user?.name}
        </h2>
        
        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center gap-3 pl-4 border-l">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
```

---

## ✅ Phase 12 Completion Checklist

```
□ Login page with form validation
□ Auth store managing tokens
□ Protected route wrapper
□ Auto-redirect on 401
□ Main layout with sidebar
□ Role-based menu items
□ Header with user info
□ Logout functionality
□ Breadcrumb system (optional)
□ Loading/error states
□ Changes committed to Git
```

---

## ⏭️ Next: Phase 13 - Dashboard & Data Management
