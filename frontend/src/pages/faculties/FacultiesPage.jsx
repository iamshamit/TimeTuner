import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Users } from 'lucide-react';
import { facultiesAPI, departmentsAPI } from '@/services/api';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input, { Select } from '@/components/common/Input';
import ConfirmDialog from '@/components/common/ConfirmDialog';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function FacultiesPage() {
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        employeeId: '', name: '', email: '', department: '', designation: 'Assistant Professor'
    });
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['faculties'],
        queryFn: () => facultiesAPI.getAll({ limit: 100 })
    });

    const { data: deptData } = useQuery({
        queryKey: ['departments'],
        queryFn: () => departmentsAPI.getAll({ limit: 100 })
    });

    const createMutation = useMutation({
        mutationFn: facultiesAPI.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['faculties']);
            closeModal();
        },
        onError: (err) => setError(err?.response?.data?.message || 'Failed to create')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => facultiesAPI.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['faculties']);
            closeModal();
        },
        onError: (err) => setError(err?.response?.data?.message || 'Failed to update')
    });

    const deleteMutation = useMutation({
        mutationFn: facultiesAPI.delete,
        onSuccess: () => {
            queryClient.invalidateQueries(['faculties']);
            setDeleteOpen(false);
            setEditing(null);
        },
        onError: (err) => setError(err?.response?.data?.message || 'Failed to delete')
    });

    const openCreate = () => {
        setEditing(null);
        setFormData({ employeeId: '', name: '', email: '', department: '', designation: 'Assistant Professor' });
        setError('');
        setModalOpen(true);
    };

    const openEdit = (faculty) => {
        setEditing(faculty);
        setFormData({
            employeeId: faculty.employeeId,
            name: faculty.name,
            email: faculty.email,
            department: faculty.department?._id || faculty.department,
            designation: faculty.designation
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
        if (editing) {
            updateMutation.mutate({ id: editing._id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const departments = deptData?.data?.data || [];

    const columns = [
        { key: 'employeeId', label: 'Employee ID' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'department', label: 'Department', render: (val) => val?.code || val || '-' },
        { key: 'designation', label: 'Designation' },
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
                    <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                        <Users className="w-5 h-5 text-green-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary">Faculties</h1>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4" />
                    Add Faculty
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
                    emptyMessage="No faculties found"
                />
            </motion.div>

            <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Faculty' : 'Add Faculty'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Employee ID"
                            value={formData.employeeId}
                            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                            placeholder="e.g., FAC001"
                            required
                        />
                        <Input
                            label="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Dr. John Doe"
                            required
                        />
                    </div>
                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g., john.doe@college.edu"
                        required
                    />
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
                            label="Designation"
                            value={formData.designation}
                            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        >
                            <option value="Professor">Professor</option>
                            <option value="Associate Professor">Associate Professor</option>
                            <option value="Assistant Professor">Assistant Professor</option>
                            <option value="Lecturer">Lecturer</option>
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

            <ConfirmDialog
                isOpen={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={() => deleteMutation.mutate(editing?._id)}
                title="Delete Faculty"
                message={`Are you sure you want to delete "${editing?.name}"?`}
                loading={deleteMutation.isPending}
            />
        </motion.div>
    );
}
