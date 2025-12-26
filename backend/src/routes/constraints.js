const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { constraintSchema } = require('../validators/entityValidators');

router.use(protect);

router.get('/default', configController.getDefaultConstraint);

router.route('/')
    .get(configController.getAllConstraints)
    .post(restrictTo('admin', 'scheduler'), validate(constraintSchema.create), configController.createConstraint);

router.route('/:id')
    .get(configController.getConstraint)
    .patch(restrictTo('admin', 'scheduler'), validate(constraintSchema.update), configController.updateConstraint)
    .delete(restrictTo('admin'), configController.deleteConstraint);

module.exports = router;
