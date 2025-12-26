import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { batchesAPI, departmentsAPI, subjectsAPI, facultiesAPI } from '../../services/api';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input, { Select } from '../../components/common/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';

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
        // Load existing subject assignments - read from assignedFaculty
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
        // Filter out empty assignments and transform faculty -> assignedFaculty
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

    // Filter subjects by batch's semester and department
    const getAvailableSubjects = () => {
        if (!editing) return allSubjects;
        return allSubjects.filter(s =>
            s.semester === editing.semester &&
            (s.department?._id || s.department) === (editing.department?._id || editing.department)
        );
    };

    // Filter faculties by batch's department
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
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${(val?.length || 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {val?.length || 0} assigned
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); openSubjectsModal(row); }} className="text-purple-600 hover:text-purple-800 font-medium">Subjects</button>
                    <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="text-blue-600 hover:text-blue-800">Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); setEditing(row); setDeleteOpen(true); }} className="text-red-600 hover:text-red-800">Delete</button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Batches</h1>
                <Button onClick={openCreate}>+ Add Batch</Button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                ⚠️ <strong>Important:</strong> Click "Subjects" to assign subjects and faculties to each batch. The solver needs this to generate timetables.
            </div>

            {error && !modalOpen && !subjectsModalOpen && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                    <button onClick={() => setError('')} className="float-right font-bold">×</button>
                </div>
            )}

            <Table
                columns={columns}
                data={data?.data?.data || []}
                loading={isLoading}
                emptyMessage="No batches found"
            />

            {/* Create/Edit Batch Modal */}
            <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Batch' : 'Add Batch'} size="lg">
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
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <p className="text-sm text-gray-600">
                        Assign subjects and their teaching faculty for <strong>{editing?.name}</strong> (Semester {editing?.semester})
                    </p>

                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {subjectAssignments.map((assignment, idx) => (
                            <div key={idx} className="flex gap-3 items-end p-3 bg-gray-50 rounded-lg">
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
                                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                                    disabled={subjectAssignments.length === 1}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    <Button type="button" variant="ghost" onClick={addSubjectRow}>
                        + Add Another Subject
                    </Button>

                    <div className="flex justify-end gap-3 pt-4 border-t">
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
        </div>
    );
}
