import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Settings, Play, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { solverAPI, departmentsAPI } from '@/services/api';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { Select } from '@/components/common/Input';
import { getStatusColor, formatDate, cn } from '@/lib/utils';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function SolverPage() {
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const queryClient = useQueryClient();

    const { data: departments } = useQuery({
        queryKey: ['departments'],
        queryFn: () => departmentsAPI.getAll({ limit: 100 })
    });

    const { data: jobs, isLoading: jobsLoading } = useQuery({
        queryKey: ['solver-jobs'],
        queryFn: () => solverAPI.getJobs({ limit: 10 }),
        refetchInterval: 5000
    });

    const createJobMutation = useMutation({
        mutationFn: (data) => solverAPI.createJob(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['solver-jobs']);
        }
    });

    const handleGenerate = () => {
        if (!selectedDept || !selectedSemester) return;

        createJobMutation.mutate({
            department: selectedDept,
            semester: parseInt(selectedSemester),
            options: {
                name: `Timetable Generation - ${new Date().toLocaleDateString()}`
            }
        });
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-400" />;
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-400" />;
            case 'running':
                return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
            default:
                return <Clock className="w-4 h-4 text-yellow-400" />;
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            <motion.div variants={itemVariants}>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-500/20 border border-primary-500/30">
                        <Settings className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">Timetable Solver</h1>
                        <p className="text-text-muted mt-1">Generate optimized timetables using constraint programming</p>
                    </div>
                </div>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card title="Generate New Timetable">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                            label="Department"
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                        >
                            <option value="">Select Department</option>
                            {departments?.data?.data?.map(d => (
                                <option key={d._id} value={d._id}>{d.code} - {d.name}</option>
                            ))}
                        </Select>

                        <Select
                            label="Semester"
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                        >
                            <option value="">Select Semester</option>
                            {Array.from({ length: 8 }, (_, i) => (
                                <option key={i + 1} value={String(i + 1)}>Semester {i + 1}</option>
                            ))}
                        </Select>

                        <div className="flex items-end">
                            <Button
                                onClick={handleGenerate}
                                loading={createJobMutation.isPending}
                                disabled={!selectedDept || !selectedSemester}
                                className="w-full"
                                variant="glow"
                            >
                                <Play className="w-4 h-4" />
                                Generate Timetable
                            </Button>
                        </div>
                    </div>

                    {createJobMutation.isSuccess && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3 text-green-400"
                        >
                            <CheckCircle className="w-5 h-5" />
                            Job created successfully! It will appear in the list below.
                        </motion.div>
                    )}

                    {createJobMutation.isError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400"
                        >
                            <XCircle className="w-5 h-5" />
                            {createJobMutation.error?.response?.data?.message || 'Failed to create job'}
                        </motion.div>
                    )}
                </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card title="Recent Jobs" padding={false}>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full">
                            <thead className="bg-surface-80/50 border-b border-border-glass">
                                <tr>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-text-muted">Name</th>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-text-muted">Status</th>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-text-muted">Progress</th>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-text-muted">Created</th>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-text-muted">Results</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobsLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                            Loading...
                                        </td>
                                    </tr>
                                ) : jobs?.data?.data?.length > 0 ? (
                                    jobs.data.data.map((job, index) => (
                                        <motion.tr
                                            key={job._id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="border-b border-border-glass/50 hover:bg-primary-500/5 transition-colors"
                                        >
                                            <td className="px-6 py-4 font-medium text-text-primary">{job.name}</td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    'px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5',
                                                    getStatusColor(job.status)
                                                )}>
                                                    {getStatusIcon(job.status)}
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 h-2 bg-surface rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${job.progress || 0}%` }}
                                                            transition={{ duration: 0.5 }}
                                                            className={cn(
                                                                'h-full rounded-full',
                                                                job.status === 'completed'
                                                                    ? 'bg-green-500'
                                                                    : job.status === 'failed'
                                                                        ? 'bg-red-500'
                                                                        : 'bg-primary-500'
                                                            )}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-text-muted">{job.progress || 0}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-muted">
                                                {formatDate(job.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {job.results?.length > 0 && (
                                                    <span className="text-green-400 font-medium">
                                                        {job.results.length} solution(s)
                                                    </span>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                                            No jobs yet. Generate your first timetable above!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    );
}
