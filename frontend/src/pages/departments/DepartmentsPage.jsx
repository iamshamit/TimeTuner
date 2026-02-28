import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Building2 } from 'lucide-react';
import { departmentsAPI } from '@/services/api';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
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

export default function DepartmentsPage() {
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ code: '', name: '' });
    const [error, setError] = useState('');
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['departments'],
        queryFn: () => departmentsAPI.getAll({ limit: 100 })
    });

    const createMutation = useMutation({
        mutationFn: departmentsAPI.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['departments']);
            closeModal();
        },
        onError: (err) => setError(err?.response?.data?.message || 'Failed to create')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => departmentsAPI.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['departments']);
            closeModal();
        },
        onError: (err) => setError(err?.response?.data?.message || 'Failed to update')
    });

    const deleteMutation = useMutation({
        mutationFn: departmentsAPI.delete,
        onSuccess: () => {
            queryClient.invalidateQueries(['departments']);
            setDeleteOpen(false);
            setEditing(null);
        },
        onError: (err) => setError(err?.response?.data?.message || 'Failed to delete')
    });

    const openCreate = () => {
        setEditing(null);
        setFormData({ code: '', name: '' });
        setError('');
        setModalOpen(true);
    };

    const openEdit = (dept) => {
        setEditing(dept);
        setFormData({ code: dept.code, name: dept.name });
        setError('');
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        setFormData({ code: '', name: '' });
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

    const columns = [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        {
            key: 'isActive',
            label: 'Status',
            render: (val) => (
                <span className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border',
                    val !== false
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                )}>
                    {val !== false ? 'Active' : 'Inactive'}
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
                    <div className="p-2 rounded-lg bg-primary-500/20 border border-primary-500/30">
                        <Building2 className="w-5 h-5 text-primary-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary">Departments</h1>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4" />
                    Add Department
                </Button>
            </motion.div>

            {error && !modalOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center justify-between"
                >
                    {error}
                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 font-bold">
                        ×
                    </button>
                </motion.div>
            )}

            <motion.div variants={itemVariants}>
                <Table
                    columns={columns}
                    data={data?.data?.data || []}
                    loading={isLoading}
                    emptyMessage="No departments found"
                />
            </motion.div>

            <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Department' : 'Add Department'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    <Input
                        label="Code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="e.g., CSE"
                        required
                    />
                    <Input
                        label="Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Computer Science & Engineering"
                        required
                    />
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
                title="Delete Department"
                message={`Are you sure you want to delete "${editing?.name}"? This action cannot be undone.`}
                loading={deleteMutation.isPending}
            />
        </motion.div>
    );
}
