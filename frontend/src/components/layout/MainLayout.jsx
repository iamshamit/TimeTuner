import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '@/lib/utils';

export default function MainLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Animated background orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        x: [0, 30, 0],
                        y: [0, -20, 0],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    className="bg-orb bg-orb-primary w-96 h-96 -top-48 -left-48"
                />
                <motion.div
                    animate={{
                        x: [0, -40, 0],
                        y: [0, 30, 0],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    className="bg-orb bg-orb-purple w-80 h-80 top-1/3 -right-40"
                />
                <motion.div
                    animate={{
                        x: [0, 20, 0],
                        y: [0, -30, 0],
                    }}
                    transition={{
                        duration: 18,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    className="bg-orb bg-orb-pink w-64 h-64 -bottom-32 left-1/4"
                />
            </div>

            <Sidebar collapsed={sidebarCollapsed} />
            <Header
                collapsed={sidebarCollapsed}
                onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <main className={cn(
                'pt-16 min-h-screen transition-all duration-300 relative z-10',
                sidebarCollapsed ? 'ml-16' : 'ml-64'
            )}>
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
