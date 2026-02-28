import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Plus, ArrowRight } from 'lucide-react';
import { timetablesAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { LoadingScreen } from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { getStatusColor, formatDate, cn } from '@/lib/utils';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function TimetableList() {
    const { data, isLoading } = useQuery({
        queryKey: ['timetables'],
        queryFn: () => timetablesAPI.getAll({ limit: 50 })
    });

    const timetables = data?.data?.data || [];

    if (isLoading) {
        return <LoadingScreen message="Loading timetables..." />;
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-500/20 border border-primary-500/30">
                        <Calendar className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">Timetables</h1>
                        <p className="text-text-muted mt-1">View and manage generated timetables</p>
                    </div>
                </div>
                <Link to="/solver">
                    <Button variant="glow">
                        <Plus className="w-4 h-4" />
                        Generate New
                    </Button>
                </Link>
            </motion.div>

            <motion.div variants={itemVariants}>
                {timetables.length > 0 ? (
                    <Card padding={false}>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full">
                                <thead className="bg-surface-80/50 border-b border-border-glass">
                                    <tr>
                                        <th className="text-left px-6 py-3 text-sm font-medium text-text-muted">Name</th>
                                        <th className="text-left px-6 py-3 text-sm font-medium text-text-muted">Department</th>
                                        <th className="text-left px-6 py-3 text-sm font-medium text-text-muted">Semester</th>
                                        <th className="text-left px-6 py-3 text-sm font-medium text-text-muted">Score</th>
                                        <th className="text-left px-6 py-3 text-sm font-medium text-text-muted">Status</th>
                                        <th className="text-left px-6 py-3 text-sm font-medium text-text-muted">Created</th>
                                        <th className="text-left px-6 py-3 text-sm font-medium text-text-muted">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {timetables.map((tt, index) => (
                                        <motion.tr
                                            key={tt._id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="border-b border-border-glass/50 hover:bg-primary-500/5 transition-colors group"
                                        >
                                            <td className="px-6 py-4 font-medium text-text-primary">{tt.name}</td>
                                            <td className="px-6 py-4 text-text-muted">{tt.department?.code || '-'}</td>
                                            <td className="px-6 py-4 text-text-muted">Sem {tt.semester}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(tt.score || 0) * 100}%` }}
                                                            transition={{ duration: 0.5, delay: index * 0.05 }}
                                                            className="bg-primary-500 h-full rounded-full"
                                                        />
                                                    </div>
                                                    <span className="text-sm text-text-muted">{((tt.score || 0) * 100).toFixed(0)}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    'px-2.5 py-1 rounded-full text-xs font-medium',
                                                    getStatusColor(tt.status)
                                                )}>
                                                    {tt.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-muted">
                                                {formatDate(tt.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link to={`/timetables/${tt._id}`}>
                                                    <Button size="sm" variant="ghost" className="group-hover:text-primary-400">
                                                        View
                                                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </Button>
                                                </Link>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ) : (
                    <Card>
                        <EmptyState
                            icon={Calendar}
                            title="No timetables found"
                            description="Generate your first timetable using the solver"
                            action={
                                <Link to="/solver">
                                    <Button variant="glow">
                                        <Plus className="w-4 h-4" />
                                        Generate Timetable
                                    </Button>
                                </Link>
                            }
                        />
                    </Card>
                )}
            </motion.div>
        </motion.div>
    );
}
