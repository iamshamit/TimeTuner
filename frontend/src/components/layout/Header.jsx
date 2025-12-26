import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { authAPI } from '../../services/api';
import Button from '../common/Button';
import { cn } from '../../lib/utils';

export default function Header({ collapsed, onToggleSidebar }) {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        try {
            await authAPI.logout();
        } catch (e) {
            // Ignore errors
        }
        logout();
        navigate('/login');
    };

    return (
        <header className={cn(
            'bg-white border-b border-gray-200 h-16 fixed top-0 right-0 z-30 transition-all duration-300',
            collapsed ? 'left-16' : 'left-64'
        )}>
            <div className="flex items-center justify-between h-full px-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                        </button>

                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                            <div className="p-3 border-b border-gray-100">
                                <p className="font-medium text-gray-900">{user?.name}</p>
                                <p className="text-sm text-gray-500">{user?.email}</p>
                            </div>
                            <div className="p-2">
                                <Button variant="ghost" className="w-full justify-start text-red-600" onClick={handleLogout}>
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
