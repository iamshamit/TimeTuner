import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, BookOpen } from 'lucide-react';
import { subjectsAPI, departmentsAPI } from '@/services/api';
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

export default function SubjectsPage() {
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        code: '', name: '', shortName: '', department: '', semester: 1, credits: 3, isLab: false, lectureHoursPerWeek: 3
    });
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['subjects'],
        queryFn: () => subjectsAPI.getAll({ limit: 100 })
    });

    const { data: deptData } = useQuery({
        queryKey: ['departments'],
        queryFn: () => departmentsAPI.getAll({ limit: 100 })
    });

    const createMutation = useMutation({
        mutationFn: subjectsAPI.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['subjects']);
            closeModal();
        },
        onError: (err) => setError(err?.response?.data?.message || 'Failed to create')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => subjectsAPI.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['subjects']);
            closeModal();
        },
        onError: (err) => setError(err?.response?.data?.message || 'Failed to update')
    });

    const deleteMutation = useMutation({
        mutationFn: subjectsAPI.delete,
        onSuccess: () => {
            queryClient.invalidateQueries(['subjects']);
            setDeleteOpen(false);
            setEditing(null);
        },
        onError: (err) => setError(err?.response?.data?.message || 'Failed to delete')
    });

    const openCreate = () => {
        setEditing(null);
        setFormData({ code: '', name: '', shortName: '', department: '', semester: 1, credits: 3, isLab: false, lectureHoursPerWeek: 3 });
        setError('');
        setModalOpen(true);
    };

    const openEdit = (subj) => {
        setEditing(subj);
        setFormData({
            code: subj.code,
            name: subj.name,
            shortName: subj.shortName || '',
            department: subj.department?._id || subj.department,
            semester: subj.semester,
            credits: subj.credits,
            isLab: subj.isLab || false,
            lectureHoursPerWeek: subj.lectureHoursPerWeek || 3
        });
        setError('');
        setModalOpen(true);
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
            credits: Number(formData.credits),
            lectureHoursPerWeek: Number(formData.lectureHoursPerWeek)
        };
        if (editing) {
            updateMutation.mutate({ id: editing._id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const departments = deptData?.data?.data || [];

    const columns = [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'department', label: 'Department', render: (val) => val?.code || '-' },
        { key: 'semester', label: 'Semester' },
        { key: 'credits', label: 'Credits' },
        {
            key: 'isLab',
            label: 'Type',
            render: (val) => (
                <span className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border',
                    val
                        ? 'bg-accent-purple/20 text-purple-400 border-purple-500/30'
                        : 'bg-primary-500/20 text-primary-400 border-primary-500/30'
                )}>
                    {val ? 'Lab' : 'Theory'}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <div className="flex gap-2">
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
                        <BookOpen className="w-5 h-5 text-purple-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary">Subjects</h1>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4" />
                    Add Subject
                </Button>
            </motion.div>

            {error && !modalOpen && (
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
                    emptyMessage="No subjects found"
                />
            </motion.div>

            <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Subject' : 'Add Subject'} size="lg">
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
                            placeholder="e.g., CS301"
                            required
                        />
                        <Input
                            label="Short Name"
                            value={formData.shortName}
                            onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                            placeholder="e.g., DSA"
                        />
                    </div>
                    <Input
                        label="Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Data Structures & Algorithms"
                        required
                    />
                    <div className="grid grid-cols-3 gap-4">
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
                        <Input
                            label="Credits"
                            type="number"
                            value={formData.credits}
                            onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Hours per Week"
                            type="number"
                            value={formData.lectureHoursPerWeek}
                            onChange={(e) => setFormData({ ...formData, lectureHoursPerWeek: e.target.value })}
                        />
                        <div className="flex items-center pt-6">
                            <input
                                type="checkbox"
                                id="isLab"
                                checked={formData.isLab}
                                onChange={(e) => setFormData({ ...formData, isLab: e.target.checked })}
                                className="h-4 w-4 rounded bg-surface border-border-glass text-primary-500 focus:ring-primary-500/50"
                            />
                            <label htmlFor="isLab" className="ml-2 text-sm text-text-muted">This is a Laboratory subject</label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" type="button" onClick={closeModal}>Cancel</Button>
                        <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                            {editing ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={() => deleteMutation.mutate(editing?._id)}
                title="Delete Subject"
                message={`Are you sure you want to delete "${editing?.name}"?`}
                loading={deleteMutation.isPending}
            />
        </motion.div>
    );
}
