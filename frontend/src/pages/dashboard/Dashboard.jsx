import { useQuery } from '@tanstack/react-query';
import { StatCard } from '../../components/common/Card';
import { departmentsAPI, facultiesAPI, roomsAPI, batchesAPI, timetablesAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';

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
            icon: '🏛️',
            color: 'blue'
        },
        {
            title: 'Faculties',
            value: faculties?.data?.data?.length || 0,
            icon: '👨‍🏫',
            color: 'green'
        },
        {
            title: 'Rooms',
            value: rooms?.data?.data?.length || 0,
            icon: '🚪',
            color: 'yellow'
        },
        {
            title: 'Batches',
            value: batches?.data?.data?.length || 0,
            icon: '👥',
            color: 'purple'
        }
    ];

    const publishedTimetables = timetables?.data?.data?.filter(t => t.status === 'published') || [];
    const draftTimetables = timetables?.data?.data?.filter(t => t.status === 'draft') || [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
                <p className="text-gray-500 mt-1">Here's what's happening with your timetables</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">{stat.title}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            </div>
                            <span className="text-3xl">{stat.icon}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">📅 Published Timetables</h3>
                    {publishedTimetables.length > 0 ? (
                        <ul className="space-y-3">
                            {publishedTimetables.slice(0, 5).map((tt) => (
                                <li key={tt._id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                    <span className="font-medium">{tt.name}</span>
                                    <span className="text-sm text-gray-500">
                                        Semester {tt.semester}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No published timetables yet</p>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">📝 Draft Timetables</h3>
                    {draftTimetables.length > 0 ? (
                        <ul className="space-y-3">
                            {draftTimetables.slice(0, 5).map((tt) => (
                                <li key={tt._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium">{tt.name}</span>
                                    <span className="text-sm text-gray-500">
                                        Score: {(tt.score * 100).toFixed(0)}%
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No draft timetables</p>
                    )}
                </div>
            </div>
        </div>
    );
}
