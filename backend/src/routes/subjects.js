const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { protect, checkPermission } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { subjectSchema } = require('../validators/entityValidators');

router.use(protect);

router.get('/department/:department/semester/:semester',
    checkPermission('subjects:read'),
    subjectController.getSubjectsBySemester
);

router.route('/')
    .get(checkPermission('subjects:read'), subjectController.getAllSubjects)
    .post(checkPermission('subjects:create'), validate(subjectSchema.create), subjectController.createSubject);

router.route('/:id')
    .get(checkPermission('subjects:read'), subjectController.getSubject)
    .patch(checkPermission('subjects:update'), validate(subjectSchema.update), subjectController.updateSubject)
    .delete(checkPermission('subjects:delete'), subjectController.deleteSubject);

module.exports = router;
