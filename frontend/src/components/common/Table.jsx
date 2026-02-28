import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import { FileX } from 'lucide-react';

const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
        opacity: 1,
        x: 0,
        transition: {
            delay: i * 0.05,
            duration: 0.3,
            ease: 'easeOut',
        },
    }),
};

export default function Table({ columns, data, loading, emptyMessage = 'No data found', onRowClick }) {
    if (loading) {
        return (
            <div className="glass-card p-8">
                <LoadingSpinner size="md" className="py-8" />
                <p className="text-text-muted text-center mt-4">Loading...</p>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="glass-card">
                <EmptyState
                    icon={FileX}
                    title={emptyMessage}
                    description="No records found matching your criteria"
                />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card overflow-hidden"
        >
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                    <thead className="bg-surface-80/50 border-b border-border-glass">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider"
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIdx) => (
                            <motion.tr
                                key={row._id || row.id || rowIdx}
                                custom={rowIdx}
                                variants={rowVariants}
                                initial="hidden"
                                animate="visible"
                                className={cn(
                                    'border-b border-border-glass/50 transition-colors',
                                    onRowClick && 'hover:bg-primary-500/5 cursor-pointer'
                                )}
                                onClick={() => onRowClick && onRowClick(row)}
                                whileHover={onRowClick ? { backgroundColor: 'rgba(99, 102, 241, 0.05)' } : undefined}
                            >
                                {columns.map((col) => (
                                    <td key={col.key} className="px-4 py-3 text-sm text-text-primary">
                                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                                    </td>
                                ))}
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
