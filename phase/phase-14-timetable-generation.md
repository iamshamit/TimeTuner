# 📋 PHASE 14: Frontend - Timetable Generation & Visualization

> **Duration:** 5-6 days  
> **Dependencies:** Phase 13, Phase 9

---

## 🎯 Phase Objectives

Build the solver configuration interface, job progress tracking, and timetable visualization grid.

---

## 📑 Task Breakdown

---

### 14.1-14.4 Solver Configuration & Job Progress

```jsx
// pages/solver/SolverPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wand2, Loader2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';

export default function SolverPage() {
  const [config, setConfig] = useState({
    department: '',
    semester: 1,
    timeout: 300,
    maxSolutions: 5
  });
  const [activeJobId, setActiveJobId] = useState(null);
  const queryClient = useQueryClient();
  
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data.data
  });
  
  const { data: jobStatus, isLoading: isPolling } = useQuery({
    queryKey: ['solver-job', activeJobId],
    queryFn: async () => (await api.get(`/solver/jobs/${activeJobId}`)).data.data,
    enabled: !!activeJobId,
    refetchInterval: (data) => data?.status === 'completed' || data?.status === 'failed' ? false : 2000
  });
  
  const startMutation = useMutation({
    mutationFn: () => api.post('/solver/jobs', config),
    onSuccess: (res) => setActiveJobId(res.data.data.jobId)
  });
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Generate Timetable</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Configuration">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <select
                value={config.department}
                onChange={(e) => setConfig({ ...config, department: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select Department</option>
                {departments?.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Semester</label>
              <select
                value={config.semester}
                onChange={(e) => setConfig({ ...config, semester: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Timeout (seconds)</label>
              <input
                type="range"
                min="60"
                max="600"
                value={config.timeout}
                onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{config.timeout}s</span>
            </div>
            
            <Button 
              onClick={() => startMutation.mutate()} 
              disabled={!config.department || startMutation.isPending}
              className="w-full"
            >
              {startMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Wand2 className="mr-2" />}
              Generate Timetable
            </Button>
          </div>
        </Card>
        
        <Card title="Job Progress">
          {!activeJobId ? (
            <p className="text-gray-500 text-center py-8">Configure and start a solver job</p>
          ) : (
            <JobProgress status={jobStatus} />
          )}
        </Card>
      </div>
      
      {jobStatus?.status === 'completed' && jobStatus.results?.length > 0 && (
        <SolutionResults results={jobStatus.results} />
      )}
    </div>
  );
}

function JobProgress({ status }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    running: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status?.status]}`}>
          {status?.status?.toUpperCase()}
        </span>
        <span className="text-sm text-gray-500">{status?.progress || 0}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${status?.progress || 0}%` }} />
      </div>
      
      {status?.error && <p className="text-red-600 text-sm">{status.error}</p>}
    </div>
  );
}
```

---

### 14.5-14.9 Timetable Grid Component

```jsx
// components/timetable/TimetableGrid.jsx
import { useMemo } from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SLOTS = [1, 2, 3, 4, 5, 6];

const COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-teal-100 border-teal-300 text-teal-800',
];

export default function TimetableGrid({ events, viewMode = 'batch', filterValue }) {
  const colorMap = useMemo(() => {
    const map = {};
    const subjects = [...new Set(events.map(e => e.subject_code))];
    subjects.forEach((s, i) => { map[s] = COLORS[i % COLORS.length]; });
    return map;
  }, [events]);
  
  const filteredEvents = useMemo(() => {
    if (!filterValue) return events;
    return events.filter(e => {
      if (viewMode === 'batch') return e.batch_id === filterValue;
      if (viewMode === 'faculty') return e.faculty_id === filterValue;
      if (viewMode === 'room') return e.room_id === filterValue;
      return true;
    });
  }, [events, viewMode, filterValue]);
  
  const getEvent = (day, slot) => filteredEvents.find(e => e.day === day && e.slot === slot);
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-3 bg-gray-50 w-20">Time</th>
            {DAYS.map(day => (
              <th key={day} className="border p-3 bg-gray-50 min-w-32">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SLOTS.map(slot => (
            <tr key={slot}>
              <td className="border p-3 text-center font-medium bg-gray-50">Slot {slot}</td>
              {DAYS.map(day => {
                const event = getEvent(day, slot);
                return (
                  <td key={`${day}-${slot}`} className="border p-1 h-24">
                    {event && (
                      <div className={`p-2 rounded border h-full ${colorMap[event.subject_code]}`}>
                        <p className="font-semibold text-sm">{event.subject_code}</p>
                        <p className="text-xs">{event.faculty_name}</p>
                        <p className="text-xs opacity-75">{event.room_code}</p>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### 14.10-14.13 Solution Comparison & Selection

```jsx
// pages/solver/SolutionResults.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import TimetableGrid from '../../components/timetable/TimetableGrid';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export default function SolutionResults({ results }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const navigate = useNavigate();
  const current = results[currentIdx];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Generated Solutions ({results.length})</h2>
        
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="sm" onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}>
            <ChevronLeft size={18} />
          </Button>
          <span>Solution {currentIdx + 1} of {results.length}</span>
          <Button variant="secondary" size="sm" onClick={() => setCurrentIdx(i => Math.min(results.length - 1, i + 1))} disabled={currentIdx === results.length - 1}>
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-primary-600">{(current.score * 100).toFixed(1)}%</p>
          <p className="text-gray-500">Quality Score</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-600">{current.violations?.hard || 0}</p>
          <p className="text-gray-500">Hard Violations</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-yellow-600">{current.violations?.soft || 0}</p>
          <p className="text-gray-500">Soft Violations</p>
        </Card>
      </div>
      
      <Card title="Timetable Preview">
        <TimetableGrid events={current.timetable?.events || []} />
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={() => navigate(`/timetables/${current.timetable?._id}`)}>
          <Check className="mr-2" size={18} /> Select This Solution
        </Button>
      </div>
    </div>
  );
}
```

---

## ✅ Phase 14 Completion Checklist

```
□ Solver configuration form
□ Constraint selection
□ Weight adjustment sliders
□ Job trigger and progress display
□ TimetableGrid component
□ Weekly view with slots
□ Color coding by subject
□ Filter by batch/faculty/room
□ Conflict highlighting
□ Solution carousel
□ Score & metrics display
□ Solution selection
□ Changes committed to Git
```

---

## ⏭️ Next: Phase 15 - Editing & Advanced Features
