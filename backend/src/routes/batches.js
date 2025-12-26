const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const { protect, checkPermission } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { batchSchema } = require('../validators/entityValidators');

router.use(protect);

router.route('/')
    .get(checkPermission('batches:read'), batchController.getAllBatches)
    .post(checkPermission('batches:create'), validate(batchSchema.create), batchController.createBatch);

router.route('/:id')
    .get(checkPermission('batches:read'), batchController.getBatch)
    .patch(checkPermission('batches:update'), validate(batchSchema.update), batchController.updateBatch)
    .delete(checkPermission('batches:delete'), batchController.deleteBatch);

router.post('/:id/assign-faculty',
    checkPermission('batches:update'),
    batchController.assignFaculty
);

module.exports = router;
