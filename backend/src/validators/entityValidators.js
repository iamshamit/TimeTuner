const Joi = require('joi');

// Common validators
const objectId = Joi.string().hex().length(24);
const objectIdRequired = objectId.required();

// Department
const departmentSchema = {
    create: Joi.object({
        code: Joi.string().required().uppercase().max(10),
        name: Joi.string().required().max(100),
        hod: objectId,
        shifts: Joi.array().items(Joi.string().valid('morning', 'afternoon', 'evening')).default(['morning'])
    }),
    update: Joi.object({
        code: Joi.string().uppercase().max(10),
        name: Joi.string().max(100),
        hod: objectId.allow(null),
        shifts: Joi.array().items(Joi.string().valid('morning', 'afternoon', 'evening')),
        isActive: Joi.boolean()
    })
};

// Faculty
const facultySchema = {
    create: Joi.object({
        employeeId: Joi.string().required().trim(),
        name: Joi.string().required().trim(),
        email: Joi.string().required().email().lowercase(),
        phone: Joi.string().pattern(/^\d{10}$/),
        department: objectIdRequired,
        designation: Joi.string().valid('Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Guest Faculty'),
        subjects: Joi.array().items(objectId),
        maxDailyClasses: Joi.number().min(1).max(8).default(4),
        maxWeeklyClasses: Joi.number().min(1).max(30).default(20),
        avgLeavesPerMonth: Joi.number().min(0).max(10).default(1)
    }),
    update: Joi.object({
        name: Joi.string().trim(),
        email: Joi.string().email().lowercase(),
        phone: Joi.string().pattern(/^\d{10}$/),
        department: objectId,
        designation: Joi.string().valid('Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Guest Faculty'),
        subjects: Joi.array().items(objectId),
        maxDailyClasses: Joi.number().min(1).max(8),
        maxWeeklyClasses: Joi.number().min(1).max(30),
        avgLeavesPerMonth: Joi.number().min(0).max(10),
        isActive: Joi.boolean()
    }),
    assignSubjects: Joi.object({
        subjects: Joi.array().items(objectIdRequired).min(1).required()
    })
};

// Room
const roomSchema = {
    create: Joi.object({
        code: Joi.string().required().uppercase().trim(),
        name: Joi.string().trim(),
        building: Joi.string().trim(),
        floor: Joi.number().min(0).max(20),
        capacity: Joi.number().required().min(1).max(500),
        type: Joi.string().valid('lecture', 'lab', 'seminar', 'auditorium').default('lecture'),
        facilities: Joi.array().items(Joi.string().valid('projector', 'ac', 'whiteboard', 'smartboard', 'computers', 'lab_equipment')),
        department: objectId,
        shifts: Joi.array().items(Joi.string().valid('morning', 'afternoon', 'evening'))
    }),
    update: Joi.object({
        name: Joi.string().trim(),
        building: Joi.string().trim(),
        floor: Joi.number().min(0).max(20),
        capacity: Joi.number().min(1).max(500),
        type: Joi.string().valid('lecture', 'lab', 'seminar', 'auditorium'),
        facilities: Joi.array().items(Joi.string().valid('projector', 'ac', 'whiteboard', 'smartboard', 'computers', 'lab_equipment')),
        department: objectId.allow(null),
        shifts: Joi.array().items(Joi.string().valid('morning', 'afternoon', 'evening')),
        isActive: Joi.boolean()
    })
};

// Subject
const subjectSchema = {
    create: Joi.object({
        code: Joi.string().required().uppercase().trim(),
        name: Joi.string().required().trim(),
        shortName: Joi.string().trim().max(10),
        department: objectIdRequired,
        semester: Joi.number().required().min(1).max(8),
        credits: Joi.number().min(1).max(6).default(3),
        isLab: Joi.boolean().default(false),
        labHoursPerWeek: Joi.number().min(0).default(0),
        lectureHoursPerWeek: Joi.number().min(0).default(3),
        isElective: Joi.boolean().default(false)
    }),
    update: Joi.object({
        name: Joi.string().trim(),
        shortName: Joi.string().trim().max(10),
        department: objectId,
        semester: Joi.number().min(1).max(8),
        credits: Joi.number().min(1).max(6),
        isLab: Joi.boolean(),
        labHoursPerWeek: Joi.number().min(0),
        lectureHoursPerWeek: Joi.number().min(0),
        isElective: Joi.boolean(),
        isActive: Joi.boolean()
    })
};

// Batch
const batchSchema = {
    create: Joi.object({
        code: Joi.string().required().uppercase().trim(),
        name: Joi.string().trim(),
        department: objectIdRequired,
        semester: Joi.number().required().min(1).max(8),
        academicYear: Joi.string().required().pattern(/^\d{4}-\d{2}$/),
        size: Joi.number().required().min(1).max(200),
        shift: Joi.string().valid('morning', 'afternoon', 'evening').default('morning'),
        subjects: Joi.array().items(Joi.object({
            subject: objectIdRequired,
            classesPerWeek: Joi.number().required().min(1).max(10),
            assignedFaculty: objectId
        }))
    }),
    update: Joi.object({
        name: Joi.string().trim(),
        semester: Joi.number().min(1).max(8),
        academicYear: Joi.string().pattern(/^\d{4}-\d{2}$/),
        size: Joi.number().min(1).max(200),
        shift: Joi.string().valid('morning', 'afternoon', 'evening'),
        subjects: Joi.array().items(Joi.object({
            subject: objectIdRequired,
            classesPerWeek: Joi.number().required().min(1).max(10),
            assignedFaculty: objectId
        })),
        isActive: Joi.boolean()
    })
};

// TimeSlot
const timeSlotSchema = {
    create: Joi.object({
        name: Joi.string().required().trim(),
        department: objectId,
        shift: Joi.string().required().valid('morning', 'afternoon', 'evening'),
        slots: Joi.array().items(Joi.object({
            slotNumber: Joi.number().required(),
            startTime: Joi.string().required().pattern(/^\d{2}:\d{2}$/),
            endTime: Joi.string().required().pattern(/^\d{2}:\d{2}$/),
            isBreak: Joi.boolean().default(false),
            breakName: Joi.string()
        })).required(),
        days: Joi.array().items(Joi.string().valid('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')).default(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
        isDefault: Joi.boolean().default(false)
    }),
    update: Joi.object({
        name: Joi.string().trim(),
        slots: Joi.array().items(Joi.object({
            slotNumber: Joi.number().required(),
            startTime: Joi.string().required().pattern(/^\d{2}:\d{2}$/),
            endTime: Joi.string().required().pattern(/^\d{2}:\d{2}$/),
            isBreak: Joi.boolean(),
            breakName: Joi.string()
        })),
        days: Joi.array().items(Joi.string().valid('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
        isDefault: Joi.boolean(),
        isActive: Joi.boolean()
    })
};

// Constraint
const constraintSchema = {
    create: Joi.object({
        name: Joi.string().required().trim(),
        department: objectId,
        constraints: Joi.object({
            hard: Joi.object(),
            soft: Joi.object()
        }),
        isDefault: Joi.boolean().default(false)
    }),
    update: Joi.object({
        name: Joi.string().trim(),
        constraints: Joi.object({
            hard: Joi.object(),
            soft: Joi.object()
        }),
        isDefault: Joi.boolean(),
        isActive: Joi.boolean()
    })
};

module.exports = {
    departmentSchema,
    facultySchema,
    roomSchema,
    subjectSchema,
    batchSchema,
    timeSlotSchema,
    constraintSchema
};
