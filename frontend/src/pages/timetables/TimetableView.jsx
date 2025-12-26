import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timetablesAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { getStatusColor, getDayName } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Default time slots - can be overridden by timetable's timeSlots
const DEFAULT_TIME_SLOTS = [
    { slot: 1, startTime: '09:00', endTime: '09:50' },
    { slot: 2, startTime: '09:50', endTime: '10:40' },
    { slot: 3, startTime: '10:50', endTime: '11:40' },
    { slot: 4, startTime: '11:40', endTime: '12:30' },
    { slot: 5, startTime: '14:00', endTime: '14:50' },
    { slot: 6, startTime: '14:50', endTime: '15:40' },
];

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
        return <div className="flex justify-center py-12">Loading...</div>;
    }

    if (!timetable) {
        return <div className="text-center py-12 text-gray-500">Timetable not found</div>;
    }

    // Get time slots from timetable or use defaults
    const timeSlots = timetable.timeSlots?.slots || DEFAULT_TIME_SLOTS;

    // Group events by batch
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

    const getSlotTime = (slotNum) => {
        const slot = timeSlots.find(s => s.slot === slotNum || s.slotNumber === slotNum);
        if (slot) {
            return `${slot.startTime} - ${slot.endTime}`;
        }
        return `Slot ${slotNum}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{timetable.name}</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(timetable.status)}`}>
                            {timetable.status}
                        </span>
                        <span className="text-gray-500">
                            Score: {((timetable.score || 0) * 100).toFixed(0)}%
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    {timetable.status === 'draft' && (
                        <Button
                            onClick={() => submitMutation.mutate()}
                            loading={submitMutation.isPending}
                        >
                            Submit for Review
                        </Button>
                    )}

                    {timetable.status === 'review' && ['admin', 'hod'].includes(user?.role) && (
                        <Button
                            variant="success"
                            onClick={() => approveMutation.mutate()}
                            loading={approveMutation.isPending}
                        >
                            Approve
                        </Button>
                    )}

                    {timetable.status === 'approved' && user?.role === 'admin' && (
                        <Button
                            onClick={() => publishMutation.mutate()}
                            loading={publishMutation.isPending}
                        >
                            Publish
                        </Button>
                    )}
                </div>
            </div>

            {Object.entries(eventsByBatch).map(([batchId, { batch, events }]) => (
                <Card key={batchId} title={`Batch: ${batch?.code || batchId}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="border p-2 bg-gray-50 w-32">Time</th>
                                    {DAYS.map((day) => (
                                        <th key={day} className="border p-2 bg-gray-50">
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
                                            <td className="border p-2 bg-gray-50 text-center text-xs font-medium">
                                                <div className="font-semibold">Slot {slotNum}</div>
                                                <div className="text-gray-500">{slotInfo.startTime} - {slotInfo.endTime}</div>
                                            </td>
                                            {DAYS.map((day) => {
                                                const event = getEventForSlot(events, day, slotNum);
                                                return (
                                                    <td key={day} className="border p-1 h-20">
                                                        {event && (
                                                            <div className={`p-2 rounded-lg h-full ${event.subject?.isLab ? 'bg-purple-100' : 'bg-blue-100'}`}>
                                                                <p className="font-medium text-sm">
                                                                    {event.subject?.code || event.subject}
                                                                </p>
                                                                <p className="text-xs text-gray-600 mt-1">
                                                                    {event.faculty?.name || 'TBA'}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {event.room?.code || 'TBA'}
                                                                </p>
                                                            </div>
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
            ))}
        </div>
    );
}
