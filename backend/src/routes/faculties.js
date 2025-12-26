const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { protect, checkPermission } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { facultySchema } = require('../validators/entityValidators');

router.use(protect);

router.route('/')
    .get(checkPermission('faculties:read'), facultyController.getAllFaculties)
    .post(checkPermission('faculties:create'), validate(facultySchema.create), facultyController.createFaculty);

router.route('/:id')
    .get(checkPermission('faculties:read'), facultyController.getFaculty)
    .patch(checkPermission('faculties:update'), validate(facultySchema.update), facultyController.updateFaculty)
    .delete(checkPermission('faculties:delete'), facultyController.deleteFaculty);

router.post('/:id/subjects',
    checkPermission('faculties:update'),
    validate(facultySchema.assignSubjects),
    facultyController.assignSubjects
);

module.exports = router;
