import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Departments', href: '/departments', icon: '🏛️', roles: ['admin'] },
    { name: 'Faculties', href: '/faculties', icon: '👨‍🏫' },
    { name: 'Rooms', href: '/rooms', icon: '🚪' },
    { name: 'Subjects', href: '/subjects', icon: '📚' },
    { name: 'Batches', href: '/batches', icon: '👥' },
    { name: 'Timetables', href: '/timetables', icon: '📅' },
    { name: 'Solver', href: '/solver', icon: '⚙️', roles: ['admin', 'hod', 'scheduler'] },
    { name: 'Time Slots', href: '/time-slots', icon: '🕐', roles: ['admin'] }
];

export default function Sidebar({ collapsed = false }) {
    const location = useLocation();
    const { user } = useAuthStore();

    const filteredNav = navigation.filter(item => {
        if (!item.roles) return true;
        return item.roles.includes(user?.role);
    });

    return (
        <aside className={cn(
            'bg-gray-900 text-white h-screen fixed left-0 top-0 transition-all duration-300 z-40',
            collapsed ? 'w-16' : 'w-64'
        )}>
            <div className="flex items-center h-16 px-4 border-b border-gray-800">
                <span className="text-2xl">⏱️</span>
                {!collapsed && <span className="ml-3 text-xl font-bold">TimeTuner</span>}
            </div>

            <nav className="mt-6 px-2">
                {filteredNav.map((item) => {
                    const isActive = location.pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                                'flex items-center px-3 py-2.5 mb-1 rounded-lg transition-colors',
                                isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            )}
                        >
                            <span className="text-lg">{item.icon}</span>
                            {!collapsed && <span className="ml-3">{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
                <div className={cn('flex items-center', collapsed ? 'justify-center' : '')}>
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    {!collapsed && (
                        <div className="ml-3">
                            <p className="text-sm font-medium">{user?.name}</p>
                            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
