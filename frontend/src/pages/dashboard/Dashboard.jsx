import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Building2,
    Users,
    DoorOpen,
    GraduationCap,
    Calendar,
    FileCheck,
    FileEdit,
    ArrowRight
} from 'lucide-react';
import { StatCard } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { departmentsAPI, facultiesAPI, roomsAPI, batchesAPI, timetablesAPI } from '@/services/api';
import useAuthStore from '@/store/authStore';
import { cn } from '@/lib/utils';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function Dashboard() {
    const { user } = useAuthStore();

    const { data: departments } = useQuery({
        queryKey: ['departments'],
        queryFn: () => departmentsAPI.getAll({ limit: 100 })
    });

    const { data: faculties } = useQuery({
        queryKey: ['faculties'],
        queryFn: () => facultiesAPI.getAll({ limit: 100 })
    });

    const { data: rooms } = useQuery({
        queryKey: ['rooms'],
        queryFn: () => roomsAPI.getAll({ limit: 100 })
    });

    const { data: batches } = useQuery({
        queryKey: ['batches'],
        queryFn: () => batchesAPI.getAll({ limit: 100 })
    });

    const { data: timetables } = useQuery({
        queryKey: ['timetables'],
        queryFn: () => timetablesAPI.getAll({ limit: 100 })
    });

    const stats = [
        {
            title: 'Departments',
            value: departments?.data?.data?.length || 0,
            icon: Building2,
            color: 'blue'
        },
        {
            title: 'Faculties',
            value: faculties?.data?.data?.length || 0,
            icon: Users,
            color: 'green'
        },
        {
            title: 'Rooms',
            value: rooms?.data?.data?.length || 0,
            icon: DoorOpen,
            color: 'yellow'
        },
        {
            title: 'Batches',
            value: batches?.data?.data?.length || 0,
            icon: GraduationCap,
            color: 'purple'
        }
    ];

    const publishedTimetables = timetables?.data?.data?.filter(t => t.status === 'published') || [];
    const draftTimetables = timetables?.data?.data?.filter(t => t.status === 'draft') || [];

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Welcome Section */}
            <motion.div variants={itemVariants}>
                <h1 className="text-3xl font-bold">
                    <span className="text-text-primary">Welcome back, </span>
                    <span className="text-gradient">{user?.name}!</span>
                </h1>
                <p className="text-text-muted mt-2">Here's what's happening with your timetables</p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {stats.map((stat, index) => (
                    <StatCard
                        key={stat.title}
                        title={stat.title}
                        value={stat.value}
                        icon={stat.icon}
                        color={stat.color}
                        delay={index * 0.1}
                    />
                ))}
            </motion.div>

            {/* Timetables Section */}
            <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
                {/* Published Timetables */}
                <motion.div
                    whileHover={{ y: -2 }}
                    className="glass-card p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                            <FileCheck className="w-5 h-5 text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary">Published Timetables</h3>
                    </div>
                    {publishedTimetables.length > 0 ? (
                        <ul className="space-y-3">
                            {publishedTimetables.slice(0, 5).map((tt, index) => (
                                <motion.li
                                    key={tt._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Link
                                        to={`/timetables/${tt._id}`}
                                        className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-4 h-4 text-green-400" />
                                            <span className="font-medium text-text-primary">{tt.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-text-muted">
                                                Semester {tt.semester}
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-green-400 transition-colors" />
                                        </div>
                                    </Link>
                                </motion.li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                            <FileCheck className="w-12 h-12 text-text-muted/30 mb-3" />
                            <p className="text-text-muted text-center">No published timetables yet</p>
                        </div>
                    )}
                </motion.div>

                {/* Draft Timetables */}
                <motion.div
                    whileHover={{ y: -2 }}
                    className="glass-card p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-zinc-500/20 border border-zinc-500/30">
                            <FileEdit className="w-5 h-5 text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary">Draft Timetables</h3>
                    </div>
                    {draftTimetables.length > 0 ? (
                        <ul className="space-y-3">
                            {draftTimetables.slice(0, 5).map((tt, index) => (
                                <motion.li
                                    key={tt._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Link
                                        to={`/timetables/${tt._id}`}
                                        className="flex items-center justify-between p-3 rounded-lg bg-surface-50 border border-border-glass hover:border-primary-500/30 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-4 h-4 text-text-muted" />
                                            <span className="font-medium text-text-primary">{tt.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary-500 rounded-full"
                                                        style={{ width: `${(tt.score || 0) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-text-muted">
                                                    {((tt.score || 0) * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary-400 transition-colors" />
                                        </div>
                                    </Link>
                                </motion.li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                            <FileEdit className="w-12 h-12 text-text-muted/30 mb-3" />
                            <p className="text-text-muted text-center mb-4">No draft timetables</p>
                            <Link to="/solver">
                                <Button variant="outline" size="sm">
                                    Generate Timetable
                                </Button>
                            </Link>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
