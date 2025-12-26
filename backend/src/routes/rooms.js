const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { protect, checkPermission } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { roomSchema } = require('../validators/entityValidators');

router.use(protect);

router.get('/available', checkPermission('rooms:read'), roomController.getAvailableRooms);

router.route('/')
    .get(checkPermission('rooms:read'), roomController.getAllRooms)
    .post(checkPermission('rooms:create'), validate(roomSchema.create), roomController.createRoom);

router.route('/:id')
    .get(checkPermission('rooms:read'), roomController.getRoom)
    .patch(checkPermission('rooms:update'), validate(roomSchema.update), roomController.updateRoom)
    .delete(checkPermission('rooms:delete'), roomController.deleteRoom);

module.exports = router;
