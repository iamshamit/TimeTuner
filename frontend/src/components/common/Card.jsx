import { cn } from '../../lib/utils';

export default function Card({ children, title, actions, className = '', padding = true }) {
    return (
        <div className={cn('bg-white rounded-xl shadow-sm border border-gray-200', className)}>
            {(title || actions) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
                    {actions && <div className="flex gap-2">{actions}</div>}
                </div>
            )}
            <div className={padding ? 'p-6' : ''}>{children}</div>
        </div>
    );
}

export function StatCard({ title, value, icon, trend, color = 'blue' }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        purple: 'bg-purple-50 text-purple-600'
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    {trend && (
                        <p className={cn('text-sm mt-1', trend > 0 ? 'text-green-600' : 'text-red-600')}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                        </p>
                    )}
                </div>
                {icon && (
                    <div className={cn('p-3 rounded-lg', colors[color])}>
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
