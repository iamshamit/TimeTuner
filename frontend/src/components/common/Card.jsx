import { motion } from 'framer-motion';
import { cn, statCardColors } from '@/lib/utils';

export default function Card({ children, title, actions, className = '', padding = true }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn('glass-card', className)}
        >
            {(title || actions) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-glass">
                    {title && <h3 className="text-lg font-semibold text-text-primary">{title}</h3>}
                    {actions && <div className="flex gap-2">{actions}</div>}
                </div>
            )}
            <div className={padding ? 'p-6' : ''}>{children}</div>
        </motion.div>
    );
}

export function StatCard({ title, value, icon: Icon, trend, color = 'blue', delay = 0 }) {
    const colors = statCardColors[color] || statCardColors.blue;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="glass-card-hover p-6"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-text-muted">{title}</p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: delay + 0.2 }}
                        className="text-2xl font-bold text-text-primary mt-1"
                    >
                        {value}
                    </motion.p>
                    {trend !== undefined && (
                        <p className={cn('text-sm mt-1', trend > 0 ? 'text-green-400' : 'text-red-400')}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                        </p>
                    )}
                </div>
                {Icon && (
                    <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        className={cn('p-3 rounded-lg border', colors.bg, colors.border)}
                    >
                        <Icon className={cn('w-6 h-6', colors.text)} />
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
