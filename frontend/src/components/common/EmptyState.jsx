import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={cn(
                'flex flex-col items-center justify-center py-12 px-6 text-center',
                className
            )}
        >
            {Icon && (
                <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="mb-4 p-4 rounded-full bg-surface-50 border border-border-glass"
                >
                    <Icon className="w-10 h-10 text-primary-400" />
                </motion.div>
            )}
            <h3 className="text-lg font-semibold text-text-primary mb-2">
                {title}
            </h3>
            {description && (
                <p className="text-text-muted max-w-sm mb-6">
                    {description}
                </p>
            )}
            {action && (
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {action}
                </motion.div>
            )}
        </motion.div>
    );
}
