import { cn } from '@/lib/utils';

export default function Input({
    label,
    error,
    className = '',
    type = 'text',
    ...props
}) {
    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                    {label}
                </label>
            )}
            <input
                type={type}
                className={cn(
                    'glass-input w-full',
                    error && 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50'
                )}
                {...props}
            />
            {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        </div>
    );
}

export function Select({ label, error, options = [], className = '', children, ...props }) {
    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                    {label}
                </label>
            )}
            <select
                className={cn(
                    'glass-input w-full appearance-none cursor-pointer',
                    "bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a1a1aa%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')]",
                    'bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-10',
                    error && 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50'
                )}
                {...props}
            >
                {children ? children : options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        </div>
    );
}
