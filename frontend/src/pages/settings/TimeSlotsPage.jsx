import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Clock, Edit3, Save, X, Plus, Sunrise, Sun, Coffee } from 'lucide-react';
import { timeSlotsAPI } from '@/services/api';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import { cn } from '@/lib/utils';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function TimeSlotsPage() {
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState('');

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

    useEffect(() => {
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

    const handleSave = () => {
        const allSlots = [];
        let slotNumber = 1;

        morningSlots.forEach(slot => {
            allSlots.push({
                slotNumber: slotNumber++,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isBreak: false
            });
        });

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

    const addHour = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        const newH = (h + 1) % 24;
        return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const getDuration = (start, end) => {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        return (eh * 60 + em) - (sh * 60 + sm);
    };

    const getGap = (slots, idx) => {
        if (idx === 0) return null;
        const prevEnd = slots[idx - 1].endTime;
        const currStart = slots[idx].startTime;
        const gap = getDuration(prevEnd, currStart);
        return gap > 0 ? gap : null;
    };

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

    if (isLoading) {
        return <div className="flex justify-center py-12 text-text-muted">Loading...</div>;
    }

    const SlotDisplay = ({ slots }) => (
        <div className="space-y-2">
            {slots.map((slot, idx) => {
                const gap = getGap(slots, idx);
                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                    >
                        {gap && (
                            <div className="flex items-center justify-center py-1">
                                <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-full flex items-center gap-1">
                                    <Coffee className="w-3 h-3" />
                                    {gap} min break
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-3 p-3 bg-surface-50 border border-border-glass rounded-lg">
                            <span className="text-sm font-medium text-text-muted w-16">Slot {idx + 1}</span>
                            <span className="font-medium text-text-primary">{slot.startTime}</span>
                            <span className="text-text-muted">to</span>
                            <span className="font-medium text-text-primary">{slot.endTime}</span>
                            <span className="text-sm text-text-muted ml-auto">
                                {getDuration(slot.startTime, slot.endTime)} mins
                            </span>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );

    const SlotEditor = ({ slots, updateSlot, removeSlot }) => (
        <div className="space-y-2">
            {slots.map((slot, idx) => {
                const gap = getGap(slots, idx);
                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                    >
                        {gap && (
                            <div className="flex items-center justify-center py-1">
                                <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-full flex items-center gap-1">
                                    <Coffee className="w-3 h-3" />
                                    {gap} min break
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-3 p-3 bg-surface-50 border border-border-glass rounded-lg">
                            <span className="text-sm font-medium text-text-muted w-16">Slot {idx + 1}</span>
                            <Input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) => updateSlot(idx, 'startTime', e.target.value)}
                                className="w-32"
                            />
                            <span className="text-text-muted">to</span>
                            <Input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) => updateSlot(idx, 'endTime', e.target.value)}
                                className="w-32"
                            />
                            <span className="text-sm text-text-muted w-20">
                                {getDuration(slot.startTime, slot.endTime)} mins
                            </span>
                            <button
                                onClick={() => removeSlot(idx)}
                                className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                disabled={slots.length === 1}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );

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
                        <Clock className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">Time Slots Configuration</h1>
                        <p className="text-text-muted mt-1">Configure class time slots for each shift</p>
                    </div>
                </div>
                {editing ? (
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={handleCancel}>
                            <X className="w-4 h-4" />
                            Cancel
                        </Button>
                        <Button onClick={handleSave} loading={saveMutation.isPending}>
                            <Save className="w-4 h-4" />
                            Save Changes
                        </Button>
                    </div>
                ) : (
                    <Button onClick={() => setEditing(true)}>
                        <Edit3 className="w-4 h-4" />
                        Edit Time Slots
                    </Button>
                )}
            </motion.div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg"
                >
                    {error}
                </motion.div>
            )}

            {editing && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-primary-500/10 border border-primary-500/30 text-primary-400 px-4 py-3 rounded-lg text-sm"
                >
                    <strong>Tip:</strong> To add a break, leave a gap between slots. For example, end Slot 1 at 10:00 and start Slot 2 at 10:15 for a 15-minute break.
                </motion.div>
            )}

            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Morning Shift */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30">
                                <Sunrise className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-text-primary">Morning Shift</h2>
                                <p className="text-sm text-text-muted">Classes before lunch</p>
                            </div>
                        </div>
                        <span className="text-sm text-text-muted">{morningSlots.length} slots</span>
                    </div>

                    {editing ? (
                        <>
                            <SlotEditor
                                slots={morningSlots}
                                updateSlot={updateMorningSlot}
                                removeSlot={removeMorningSlot}
                            />
                            <Button
                                variant="ghost"
                                onClick={addMorningSlot}
                                className="mt-4 w-full"
                            >
                                <Plus className="w-4 h-4" />
                                Add Morning Slot
                            </Button>
                        </>
                    ) : (
                        <SlotDisplay slots={morningSlots} />
                    )}
                </Card>

                {/* Afternoon Shift */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                                <Sun className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-text-primary">Afternoon Shift</h2>
                                <p className="text-sm text-text-muted">Classes after lunch</p>
                            </div>
                        </div>
                        <span className="text-sm text-text-muted">{afternoonSlots.length} slots</span>
                    </div>

                    {editing ? (
                        <>
                            <SlotEditor
                                slots={afternoonSlots}
                                updateSlot={updateAfternoonSlot}
                                removeSlot={removeAfternoonSlot}
                            />
                            <Button
                                variant="ghost"
                                onClick={addAfternoonSlot}
                                className="mt-4 w-full"
                            >
                                <Plus className="w-4 h-4" />
                                Add Afternoon Slot
                            </Button>
                        </>
                    ) : (
                        <SlotDisplay slots={afternoonSlots} />
                    )}
                </Card>
            </motion.div>

            {/* Summary */}
            <motion.div variants={itemVariants}>
                <Card title="Summary">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                            <span className="text-orange-400 font-medium text-sm">Morning Slots</span>
                            <p className="text-2xl font-bold text-text-primary mt-1">{morningSlots.length}</p>
                        </div>
                        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <span className="text-blue-400 font-medium text-sm">Afternoon Slots</span>
                            <p className="text-2xl font-bold text-text-primary mt-1">{afternoonSlots.length}</p>
                        </div>
                        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <span className="text-green-400 font-medium text-sm">Total Slots</span>
                            <p className="text-2xl font-bold text-text-primary mt-1">{morningSlots.length + afternoonSlots.length}</p>
                        </div>
                        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                            <span className="text-purple-400 font-medium text-sm">Day Ends</span>
                            <p className="text-2xl font-bold text-text-primary mt-1">
                                {afternoonSlots.length > 0
                                    ? afternoonSlots[afternoonSlots.length - 1].endTime
                                    : morningSlots[morningSlots.length - 1]?.endTime || '-'}
                            </p>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    );
}
