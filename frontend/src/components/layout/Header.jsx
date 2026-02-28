import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, LogOut, User, ChevronDown } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { authAPI } from '@/services/api';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
            'glass-header h-16 fixed top-0 right-0 z-30 transition-all duration-300',
            collapsed ? 'left-16' : 'left-64'
        )}>
            <div className="flex items-center justify-between h-full px-6">
                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onToggleSidebar}
                        className="p-2 rounded-lg hover:bg-surface-50 text-text-muted hover:text-text-primary transition-colors"
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <Menu className="w-5 h-5" />
                    </motion.button>
                </div>

                <div className="flex items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-50 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-white font-medium ring-2 ring-primary-500/30">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="text-left hidden sm:block">
                                    <p className="text-sm font-medium text-text-primary">{user?.name}</p>
                                    <p className="text-xs text-text-muted capitalize">{user?.role}</p>
                                </div>
                                <ChevronDown className="w-4 h-4 text-text-muted" />
                            </motion.button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div>
                                    <p className="font-medium">{user?.name}</p>
                                    <p className="text-xs text-text-muted font-normal">{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer">
                                <User className="w-4 h-4 mr-2" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
