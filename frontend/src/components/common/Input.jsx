import { cn } from '../../lib/utils';

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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <input
                type={type}
                className={cn(
                    'w-full px-3 py-2 border rounded-lg transition-colors',
                    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none',
                    'disabled:bg-gray-100 disabled:cursor-not-allowed',
                    error ? 'border-red-500' : 'border-gray-300'
                )}
                {...props}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
}

export function Select({ label, error, options = [], className = '', children, ...props }) {
    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <select
                className={cn(
                    'w-full px-3 py-2 border rounded-lg transition-colors bg-white',
                    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none',
                    error ? 'border-red-500' : 'border-gray-300'
                )}
                {...props}
            >
                {children ? children : options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
}
