const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const { protect, checkPermission, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { timeSlotSchema } = require('../validators/entityValidators');

router.use(protect);

router.route('/')
    .get(configController.getAllTimeSlots)
    .post(restrictTo('admin', 'scheduler'), validate(timeSlotSchema.create), configController.createTimeSlot);

router.route('/:id')
    .get(configController.getTimeSlot)
    .patch(restrictTo('admin', 'scheduler'), validate(timeSlotSchema.update), configController.updateTimeSlot)
    .delete(restrictTo('admin'), configController.deleteTimeSlot);

module.exports = router;
