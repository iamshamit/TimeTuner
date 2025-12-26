import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsAPI } from '../../services/api';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input, { Select } from '../../components/common/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function RoomsPage() {
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        code: '', name: '', building: '', floor: 0, capacity: 60, type: 'lecture'
    });
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['rooms'],
        queryFn: () => roomsAPI.getAll({ limit: 100 })
    });

    const createMutation = useMutation({
        mutationFn: roomsAPI.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['rooms']);
            closeModal();
        },
        onError: (err) => setError(err?.response?.data?.message || 'Failed to create')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => roomsAPI.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['rooms']);
            closeModal();
        },
        onError: (err) => setError(err?.response?.data?.message || 'Failed to update')
    });

    const deleteMutation = useMutation({
        mutationFn: roomsAPI.delete,
        onSuccess: () => {
            queryClient.invalidateQueries(['rooms']);
            setDeleteOpen(false);
            setEditing(null);
        },
        onError: (err) => setError(err?.response?.data?.message || 'Failed to delete')
    });

    const openCreate = () => {
        setEditing(null);
        setFormData({ code: '', name: '', building: '', floor: 0, capacity: 60, type: 'lecture' });
        setError('');
        setModalOpen(true);
    };

    const openEdit = (room) => {
        setEditing(room);
        setFormData({
            code: room.code,
            name: room.name,
            building: room.building || '',
            floor: room.floor || 0,
            capacity: room.capacity,
            type: room.type
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
        const data = { ...formData, floor: Number(formData.floor), capacity: Number(formData.capacity) };
        if (editing) {
            updateMutation.mutate({ id: editing._id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const columns = [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'building', label: 'Building' },
        { key: 'floor', label: 'Floor' },
        { key: 'capacity', label: 'Capacity' },
        {
            key: 'type',
            label: 'Type',
            render: (val) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${val === 'lab' ? 'bg-purple-100 text-purple-700' :
                        val === 'seminar' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                    }`}>
                    {val}
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
                <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
                <Button onClick={openCreate}>+ Add Room</Button>
            </div>

            {error && !modalOpen && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                    <button onClick={() => setError('')} className="float-right font-bold">×</button>
                </div>
            )}

            <Table
                columns={columns}
                data={data?.data?.data || []}
                loading={isLoading}
                emptyMessage="No rooms found"
            />

            <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Room' : 'Add Room'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            placeholder="e.g., CR101"
                            required
                        />
                        <Input
                            label="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Classroom 101"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <Input
                            label="Building"
                            value={formData.building}
                            onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                            placeholder="e.g., Main Block"
                        />
                        <Input
                            label="Floor"
                            type="number"
                            value={formData.floor}
                            onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                        />
                        <Input
                            label="Capacity"
                            type="number"
                            value={formData.capacity}
                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                            required
                        />
                    </div>
                    <Select
                        label="Type"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                        <option value="lecture">Lecture Hall</option>
                        <option value="lab">Laboratory</option>
                        <option value="seminar">Seminar Hall</option>
                    </Select>
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
                title="Delete Room"
                message={`Are you sure you want to delete "${editing?.name}"?`}
                loading={deleteMutation.isPending}
            />
        </div>
    );
}
