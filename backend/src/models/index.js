const User = require('./User');
const Department = require('./Department');
const Faculty = require('./Faculty');
const Room = require('./Room');
const Subject = require('./Subject');
const Batch = require('./Batch');
const TimeSlot = require('./TimeSlot');
const Constraint = require('./Constraint');
const FixedSlot = require('./FixedSlot');
const SolverJob = require('./SolverJob');
const Timetable = require('./Timetable');
const AuditLog = require('./AuditLog');

module.exports = {
    User,
    Department,
    Faculty,
    Room,
    Subject,
    Batch,
    TimeSlot,
    Constraint,
    FixedSlot,
    SolverJob,
    Timetable,
    AuditLog
};
