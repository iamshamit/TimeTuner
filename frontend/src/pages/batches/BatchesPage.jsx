import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, GraduationCap, AlertTriangle, BookOpen, X } from 'lucide-react';
import { batchesAPI, departmentsAPI, subjectsAPI, facultiesAPI } from '@/services/api';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input, { Select } from '@/components/common/Input';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { cn } from '@/lib/utils';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function BatchesPage() {
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [subjectsModalOpen, setSubjectsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        code: '', name: '', department: '', semester: 1, academicYear: '2024-25', size: 60, shift: 'morning'
    });
    const [subjectAssignments, setSubjectAssignments] = useState([]);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['batches'],
        queryFn: () => batchesAPI.getAll({ limit: 100 })
    });

    const { data: deptData } = useQuery({
        queryKey: ['departments'],
        queryFn: () => departmentsAPI.getAll({ limit: 100 })
    });

    const { data: subjData } = useQuery({
        queryKey: ['subjects'],
        queryFn: () => subjectsAPI.getAll({ limit: 100 })
    });

    const { data: facData } = useQuery({
        queryKey: ['faculties'],
        queryFn: () => facultiesAPI.getAll({ limit: 100 })
    });

    const createMutation = useMutation({
        mutationFn: batchesAPI.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['batches']);
            closeModal();
        },
        onError: (err) => setError(err?.response?.data?.message || 'Failed to create')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => batchesAPI.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['batches']);
            closeModal();
        },
        onError: (err) => setError(err?.response?.data?.message || 'Failed to update')
    });

    const deleteMutation = useMutation({
        mutationFn: batchesAPI.delete,
        onSuccess: () => {
            queryClient.invalidateQueries(['batches']);
            setDeleteOpen(false);
            setEditing(null);
        },
        onError: (err) => setError(err?.response?.data?.message || 'Failed to delete')
    });

    const assignSubjectsMutation = useMutation({
        mutationFn: ({ id, data }) => batchesAPI.update(id, { subjects: data }),
        onSuccess: () => {
            queryClient.invalidateQueries(['batches']);
            setSubjectsModalOpen(false);
            setEditing(null);
        },
        onError: (err) => setError(err?.response?.data?.message || 'Failed to assign subjects')
    });

    const openCreate = () => {
        setEditing(null);
        setFormData({ code: '', name: '', department: '', semester: 1, academicYear: '2024-25', size: 60, shift: 'morning' });
        setError('');
        setModalOpen(true);
    };

    const openEdit = (batch) => {
        setEditing(batch);
        setFormData({
            code: batch.code,
            name: batch.name,
            department: batch.department?._id || batch.department,
            semester: batch.semester,
            academicYear: batch.academicYear || '2024-25',
            size: batch.size,
            shift: batch.shift || 'morning'
        });
        setError('');
        setModalOpen(true);
    };

    const openSubjectsModal = (batch) => {
        setEditing(batch);
        const existing = (batch.subjects || []).map(s => ({
            subject: s.subject?._id || s.subject,
            faculty: s.assignedFaculty?._id || s.assignedFaculty,
            classesPerWeek: s.classesPerWeek || 3
        }));
        setSubjectAssignments(existing.length > 0 ? existing : [{ subject: '', faculty: '', classesPerWeek: 3 }]);
        setError('');
        setSubjectsModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        setError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        const data = {
            ...formData,
            semester: Number(formData.semester),
            size: Number(formData.size)
        };
        if (editing) {
            updateMutation.mutate({ id: editing._id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleSubjectsSubmit = (e) => {
        e.preventDefault();
        setError('');
        const validAssignments = subjectAssignments
            .filter(a => a.subject && a.faculty)
            .map(a => ({
                subject: a.subject,
                assignedFaculty: a.faculty,
                classesPerWeek: a.classesPerWeek
            }));
        if (validAssignments.length === 0) {
            setError('Please assign at least one subject with faculty');
            return;
        }
        assignSubjectsMutation.mutate({ id: editing._id, data: validAssignments });
    };

    const addSubjectRow = () => {
        setSubjectAssignments([...subjectAssignments, { subject: '', faculty: '', classesPerWeek: 3 }]);
    };

    const removeSubjectRow = (idx) => {
        setSubjectAssignments(subjectAssignments.filter((_, i) => i !== idx));
    };

    const updateSubjectRow = (idx, field, value) => {
        const updated = [...subjectAssignments];
        updated[idx][field] = value;
        setSubjectAssignments(updated);
    };

    const departments = deptData?.data?.data || [];
    const allSubjects = subjData?.data?.data || [];
    const allFaculties = facData?.data?.data || [];

    const getAvailableSubjects = () => {
        if (!editing) return allSubjects;
        return allSubjects.filter(s =>
            s.semester === editing.semester &&
            (s.department?._id || s.department) === (editing.department?._id || editing.department)
        );
    };

    const getAvailableFaculties = () => {
        if (!editing) return allFaculties;
        return allFaculties.filter(f =>
            (f.department?._id || f.department) === (editing.department?._id || editing.department)
        );
    };

    const columns = [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'department', label: 'Department', render: (val) => val?.code || '-' },
        { key: 'semester', label: 'Semester' },
        { key: 'size', label: 'Size' },
        {
            key: 'subjects',
            label: 'Subjects',
            render: (val) => (
                <span className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border',
                    (val?.length || 0) > 0
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                )}>
                    {val?.length || 0} assigned
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <div className="flex gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); openSubjectsModal(row); }}
                        className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                    >
                        Subjects
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); openEdit(row); }}
                        className="text-primary-400 hover:text-primary-300 transition-colors"
                    >
                        Edit
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setEditing(row); setDeleteOpen(true); }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            )
        }
    ];

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent-purple/20 border border-purple-500/30">
                        <GraduationCap className="w-5 h-5 text-purple-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary">Batches</h1>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4" />
                    Add Batch
                </Button>
            </motion.div>

            <motion.div
                variants={itemVariants}
                className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-3 rounded-lg flex items-center gap-3"
            >
                <AlertTriangle className="w-5 h-5" />
                <p className="text-sm">
                    <strong>Important:</strong> Click "Subjects" to assign subjects and faculties to each batch. The solver needs this to generate timetables.
                </p>
            </motion.div>

            {error && !modalOpen && !subjectsModalOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center justify-between"
                >
                    {error}
                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 font-bold">×</button>
                </motion.div>
            )}

            <motion.div variants={itemVariants}>
                <Table
                    columns={columns}
                    data={data?.data?.data || []}
                    loading={isLoading}
                    emptyMessage="No batches found"
                />
            </motion.div>

            {/* Create/Edit Batch Modal */}
            <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Batch' : 'Add Batch'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            placeholder="e.g., CSE-3A"
                            required
                        />
                        <Input
                            label="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., CSE Semester 3 Section A"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Department"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            required
                        >
                            <option value="">Select Department</option>
                            {departments.map((d) => (
                                <option key={d._id} value={d._id}>{d.name}</option>
                            ))}
                        </Select>
                        <Select
                            label="Semester"
                            value={formData.semester}
                            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                <option key={s} value={s}>Semester {s}</option>
                            ))}
                        </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <Input
                            label="Academic Year"
                            value={formData.academicYear}
                            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                            placeholder="e.g., 2024-25"
                        />
                        <Input
                            label="Batch Size"
                            type="number"
                            value={formData.size}
                            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                        />
                        <Select
                            label="Shift"
                            value={formData.shift}
                            onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                        >
                            <option value="morning">Morning</option>
                            <option value="afternoon">Afternoon</option>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" type="button" onClick={closeModal}>Cancel</Button>
                        <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                            {editing ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Assign Subjects Modal */}
            <Modal isOpen={subjectsModalOpen} onClose={() => setSubjectsModalOpen(false)} title={`Assign Subjects - ${editing?.code}`} size="lg">
                <form onSubmit={handleSubjectsSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <p className="text-sm text-text-muted">
                        Assign subjects and their teaching faculty for <strong className="text-text-primary">{editing?.name}</strong> (Semester {editing?.semester})
                    </p>

                    <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                        {subjectAssignments.map((assignment, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex gap-3 items-end p-3 bg-surface-50 rounded-lg border border-border-glass"
                            >
                                <div className="flex-1">
                                    <Select
                                        label="Subject"
                                        value={assignment.subject}
                                        onChange={(e) => updateSubjectRow(idx, 'subject', e.target.value)}
                                    >
                                        <option value="">Select Subject</option>
                                        {getAvailableSubjects().map((s) => (
                                            <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
                                        ))}
                                    </Select>
                                </div>
                                <div className="flex-1">
                                    <Select
                                        label="Faculty"
                                        value={assignment.faculty}
                                        onChange={(e) => updateSubjectRow(idx, 'faculty', e.target.value)}
                                    >
                                        <option value="">Select Faculty</option>
                                        {getAvailableFaculties().map((f) => (
                                            <option key={f._id} value={f._id}>{f.name}</option>
                                        ))}
                                    </Select>
                                </div>
                                <div className="w-24">
                                    <Input
                                        label="Hrs/Week"
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={assignment.classesPerWeek}
                                        onChange={(e) => updateSubjectRow(idx, 'classesPerWeek', parseInt(e.target.value) || 3)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeSubjectRow(idx)}
                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                    disabled={subjectAssignments.length === 1}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ))}
                    </div>

                    <Button type="button" variant="ghost" onClick={addSubjectRow}>
                        <Plus className="w-4 h-4" />
                        Add Another Subject
                    </Button>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border-glass">
                        <Button variant="ghost" type="button" onClick={() => setSubjectsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" loading={assignSubjectsMutation.isPending}>
                            Save Assignments
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={() => deleteMutation.mutate(editing?._id)}
                title="Delete Batch"
                message={`Are you sure you want to delete "${editing?.name}"?`}
                loading={deleteMutation.isPending}
            />
        </motion.div>
    );
}
