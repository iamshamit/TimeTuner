import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '../../lib/utils';

export default function MainLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar collapsed={sidebarCollapsed} />
            <Header
                collapsed={sidebarCollapsed}
                onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <main className={cn(
                'pt-16 min-h-screen transition-all duration-300',
                sidebarCollapsed ? 'ml-16' : 'ml-64'
            )}>
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
