import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Building2,
    Users,
    DoorOpen,
    BookOpen,
    GraduationCap,
    Calendar,
    Settings,
    Clock,
    Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useAuthStore from '@/store/authStore';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Departments', href: '/departments', icon: Building2, roles: ['admin'] },
    { name: 'Faculties', href: '/faculties', icon: Users },
    { name: 'Rooms', href: '/rooms', icon: DoorOpen },
    { name: 'Subjects', href: '/subjects', icon: BookOpen },
    { name: 'Batches', href: '/batches', icon: GraduationCap },
    { name: 'Timetables', href: '/timetables', icon: Calendar },
    { name: 'Solver', href: '/solver', icon: Settings, roles: ['admin', 'hod', 'scheduler'] },
    { name: 'Time Slots', href: '/time-slots', icon: Clock, roles: ['admin'] }
];

const sidebarVariants = {
    expanded: { width: 256 },
    collapsed: { width: 64 },
};

const navItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
        opacity: 1,
        x: 0,
        transition: {
            delay: i * 0.05,
            duration: 0.3,
        },
    }),
};

export default function Sidebar({ collapsed = false }) {
    const location = useLocation();
    const { user } = useAuthStore();

    const filteredNav = navigation.filter(item => {
        if (!item.roles) return true;
        return item.roles.includes(user?.role);
    });

    return (
        <motion.aside
            variants={sidebarVariants}
            animate={collapsed ? 'collapsed' : 'expanded'}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="glass-sidebar h-screen fixed left-0 top-0 z-40 flex flex-col"
        >
            {/* Logo */}
            <div className="flex items-center h-16 px-4 border-b border-border-glass">
                <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="w-8 h-8 flex items-center justify-center"
                >
                    <Timer className="w-6 h-6 text-primary-400" />
                </motion.div>
                {!collapsed && (
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="ml-3 text-xl font-bold text-gradient"
                    >
                        TimeTuner
                    </motion.span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 mt-6 px-2 overflow-y-auto custom-scrollbar">
                {filteredNav.map((item, index) => {
                    const isActive = location.pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <motion.div
                            key={item.name}
                            custom={index}
                            variants={navItemVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <Link
                                to={item.href}
                                className={cn(
                                    'flex items-center px-3 py-2.5 mb-1 rounded-lg transition-all duration-200 group relative',
                                    isActive
                                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                                        : 'text-text-muted hover:bg-surface-50 hover:text-text-primary'
                                )}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Icon className={cn(
                                        'w-5 h-5',
                                        isActive ? 'text-primary-400' : 'text-text-muted group-hover:text-text-primary'
                                    )} />
                                </motion.div>
                                {!collapsed && (
                                    <span className="ml-3">{item.name}</span>
                                )}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeIndicator"
                                        className="absolute left-0 w-1 h-6 bg-primary-500 rounded-r-full"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </Link>
                        </motion.div>
                    );
                })}
            </nav>

            {/* User section */}
            <div className={cn(
                'border-t border-border-glass',
                collapsed ? 'p-2' : 'p-4'
            )}>
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={cn(
                        'flex items-center rounded-lg bg-surface-50/50',
                        collapsed ? 'justify-center p-2' : 'p-2'
                    )}
                    title={collapsed ? `${user?.name} (${user?.role})` : undefined}
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-white font-medium ring-2 ring-primary-500/30 flex-shrink-0">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="ml-3 min-w-0"
                        >
                            <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
                            <p className="text-xs text-text-muted capitalize truncate">{user?.role}</p>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </motion.aside>
    );
}
