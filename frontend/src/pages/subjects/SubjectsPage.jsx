import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsAPI, departmentsAPI } from '../../services/api';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input, { Select } from '../../components/common/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';

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
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${val ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {val ? 'Lab' : 'Theory'}
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
                <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
                <Button onClick={openCreate}>+ Add Subject</Button>
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
                emptyMessage="No subjects found"
            />

            <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Subject' : 'Add Subject'} size="lg">
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
                                className="h-4 w-4 text-blue-600 rounded"
                            />
                            <label htmlFor="isLab" className="ml-2 text-sm text-gray-700">This is a Laboratory subject</label>
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
        </div>
    );
}
