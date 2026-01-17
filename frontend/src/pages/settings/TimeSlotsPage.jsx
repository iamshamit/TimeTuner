import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeSlotsAPI } from '../../services/api';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';

export default function TimeSlotsPage() {
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState('');

    // Two shifts with their own slots
    const [morningSlots, setMorningSlots] = useState([
        { startTime: '09:00', endTime: '10:00' },
        { startTime: '10:00', endTime: '11:00' },
        { startTime: '11:00', endTime: '12:00' },
        { startTime: '12:00', endTime: '13:00' },
    ]);

    const [afternoonSlots, setAfternoonSlots] = useState([
        { startTime: '14:00', endTime: '15:00' },
        { startTime: '15:00', endTime: '16:00' },
    ]);

    const { data, isLoading } = useQuery({
        queryKey: ['timeSlots'],
        queryFn: () => timeSlotsAPI.getAll({ limit: 1 })
    });

    // Load existing slots on data change
    useEffect(() => {
        const config = data?.data?.data?.[0];
        if (config?.slots) {
            // Separate into morning (before 13:00) and afternoon (13:00 and after)
            const morning = [];
            const afternoon = [];
            config.slots.forEach(s => {
                if (!s.isBreak) {
                    const hour = parseInt(s.startTime.split(':')[0]);
                    if (hour < 13) {
                        morning.push({ startTime: s.startTime, endTime: s.endTime });
                    } else {
                        afternoon.push({ startTime: s.startTime, endTime: s.endTime });
                    }
                }
            });
            if (morning.length > 0) setMorningSlots(morning);
            if (afternoon.length > 0) setAfternoonSlots(afternoon);
        }
    }, [data]);

    const saveMutation = useMutation({
        mutationFn: async (slots) => {
            const existingConfig = data?.data?.data?.[0];
            if (existingConfig?._id) {
                return timeSlotsAPI.update(existingConfig._id, { slots });
            }
            return timeSlotsAPI.create({ name: 'Default Schedule', slots, isDefault: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['timeSlots']);
            setEditing(false);
            setError('');
        },
        onError: (err) => setError(err?.response?.data?.message || 'Failed to save')
    });

    // Combine slots and save
    const handleSave = () => {
        const allSlots = [];
        let slotNumber = 1;

        // Add morning slots
        morningSlots.forEach(slot => {
            allSlots.push({
                slotNumber: slotNumber++,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isBreak: false
            });
        });

        // Add afternoon slots
        afternoonSlots.forEach(slot => {
            allSlots.push({
                slotNumber: slotNumber++,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isBreak: false
            });
        });

        saveMutation.mutate(allSlots);
    };

    const handleCancel = () => {
        // Reload from data
        const config = data?.data?.data?.[0];
        if (config?.slots) {
            const morning = [];
            const afternoon = [];
            config.slots.forEach(s => {
                if (!s.isBreak) {
                    const hour = parseInt(s.startTime.split(':')[0]);
                    if (hour < 13) {
                        morning.push({ startTime: s.startTime, endTime: s.endTime });
                    } else {
                        afternoon.push({ startTime: s.startTime, endTime: s.endTime });
                    }
                }
            });
            if (morning.length > 0) setMorningSlots(morning);
            if (afternoon.length > 0) setAfternoonSlots(afternoon);
        }
        setEditing(false);
    };

    // Slot management functions
    const addMorningSlot = () => {
        const lastSlot = morningSlots[morningSlots.length - 1];
        const newStart = lastSlot?.endTime || '09:00';
        const newEnd = addHour(newStart);
        setMorningSlots([...morningSlots, { startTime: newStart, endTime: newEnd }]);
    };

    const addAfternoonSlot = () => {
        const lastSlot = afternoonSlots[afternoonSlots.length - 1];
        const newStart = lastSlot?.endTime || '14:00';
        const newEnd = addHour(newStart);
        setAfternoonSlots([...afternoonSlots, { startTime: newStart, endTime: newEnd }]);
    };

    const updateMorningSlot = (idx, field, value) => {
        const updated = [...morningSlots];
        updated[idx][field] = value;
        setMorningSlots(updated);
    };

    const updateAfternoonSlot = (idx, field, value) => {
        const updated = [...afternoonSlots];
        updated[idx][field] = value;
        setAfternoonSlots(updated);
    };

    const removeMorningSlot = (idx) => {
        setMorningSlots(morningSlots.filter((_, i) => i !== idx));
    };

    const removeAfternoonSlot = (idx) => {
        setAfternoonSlots(afternoonSlots.filter((_, i) => i !== idx));
    };

    // Helper: add 1 hour to time string
    const addHour = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        const newH = (h + 1) % 24;
        return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    // Calculate duration in minutes
    const getDuration = (start, end) => {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        return (eh * 60 + em) - (sh * 60 + sm);
    };

    // Calculate gap between slots
    const getGap = (slots, idx) => {
        if (idx === 0) return null;
        const prevEnd = slots[idx - 1].endTime;
        const currStart = slots[idx].startTime;
        const gap = getDuration(prevEnd, currStart);
        return gap > 0 ? gap : null;
    };

    if (isLoading) {
        return <div className="flex justify-center py-12">Loading...</div>;
    }

    // View mode slot display
    const SlotDisplay = ({ slots, shiftLabel }) => (
        <div className="space-y-2">
            {slots.map((slot, idx) => {
                const gap = getGap(slots, idx);
                return (
                    <div key={idx}>
                        {gap && (
                            <div className="flex items-center justify-center py-1">
                                <span className="text-xs text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                                    ☕ {gap} min break
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-500 w-16">Slot {idx + 1}</span>
                            <span className="font-medium">{slot.startTime}</span>
                            <span className="text-gray-400">→</span>
                            <span className="font-medium">{slot.endTime}</span>
                            <span className="text-sm text-gray-500 ml-auto">
                                {getDuration(slot.startTime, slot.endTime)} mins
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    // Edit mode slot editor
    const SlotEditor = ({ slots, updateSlot, removeSlot, shiftLabel }) => (
        <div className="space-y-2">
            {slots.map((slot, idx) => {
                const gap = getGap(slots, idx);
                return (
                    <div key={idx}>
                        {gap && (
                            <div className="flex items-center justify-center py-1">
                                <span className="text-xs text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                                    ☕ {gap} min break
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-500 w-16">Slot {idx + 1}</span>
                            <Input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) => updateSlot(idx, 'startTime', e.target.value)}
                                className="w-32"
                            />
                            <span className="text-gray-400">→</span>
                            <Input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) => updateSlot(idx, 'endTime', e.target.value)}
                                className="w-32"
                            />
                            <span className="text-sm text-gray-500 w-20">
                                {getDuration(slot.startTime, slot.endTime)} mins
                            </span>
                            <button
                                onClick={() => removeSlot(idx)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded"
                                disabled={slots.length === 1}
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Time Slots Configuration</h1>
                    <p className="text-gray-500 mt-1">Configure class time slots for each shift</p>
                </div>
                {editing ? (
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
                        <Button onClick={handleSave} loading={saveMutation.isPending}>
                            💾 Save Changes
                        </Button>
                    </div>
                ) : (
                    <Button onClick={() => setEditing(true)}>✏️ Edit Time Slots</Button>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {editing && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
                    💡 <strong>Tip:</strong> To add a break, leave a gap between slots. For example, end Slot 1 at 10:00 and start Slot 2 at 10:15 for a 15-minute break.
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Morning Shift */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                🌅 Morning Shift
                            </h2>
                            <p className="text-sm text-gray-500">Classes before lunch</p>
                        </div>
                        <span className="text-sm text-gray-500">{morningSlots.length} slots</span>
                    </div>

                    {editing ? (
                        <>
                            <SlotEditor
                                slots={morningSlots}
                                updateSlot={updateMorningSlot}
                                removeSlot={removeMorningSlot}
                                shiftLabel="morning"
                            />
                            <Button
                                variant="ghost"
                                onClick={addMorningSlot}
                                className="mt-4 w-full"
                            >
                                + Add Morning Slot
                            </Button>
                        </>
                    ) : (
                        <SlotDisplay slots={morningSlots} shiftLabel="morning" />
                    )}
                </Card>

                {/* Afternoon Shift */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                🌤️ Afternoon Shift
                            </h2>
                            <p className="text-sm text-gray-500">Classes after lunch</p>
                        </div>
                        <span className="text-sm text-gray-500">{afternoonSlots.length} slots</span>
                    </div>

                    {editing ? (
                        <>
                            <SlotEditor
                                slots={afternoonSlots}
                                updateSlot={updateAfternoonSlot}
                                removeSlot={removeAfternoonSlot}
                                shiftLabel="afternoon"
                            />
                            <Button
                                variant="ghost"
                                onClick={addAfternoonSlot}
                                className="mt-4 w-full"
                            >
                                + Add Afternoon Slot
                            </Button>
                        </>
                    ) : (
                        <SlotDisplay slots={afternoonSlots} shiftLabel="afternoon" />
                    )}
                </Card>
            </div>

            {/* Summary */}
            <Card>
                <h3 className="font-medium text-gray-900 mb-4">📊 Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="p-3 bg-orange-50 rounded-lg">
                        <span className="text-orange-600 font-medium">Morning Slots</span>
                        <p className="text-2xl font-bold text-orange-700">{morningSlots.length}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <span className="text-blue-600 font-medium">Afternoon Slots</span>
                        <p className="text-2xl font-bold text-blue-700">{afternoonSlots.length}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                        <span className="text-green-600 font-medium">Total Slots</span>
                        <p className="text-2xl font-bold text-green-700">{morningSlots.length + afternoonSlots.length}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                        <span className="text-purple-600 font-medium">Day Ends</span>
                        <p className="text-2xl font-bold text-purple-700">
                            {afternoonSlots.length > 0
                                ? afternoonSlots[afternoonSlots.length - 1].endTime
                                : morningSlots[morningSlots.length - 1]?.endTime || '-'}
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
