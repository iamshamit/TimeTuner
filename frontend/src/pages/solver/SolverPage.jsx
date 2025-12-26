import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { solverAPI, departmentsAPI, batchesAPI } from '../../services/api';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { Select } from '../../components/common/Input';
import { getStatusColor, formatDate } from '../../lib/utils';

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
        refetchInterval: 5000 // Poll every 5 seconds
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

    const deptOptions = [
        { value: '', label: 'Select Department' },
        ...(departments?.data?.data?.map(d => ({
            value: d._id,
            label: `${d.code} - ${d.name}`
        })) || [])
    ];

    const semesterOptions = [
        { value: '', label: 'Select Semester' },
        ...Array.from({ length: 8 }, (_, i) => ({
            value: String(i + 1),
            label: `Semester ${i + 1}`
        }))
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Timetable Solver</h1>
                <p className="text-gray-500 mt-1">Generate optimized timetables using constraint programming</p>
            </div>

            <Card title="Generate New Timetable">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                        label="Department"
                        options={deptOptions}
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                    />

                    <Select
                        label="Semester"
                        options={semesterOptions}
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value)}
                    />

                    <div className="flex items-end">
                        <Button
                            onClick={handleGenerate}
                            loading={createJobMutation.isPending}
                            disabled={!selectedDept || !selectedSemester}
                            className="w-full"
                        >
                            ⚙️ Generate Timetable
                        </Button>
                    </div>
                </div>

                {createJobMutation.isSuccess && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        ✅ Job created successfully! It will appear in the list below.
                    </div>
                )}

                {createJobMutation.isError && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        ❌ {createJobMutation.error?.response?.data?.message || 'Failed to create job'}
                    </div>
                )}
            </Card>

            <Card title="Recent Jobs" padding={false}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Progress</th>
                                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Created</th>
                                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Results</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {jobsLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : jobs?.data?.data?.length > 0 ? (
                                jobs.data.data.map((job) => (
                                    <tr key={job._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium">{job.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-24 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${job.progress || 0}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {formatDate(job.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {job.results?.length > 0 && (
                                                <span className="text-green-600 font-medium">
                                                    {job.results.length} solution(s)
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No jobs yet. Generate your first timetable above!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
