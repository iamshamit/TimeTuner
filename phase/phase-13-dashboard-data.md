# 📋 PHASE 13: Frontend - Dashboard & Data Management

> **Duration:** 4-5 days  
> **Dependencies:** Phase 12, Phase 4

---

## 🎯 Phase Objectives

Build the dashboard with statistics and create CRUD interfaces for all entities.

---

## 📑 Task Breakdown

---

### 13.1-13.3 Dashboard Components

```jsx
// pages/dashboard/Dashboard.jsx
import { useQuery } from '@tanstack/react-query';
import { Users, DoorOpen, BookOpen, Calendar, TrendingUp } from 'lucide-react';
import Card from '../../components/common/Card';
import api from '../../services/api';

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data.data;
    }
  });
  
  const statCards = [
    { label: 'Faculties', value: stats?.facultyCount || 0, icon: Users, color: 'blue' },
    { label: 'Rooms', value: stats?.roomCount || 0, icon: DoorOpen, color: 'green' },
    { label: 'Subjects', value: stats?.subjectCount || 0, icon: BookOpen, color: 'purple' },
    { label: 'Active Timetables', value: stats?.timetableCount || 0, icon: Calendar, color: 'orange' }
  ];
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
              <stat.icon className={`text-${stat.color}-600`} size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-gray-500">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Timetables">
          <RecentTimetables />
        </Card>
        <Card title="Quick Actions">
          <QuickActions />
        </Card>
      </div>
    </div>
  );
}
```

---

### 13.4 Reusable Data Table

```jsx
// components/common/DataTable.jsx
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Plus } from 'lucide-react';
import Button from './Button';
import Input from './Input';

export default function DataTable({ 
  columns, data, loading, pagination, onPageChange,
  onSearch, onAdd, addLabel = 'Add New', searchPlaceholder = 'Search...'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    onSearch?.(e.target.value);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder={searchPlaceholder}
            className="pl-10 pr-4 py-2 border rounded-lg w-full"
          />
        </div>
        
        {onAdd && (
          <Button onClick={onAdd}>
            <Plus size={18} className="mr-2" /> {addLabel}
          </Button>
        )}
      </div>
      
      <div className="overflow-x-auto bg-white rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={columns.length} className="text-center py-8">Loading...</td></tr>
            ) : data?.length === 0 ? (
              <tr><td colSpan={columns.length} className="text-center py-8 text-gray-500">No data found</td></tr>
            ) : (
              data?.map((row, idx) => (
                <tr key={row._id || idx} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => onPageChange(pagination.page - 1)} disabled={!pagination.hasPrev}>
              <ChevronLeft size={18} />
            </Button>
            <span className="px-3 py-1.5">{pagination.page} / {pagination.pages}</span>
            <Button variant="secondary" size="sm" onClick={() => onPageChange(pagination.page + 1)} disabled={!pagination.hasNext}>
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### 13.5-13.9 Entity Management Pages

```jsx
// pages/faculties/FacultyList.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2 } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import FacultyForm from './FacultyForm';
import api from '../../services/api';
import Button from '../../components/common/Button';

export default function FacultyList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useQuery({
    queryKey: ['faculties', page, search],
    queryFn: async () => {
      const res = await api.get('/faculties', { params: { page, search } });
      return res.data;
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/faculties/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['faculties'])
  });
  
  const columns = [
    { key: 'employeeId', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'department', label: 'Department', render: (row) => row.department?.code },
    { key: 'designation', label: 'Designation' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => { setEditingFaculty(row); setModalOpen(true); }}>
            <Edit size={16} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(row._id)}>
            <Trash2 size={16} className="text-red-500" />
          </Button>
        </div>
      )
    }
  ];
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Faculty Management</h1>
      
      <DataTable
        columns={columns}
        data={data?.data}
        loading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
        onSearch={setSearch}
        onAdd={() => { setEditingFaculty(null); setModalOpen(true); }}
        addLabel="Add Faculty"
      />
      
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingFaculty ? 'Edit Faculty' : 'Add Faculty'}>
        <FacultyForm faculty={editingFaculty} onSuccess={() => { setModalOpen(false); queryClient.invalidateQueries(['faculties']); }} />
      </Modal>
    </div>
  );
}
```

---

### 13.10-13.13 CRUD Forms & Validation

```jsx
// pages/faculties/FacultyForm.jsx
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import api from '../../services/api';

export default function FacultyForm({ faculty, onSuccess }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: faculty || { maxDailyClasses: 4 }
  });
  
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data.data
  });
  
  const mutation = useMutation({
    mutationFn: (data) => faculty 
      ? api.patch(`/faculties/${faculty._id}`, data)
      : api.post('/faculties', data),
    onSuccess
  });
  
  return (
    <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-4">
      <Input label="Employee ID" {...register('employeeId', { required: 'Required' })} error={errors.employeeId?.message} />
      <Input label="Name" {...register('name', { required: 'Required' })} error={errors.name?.message} />
      <Input label="Email" type="email" {...register('email', { required: 'Required' })} error={errors.email?.message} />
      
      <div>
        <label className="block text-sm font-medium mb-1">Department</label>
        <select {...register('department', { required: 'Required' })} className="w-full px-3 py-2 border rounded-lg">
          <option value="">Select...</option>
          {departments?.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Designation</label>
        <select {...register('designation')} className="w-full px-3 py-2 border rounded-lg">
          <option value="Professor">Professor</option>
          <option value="Associate Professor">Associate Professor</option>
          <option value="Assistant Professor">Assistant Professor</option>
          <option value="Lecturer">Lecturer</option>
        </select>
      </div>
      
      <Input label="Max Daily Classes" type="number" {...register('maxDailyClasses', { min: 1, max: 8 })} />
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
```

---

## ✅ Phase 13 Completion Checklist

```
□ Dashboard with stat cards
□ Recent activity feed
□ DataTable component
□ Faculty management page
□ Room management page
□ Subject management page
□ Batch management page
□ CRUD modals with forms
□ Form validation (react-hook-form)
□ Search & filter working
□ Pagination implemented
□ Delete confirmation
□ Changes committed to Git
```

---

## ⏭️ Next: Phase 14 - Timetable Generation & Visualization
