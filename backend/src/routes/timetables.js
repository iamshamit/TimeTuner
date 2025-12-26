const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { protect, checkPermission, restrictTo } = require('../middleware/auth');

router.use(protect);

// List and view timetables
router.get('/', timetableController.getAllTimetables);
router.get('/:id', timetableController.getTimetable);

// Update and delete
router.patch('/:id', checkPermission('timetables:update'), timetableController.updateTimetable);
router.delete('/:id', checkPermission('timetables:delete'), timetableController.deleteTimetable);

// Workflow actions
router.post('/:id/submit', checkPermission('timetables:update'), timetableController.submitForReview);
router.post('/:id/approve', restrictTo('admin', 'hod'), timetableController.approveTimetable);
router.post('/:id/publish', restrictTo('admin'), timetableController.publishTimetable);

// Comments
router.post('/:id/comments', timetableController.addComment);

// View by entity
router.get('/batch/:batchId', timetableController.getBatchTimetable);
router.get('/faculty/:facultyId', timetableController.getFacultyTimetable);

module.exports = router;
