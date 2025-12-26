import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Layout
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import DepartmentsPage from './pages/departments/DepartmentsPage';
import FacultiesPage from './pages/faculties/FacultiesPage';
import RoomsPage from './pages/rooms/RoomsPage';
import SubjectsPage from './pages/subjects/SubjectsPage';
import BatchesPage from './pages/batches/BatchesPage';
import SolverPage from './pages/solver/SolverPage';
import TimetableList from './pages/timetables/TimetableList';
import TimetableView from './pages/timetables/TimetableView';
import TimeSlotsPage from './pages/settings/TimeSlotsPage';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false
        }
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
                        <Route path="/departments" element={<DepartmentsPage />} />
                        <Route path="/faculties" element={<FacultiesPage />} />
                        <Route path="/rooms" element={<RoomsPage />} />
                        <Route path="/subjects" element={<SubjectsPage />} />
                        <Route path="/batches" element={<BatchesPage />} />
                        <Route path="/timetables" element={<TimetableList />} />
                        <Route path="/timetables/:id" element={<TimetableView />} />
                        <Route path="/solver" element={<SolverPage />} />
                        <Route path="/time-slots" element={<TimeSlotsPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
}
