import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeSlotsAPI } from '../../services/api';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';

export default function TimeSlotsPage() {
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState(false);
    const [slots, setSlots] = useState([]);

    const { data, isLoading } = useQuery({
        queryKey: ['timeSlots'],
        queryFn: () => timeSlotsAPI.getAll({ limit: 1 }),
        onSuccess: (data) => {
            const config = data?.data?.data?.[0];
            if (config?.slots) {
                setSlots(config.slots);
            }
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data) => {
            const config = data?.data?.data?.[0];
            if (config?._id) {
                return timeSlotsAPI.update(config._id, { slots: data });
            }
            return timeSlotsAPI.create({ name: 'Default', slots: data, isDefault: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['timeSlots']);
            setEditing(false);
        }
    });

    const config = data?.data?.data?.[0];
    const displaySlots = config?.slots || [
        { slotNumber: 1, startTime: '09:00', endTime: '09:50', isBreak: false },
        { slotNumber: 2, startTime: '09:50', endTime: '10:40', isBreak: false },
        { slotNumber: 3, startTime: '10:40', endTime: '10:50', isBreak: true, label: 'Break' },
        { slotNumber: 4, startTime: '10:50', endTime: '11:40', isBreak: false },
        { slotNumber: 5, startTime: '11:40', endTime: '12:30', isBreak: false },
        { slotNumber: 6, startTime: '12:30', endTime: '14:00', isBreak: true, label: 'Lunch' },
        { slotNumber: 7, startTime: '14:00', endTime: '14:50', isBreak: false },
        { slotNumber: 8, startTime: '14:50', endTime: '15:40', isBreak: false },
    ];

    if (isLoading) {
        return <div className="flex justify-center py-12">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Time Slots Configuration</h1>
                    <p className="text-gray-500 mt-1">Configure the daily time slots for timetable generation</p>
                </div>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Slot #</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Start Time</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">End Time</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Duration</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displaySlots.map((slot, idx) => {
                                const startParts = slot.startTime.split(':');
                                const endParts = slot.endTime.split(':');
                                const startMins = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
                                const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
                                const duration = endMins - startMins;

                                return (
                                    <tr key={idx} className={`border-b ${slot.isBreak ? 'bg-yellow-50' : ''}`}>
                                        <td className="py-3 px-4 font-medium">{slot.slotNumber || idx + 1}</td>
                                        <td className="py-3 px-4">{slot.startTime}</td>
                                        <td className="py-3 px-4">{slot.endTime}</td>
                                        <td className="py-3 px-4 text-gray-500">{duration} mins</td>
                                        <td className="py-3 px-4">
                                            {slot.isBreak ? (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                                    {slot.label || 'Break'}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                    Class
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Summary</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">Total Slots:</span>
                            <span className="ml-2 font-medium">{displaySlots.length}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Class Slots:</span>
                            <span className="ml-2 font-medium">{displaySlots.filter(s => !s.isBreak).length}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Breaks:</span>
                            <span className="ml-2 font-medium">{displaySlots.filter(s => s.isBreak).length}</span>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="text-sm text-gray-500">
                <p>💡 Time slots define when classes can be scheduled during the day.</p>
                <p>The solver will use these slots when generating timetables.</p>
            </div>
        </div>
    );
}
