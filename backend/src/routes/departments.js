const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { protect, checkPermission } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { departmentSchema } = require('../validators/entityValidators');

router.use(protect);

router.route('/')
    .get(checkPermission('departments:read'), departmentController.getAllDepartments)
    .post(checkPermission('departments:create'), validate(departmentSchema.create), departmentController.createDepartment);

router.route('/:id')
    .get(checkPermission('departments:read'), departmentController.getDepartment)
    .patch(checkPermission('departments:update'), validate(departmentSchema.update), departmentController.updateDepartment)
    .delete(checkPermission('departments:delete'), departmentController.deleteDepartment);

module.exports = router;
