# 📋 PHASE 15: Frontend - Editing & Advanced Features

> **Duration:** 3-4 days  
> **Dependencies:** Phase 14

---

## 🎯 Phase Objectives

Implement drag-and-drop editing, export functionality, and advanced timetable features.

---

## 📑 Task Breakdown

---

### 15.1-15.4 Drag & Drop Editing

```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

```jsx
// components/timetable/EditableTimetableGrid.jsx
import { useState } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';

export default function EditableTimetableGrid({ timetable, onUpdate }) {
  const [activeEvent, setActiveEvent] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  
  const validateMutation = useMutation({
    mutationFn: (moveData) => api.post('/timetables/validate-move', moveData)
  });
  
  const handleDragStart = (event) => {
    setActiveEvent(event.active.data.current);
  };
  
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveEvent(null);
    
    if (!over) return;
    
    const [newDay, newSlot] = over.id.split('-');
    const eventData = active.data.current;
    
    // Validate move
    const validation = await validateMutation.mutateAsync({
      timetableId: timetable._id,
      eventId: eventData._id,
      newDay,
      newSlot: parseInt(newSlot)
    });
    
    if (validation.data.valid) {
      onUpdate({ ...eventData, day: newDay, slot: parseInt(newSlot) });
    } else {
      setConflicts(validation.data.conflicts);
    }
  };
  
  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-7 gap-1">
        <div></div>
        {['Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="text-center font-medium p-2">{d}</div>
        ))}
        
        {[1,2,3,4,5,6].map(slot => (
          <>
            <div className="text-center p-2 bg-gray-50">Slot {slot}</div>
            {['Mon','Tue','Wed','Thu','Fri','Sat'].map(day => (
              <DroppableCell key={`${day}-${slot}`} id={`${day}-${slot}`}>
                {timetable.events
                  .filter(e => e.day === day && e.slot === slot)
                  .map(event => <DraggableEvent key={event._id} event={event} />)
                }
              </DroppableCell>
            ))}
          </>
        ))}
      </div>
      
      <DragOverlay>
        {activeEvent && <EventCard event={activeEvent} isDragging />}
      </DragOverlay>
      
      {conflicts.length > 0 && <ConflictModal conflicts={conflicts} onClose={() => setConflicts([])} />}
    </DndContext>
  );
}

function DroppableCell({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`min-h-20 border p-1 ${isOver ? 'bg-primary-50' : ''}`}>
      {children}
    </div>
  );
}

function DraggableEvent({ event }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event._id,
    data: event
  });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={`cursor-grab ${isDragging ? 'opacity-50' : ''}`}>
      <EventCard event={event} />
    </div>
  );
}
```

---

### 15.5-15.6 Quick Edit & Undo/Redo

```jsx
// hooks/useUndoRedo.js
import { useState, useCallback } from 'react';

export default function useUndoRedo(initialState) {
  const [history, setHistory] = useState([initialState]);
  const [index, setIndex] = useState(0);
  
  const state = history[index];
  
  const setState = useCallback((newState) => {
    const newHistory = history.slice(0, index + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setIndex(newHistory.length - 1);
  }, [history, index]);
  
  const undo = useCallback(() => {
    if (index > 0) setIndex(index - 1);
  }, [index]);
  
  const redo = useCallback(() => {
    if (index < history.length - 1) setIndex(index + 1);
  }, [index, history.length]);
  
  const canUndo = index > 0;
  const canRedo = index < history.length - 1;
  
  return { state, setState, undo, redo, canUndo, canRedo };
}
```

---

### 15.7-15.10 Export Features

```bash
npm install jspdf html2canvas xlsx file-saver
```

```jsx
// services/exportService.js
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export async function exportToPDF(elementId, filename) {
  const element = document.getElementById(elementId);
  const canvas = await html2canvas(element, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  
  const pdf = new jsPDF('l', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(`${filename}.pdf`);
}

export function exportToExcel(events, filename) {
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const SLOTS = [1, 2, 3, 4, 5, 6];
  
  const data = SLOTS.map(slot => {
    const row = { 'Time Slot': `Slot ${slot}` };
    DAYS.forEach(day => {
      const event = events.find(e => e.day === day && e.slot === slot);
      row[day] = event ? `${event.subject_code}\n${event.faculty_name}\n${event.room_code}` : '';
    });
    return row;
  });
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToICS(events, filename) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TimeTuner//Timetable//EN'
  ];
  
  events.forEach(event => {
    lines.push('BEGIN:VEVENT');
    lines.push(`SUMMARY:${event.subject_code}`);
    lines.push(`DESCRIPTION:${event.faculty_name} - ${event.room_code}`);
    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${event.day.toUpperCase().slice(0,2)}`);
    lines.push('END:VEVENT');
  });
  
  lines.push('END:VCALENDAR');
  
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  saveAs(blob, `${filename}.ics`);
}
```

```jsx
// components/timetable/ExportMenu.jsx
import { FileDown, FileText, Table, Calendar } from 'lucide-react';
import { exportToPDF, exportToExcel, exportToICS } from '../../services/exportService';
import Button from '../common/Button';

export default function ExportMenu({ events, timetableName, gridElementId }) {
  return (
    <div className="flex gap-2">
      <Button variant="secondary" size="sm" onClick={() => exportToPDF(gridElementId, timetableName)}>
        <FileText size={16} className="mr-1" /> PDF
      </Button>
      <Button variant="secondary" size="sm" onClick={() => exportToExcel(events, timetableName)}>
        <Table size={16} className="mr-1" /> Excel
      </Button>
      <Button variant="secondary" size="sm" onClick={() => exportToICS(events, timetableName)}>
        <Calendar size={16} className="mr-1" /> iCal
      </Button>
    </div>
  );
}
```

---

### 15.11 Shareable Public Links

```jsx
// pages/timetables/ShareModal.jsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Copy, Check } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import api from '../../services/api';

export default function ShareModal({ timetableId, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  
  const { data, mutate } = useMutation({
    mutationFn: () => api.post(`/timetables/${timetableId}/share`),
  });
  
  const shareUrl = data?.data?.shareUrl || '';
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Timetable">
      <div className="space-y-4">
        <p>Generate a public link that anyone can view:</p>
        
        {!shareUrl ? (
          <Button onClick={() => mutate()}>Generate Share Link</Button>
        ) : (
          <div className="flex gap-2">
            <input type="text" value={shareUrl} readOnly className="flex-1 px-3 py-2 border rounded-lg bg-gray-50" />
            <Button onClick={copyToClipboard}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
```

---

## ✅ Phase 15 Completion Checklist

```
□ Drag & drop library integrated
□ Manual class movement working
□ Real-time conflict validation
□ Swap functionality
□ Quick edit modal
□ Undo/redo implemented
□ PDF export working
□ Excel export working
□ iCal export working
□ Print-friendly CSS
□ Shareable public links
□ Changes committed to Git
```

---

## ⏭️ Next: Phase 16 - Testing
