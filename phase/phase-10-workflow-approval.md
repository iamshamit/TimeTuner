# 📋 PHASE 10: Workflow & Approval System

> **Duration:** 2-3 days  
> **Dependencies:** Phase 9

---

## 🎯 Phase Objectives

Implement timetable lifecycle management with state transitions, approval workflow, versioning, and notifications.

---

## 📑 Task Breakdown

---

### 10.1-10.3 Lifecycle States & Version Management

```javascript
// services/timetableWorkflowService.js
const Timetable = require('../models/Timetable');
const { AppError } = require('../utils/appError');
const AuditLog = require('../models/AuditLog');
const NotificationService = require('./notificationService');

const VALID_TRANSITIONS = {
  draft: ['review', 'archived'],
  review: ['approved', 'draft', 'archived'],
  approved: ['published', 'review', 'archived'],
  published: ['archived'],
  archived: ['draft']
};

class TimetableWorkflowService {
  
  async submitForReview(timetableId, userId) {
    return this._transition(timetableId, 'review', userId, 'Submitted for review');
  }
  
  async approve(timetableId, userId, comment) {
    const timetable = await this._transition(timetableId, 'approved', userId, comment);
    
    // Update metadata
    await Timetable.findByIdAndUpdate(timetableId, {
      'metadata.approvedBy': userId,
      'metadata.approvedAt': new Date()
    });
    
    // Notify creator
    await NotificationService.send(
      timetable.createdBy,
      'Timetable Approved',
      `Your timetable "${timetable.name}" has been approved.`
    );
    
    return timetable;
  }
  
  async reject(timetableId, userId, reason) {
    const timetable = await this._transition(timetableId, 'draft', userId, reason);
    
    await this.addComment(timetableId, userId, `Rejected: ${reason}`);
    
    await NotificationService.send(
      timetable.createdBy,
      'Timetable Rejected',
      `Your timetable "${timetable.name}" needs revision: ${reason}`
    );
    
    return timetable;
  }
  
  async publish(timetableId, userId) {
    const timetable = await this._transition(timetableId, 'published', userId, 'Published');
    
    await Timetable.findByIdAndUpdate(timetableId, {
      'metadata.publishedAt': new Date()
    });
    
    // Archive other published timetables for same dept/semester
    await Timetable.updateMany(
      {
        department: timetable.department,
        semester: timetable.semester,
        status: 'published',
        _id: { $ne: timetableId }
      },
      { status: 'archived' }
    );
    
    return timetable;
  }
  
  async createVersion(timetableId, userId) {
    const original = await Timetable.findById(timetableId);
    if (!original) throw new AppError('Timetable not found', 404);
    
    const newVersion = await Timetable.create({
      ...original.toObject(),
      _id: undefined,
      version: original.version + 1,
      status: 'draft',
      createdBy: userId,
      createdAt: undefined,
      updatedAt: undefined,
      'metadata.approvedBy': undefined,
      'metadata.approvedAt': undefined,
      'metadata.publishedAt': undefined
    });
    
    return newVersion;
  }
  
  async compareVersions(timetableId1, timetableId2) {
    const [tt1, tt2] = await Promise.all([
      Timetable.findById(timetableId1).populate('events.faculty events.room events.subject'),
      Timetable.findById(timetableId2).populate('events.faculty events.room events.subject')
    ]);
    
    const changes = [];
    const tt1Events = new Map(tt1.events.map(e => [`${e.batch}-${e.day}-${e.slot}`, e]));
    const tt2Events = new Map(tt2.events.map(e => [`${e.batch}-${e.day}-${e.slot}`, e]));
    
    // Find differences
    for (const [key, e1] of tt1Events) {
      const e2 = tt2Events.get(key);
      if (!e2) {
        changes.push({ type: 'removed', event: e1 });
      } else if (e1.subject.toString() !== e2.subject.toString() ||
                 e1.faculty.toString() !== e2.faculty.toString() ||
                 e1.room.toString() !== e2.room.toString()) {
        changes.push({ type: 'modified', before: e1, after: e2 });
      }
    }
    
    for (const [key, e2] of tt2Events) {
      if (!tt1Events.has(key)) {
        changes.push({ type: 'added', event: e2 });
      }
    }
    
    return { changes, tt1: { version: tt1.version, score: tt1.score }, tt2: { version: tt2.version, score: tt2.score } };
  }
  
  async addComment(timetableId, userId, comment) {
    return Timetable.findByIdAndUpdate(
      timetableId,
      { $push: { comments: { user: userId, comment, createdAt: new Date() } } },
      { new: true }
    );
  }
  
  async _transition(timetableId, newStatus, userId, reason) {
    const timetable = await Timetable.findById(timetableId);
    if (!timetable) throw new AppError('Timetable not found', 404);
    
    const currentStatus = timetable.status;
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];
    
    if (!allowedTransitions?.includes(newStatus)) {
      throw new AppError(`Cannot transition from ${currentStatus} to ${newStatus}`, 400);
    }
    
    const updated = await Timetable.findByIdAndUpdate(
      timetableId,
      { status: newStatus },
      { new: true }
    );
    
    // Audit log
    await AuditLog.create({
      action: 'UPDATE',
      entity: 'timetable',
      entityId: timetableId,
      user: userId,
      changes: { before: { status: currentStatus }, after: { status: newStatus } }
    });
    
    return updated;
  }
}

module.exports = new TimetableWorkflowService();
```

---

### 10.4-10.10 Routes & Notification Service

```javascript
// routes/timetables.js (workflow endpoints)
const WorkflowService = require('../services/timetableWorkflowService');

router.post('/:id/submit-review', checkPermission('timetables:update'), async (req, res, next) => {
  try {
    const timetable = await WorkflowService.submitForReview(req.params.id, req.user._id);
    Response.success(res, timetable, 'Submitted for review');
  } catch (error) { next(error); }
});

router.post('/:id/approve', checkPermission('timetables:approve'), async (req, res, next) => {
  try {
    const timetable = await WorkflowService.approve(req.params.id, req.user._id, req.body.comment);
    Response.success(res, timetable, 'Approved');
  } catch (error) { next(error); }
});

router.post('/:id/reject', checkPermission('timetables:approve'), async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return next(new AppError('Rejection reason required', 400));
    const timetable = await WorkflowService.reject(req.params.id, req.user._id, reason);
    Response.success(res, timetable, 'Rejected');
  } catch (error) { next(error); }
});

router.post('/:id/publish', checkPermission('timetables:publish'), async (req, res, next) => {
  try {
    const timetable = await WorkflowService.publish(req.params.id, req.user._id);
    Response.success(res, timetable, 'Published');
  } catch (error) { next(error); }
});

router.post('/:id/comments', async (req, res, next) => {
  try {
    const timetable = await WorkflowService.addComment(req.params.id, req.user._id, req.body.comment);
    Response.success(res, timetable);
  } catch (error) { next(error); }
});

router.get('/:id1/compare/:id2', async (req, res, next) => {
  try {
    const comparison = await WorkflowService.compareVersions(req.params.id1, req.params.id2);
    Response.success(res, comparison);
  } catch (error) { next(error); }
});
```

```javascript
// services/notificationService.js
const Notification = require('../models/Notification');

class NotificationService {
  async send(userId, title, message, type = 'info') {
    return Notification.create({ user: userId, title, message, type, read: false });
  }
  
  async getUnread(userId) {
    return Notification.find({ user: userId, read: false }).sort({ createdAt: -1 });
  }
  
  async markRead(notificationId) {
    return Notification.findByIdAndUpdate(notificationId, { read: true });
  }
}

module.exports = new NotificationService();
```

---

## ✅ Phase 10 Completion Checklist

```
□ State machine with valid transitions
□ Submit for review working
□ Approve/reject workflow
□ Publish mechanism
□ Version management
□ Version comparison
□ Comment system
□ Notification service
□ Audit logging
□ API routes complete
□ Changes committed to Git
```

---

## ⏭️ Next: Phase 11 - Frontend Foundation
