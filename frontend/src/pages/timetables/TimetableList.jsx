import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { timetablesAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { getStatusColor, formatDate } from '../../lib/utils';

export default function TimetableList() {
    const { data, isLoading } = useQuery({
        queryKey: ['timetables'],
        queryFn: () => timetablesAPI.getAll({ limit: 50 })
    });

    const timetables = data?.data?.data || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Timetables</h1>
                    <p className="text-gray-500 mt-1">View and manage generated timetables</p>
                </div>
                <Link to="/solver">
                    <Button>⚙️ Generate New</Button>
                </Link>
            </div>

            <Card padding={false}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Department</th>
                                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Semester</th>
                                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Score</th>
                                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Created</th>
                                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : timetables.length > 0 ? (
                                timetables.map((tt) => (
                                    <tr key={tt._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium">{tt.name}</td>
                                        <td className="px-6 py-4">{tt.department?.code || '-'}</td>
                                        <td className="px-6 py-4">Sem {tt.semester}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-green-500 h-2 rounded-full"
                                                        style={{ width: `${(tt.score || 0) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm">{((tt.score || 0) * 100).toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tt.status)}`}>
                                                {tt.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {formatDate(tt.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link to={`/timetables/${tt._id}`}>
                                                <Button size="sm" variant="ghost">View</Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        No timetables found. <Link to="/solver" className="text-blue-600 hover:underline">Generate one</Link>
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
