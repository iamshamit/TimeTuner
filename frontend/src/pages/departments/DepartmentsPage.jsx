import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsAPI } from '../../services/api';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';

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
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${val !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {val !== false ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="text-blue-600 hover:text-blue-800">Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); setEditing(row); setDeleteOpen(true); }} className="text-red-600 hover:text-red-800">Delete</button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
                <Button onClick={openCreate}>+ Add Department</Button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                    <button onClick={() => setError('')} className="float-right font-bold">×</button>
                </div>
            )}

            <Table
                columns={columns}
                data={data?.data?.data || []}
                loading={isLoading}
                emptyMessage="No departments found"
            />

            <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Department' : 'Add Department'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
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
        </div>
    );
}
