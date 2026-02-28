import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function LoadingSpinner({ size = 'md', className }) {
    const sizes = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-16 h-16',
    };

    return (
        <div className={cn('flex items-center justify-center', className)}>
            <motion.div
                className={cn(
                    sizes[size],
                    'rounded-full border-2 border-primary-500/30 border-t-primary-500'
                )}
                animate={{ rotate: 360 }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />
        </div>
    );
}

export function LoadingScreen({ message = 'Loading...' }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <LoadingSpinner size="lg" />
            </motion.div>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-text-muted"
            >
                {message}
            </motion.p>
        </div>
    );
}
