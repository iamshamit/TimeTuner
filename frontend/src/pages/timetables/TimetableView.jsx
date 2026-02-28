import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Send, CheckCircle, Globe, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { timetablesAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { LoadingScreen } from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { getStatusColor, getDayName, cn } from '@/lib/utils';
import useAuthStore from '@/store/authStore';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_TIME_SLOTS = [
    { slot: 1, startTime: '09:00', endTime: '09:50' },
    { slot: 2, startTime: '09:50', endTime: '10:40' },
    { slot: 3, startTime: '10:50', endTime: '11:40' },
    { slot: 4, startTime: '11:40', endTime: '12:30' },
    { slot: 5, startTime: '14:00', endTime: '14:50' },
    { slot: 6, startTime: '14:50', endTime: '15:40' },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function TimetableView() {
    const { id } = useParams();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['timetable', id],
        queryFn: () => timetablesAPI.getOne(id)
    });

    const timetable = data?.data?.data;

    const submitMutation = useMutation({
        mutationFn: () => timetablesAPI.submit(id),
        onSuccess: () => queryClient.invalidateQueries(['timetable', id])
    });

    const approveMutation = useMutation({
        mutationFn: () => timetablesAPI.approve(id),
        onSuccess: () => queryClient.invalidateQueries(['timetable', id])
    });

    const publishMutation = useMutation({
        mutationFn: () => timetablesAPI.publish(id),
        onSuccess: () => queryClient.invalidateQueries(['timetable', id])
    });

    if (isLoading) {
        return <LoadingScreen message="Loading timetable..." />;
    }

    if (!timetable) {
        return (
            <EmptyState
                title="Timetable not found"
                description="The timetable you're looking for doesn't exist or has been deleted."
                action={
                    <Link to="/timetables">
                        <Button variant="outline">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Timetables
                        </Button>
                    </Link>
                }
            />
        );
    }

    const timeSlots = timetable.timeSlots?.slots || DEFAULT_TIME_SLOTS;

    const eventsByBatch = {};
    (timetable.events || []).forEach((event) => {
        const batchId = event.batch?._id || event.batch;
        if (!eventsByBatch[batchId]) {
            eventsByBatch[batchId] = {
                batch: event.batch,
                events: []
            };
        }
        eventsByBatch[batchId].events.push(event);
    });

    const getEventForSlot = (events, day, slot) => {
        return events.find(e => e.day === day && e.slot === slot);
    };

    const scorePercentage = ((timetable.score || 0) * 100).toFixed(0);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link to="/timetables" className="p-2 rounded-lg hover:bg-surface-50 text-text-muted hover:text-text-primary transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-2xl font-bold text-text-primary">{timetable.name}</h1>
                    </div>
                    <div className="flex items-center gap-4 ml-11">
                        <span className={cn('px-3 py-1 rounded-full text-xs font-medium', getStatusColor(timetable.status))}>
                            {timetable.status}
                        </span>
                        {/* Score Indicator */}
                        <div className="flex items-center gap-2">
                            <div className="relative w-10 h-10">
                                <svg className="w-10 h-10 -rotate-90">
                                    <circle
                                        cx="20"
                                        cy="20"
                                        r="16"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        className="text-surface"
                                    />
                                    <motion.circle
                                        cx="20"
                                        cy="20"
                                        r="16"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        className="text-primary-500"
                                        initial={{ strokeDasharray: '0 100' }}
                                        animate={{ strokeDasharray: `${scorePercentage} 100` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        style={{ strokeDashoffset: 0 }}
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-text-primary">
                                    {scorePercentage}%
                                </span>
                            </div>
                            <span className="text-sm text-text-muted">Score</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    {timetable.status === 'draft' && (
                        <Button
                            onClick={() => submitMutation.mutate()}
                            loading={submitMutation.isPending}
                        >
                            <Send className="w-4 h-4" />
                            Submit for Review
                        </Button>
                    )}

                    {timetable.status === 'review' && ['admin', 'hod'].includes(user?.role) && (
                        <Button
                            variant="success"
                            onClick={() => approveMutation.mutate()}
                            loading={approveMutation.isPending}
                        >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                        </Button>
                    )}

                    {timetable.status === 'approved' && user?.role === 'admin' && (
                        <Button
                            variant="glow"
                            onClick={() => publishMutation.mutate()}
                            loading={publishMutation.isPending}
                        >
                            <Globe className="w-4 h-4" />
                            Publish
                        </Button>
                    )}
                </div>
            </motion.div>

            {/* Timetable Grids */}
            {Object.entries(eventsByBatch).map(([batchId, { batch, events }], batchIndex) => (
                <motion.div
                    key={batchId}
                    variants={itemVariants}
                    custom={batchIndex}
                >
                    <Card title={`Batch: ${batch?.code || batchId}`} className="overflow-hidden">
                        <div className="overflow-x-auto custom-scrollbar -mx-6 -mb-6">
                            <table className="w-full border-collapse min-w-[800px]">
                                <thead>
                                    <tr>
                                        <th className="border border-border-glass p-3 bg-surface-80/50 w-32 text-text-muted text-sm font-medium">
                                            Time
                                        </th>
                                        {DAYS.map((day) => (
                                            <th key={day} className="border border-border-glass p-3 bg-surface-80/50 text-text-muted text-sm font-medium">
                                                {getDayName(day)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {timeSlots.filter(s => !s.isBreak).map((slotInfo) => {
                                        const slotNum = slotInfo.slot || slotInfo.slotNumber;
                                        return (
                                            <tr key={slotNum}>
                                                <td className="border border-border-glass p-2 bg-surface-80/30 text-center">
                                                    <div className="text-sm font-medium text-text-primary">Slot {slotNum}</div>
                                                    <div className="text-xs text-text-muted">{slotInfo.startTime} - {slotInfo.endTime}</div>
                                                </td>
                                                {DAYS.map((day) => {
                                                    const event = getEventForSlot(events, day, slotNum);
                                                    return (
                                                        <td key={day} className="border border-border-glass p-1 h-20">
                                                            {event && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    whileHover={{ scale: 1.02 }}
                                                                    transition={{ duration: 0.2 }}
                                                                    className={cn(
                                                                        'p-2 rounded-lg h-full cursor-pointer transition-all',
                                                                        event.subject?.isLab
                                                                            ? 'timetable-cell-lab'
                                                                            : 'timetable-cell-theory'
                                                                    )}
                                                                >
                                                                    <p className="font-medium text-sm text-text-primary">
                                                                        {event.subject?.code || event.subject}
                                                                    </p>
                                                                    <p className="text-xs text-text-muted mt-1">
                                                                        {event.faculty?.name || 'TBA'}
                                                                    </p>
                                                                    <p className="text-xs text-text-muted">
                                                                        {event.room?.code || 'TBA'}
                                                                    </p>
                                                                </motion.div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </motion.div>
            ))}

            {/* Legend */}
            <motion.div variants={itemVariants} className="flex items-center gap-6 px-4">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded timetable-cell-theory" />
                    <span className="text-sm text-text-muted">Theory</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded timetable-cell-lab" />
                    <span className="text-sm text-text-muted">Lab</span>
                </div>
            </motion.div>
        </motion.div>
    );
}
