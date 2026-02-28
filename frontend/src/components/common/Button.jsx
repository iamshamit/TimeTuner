import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const Button = forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    loading = false,
    disabled = false,
    asMotion = true,
    ...props
}, ref) => {
    const variants = {
        primary: 'bg-primary-500 text-white hover:bg-primary-600 shadow-glow',
        secondary: 'bg-surface-50 text-text-primary border border-border-glass hover:bg-surface-80',
        danger: 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30',
        success: 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30',
        ghost: 'text-text-muted hover:text-text-primary hover:bg-surface-50',
        outline: 'border border-primary-500/50 text-primary-400 hover:bg-primary-500/10',
        glow: 'bg-gradient-to-r from-primary-500 to-accent-purple text-white shadow-glow hover:shadow-glow-lg',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg'
    };

    const baseClasses = cn(
        'rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-background',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'flex items-center justify-center gap-2',
        variants[variant],
        sizes[size],
        className
    );

    const ButtonContent = (
        <>
            {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {children}
        </>
    );

    if (asMotion && !disabled && !loading) {
        return (
            <motion.button
                ref={ref}
                className={baseClasses}
                disabled={disabled || loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
                {...props}
            >
                {ButtonContent}
            </motion.button>
        );
    }

    return (
        <button
            ref={ref}
            className={baseClasses}
            disabled={disabled || loading}
            {...props}
        >
            {ButtonContent}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
