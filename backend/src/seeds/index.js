const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const {
    User, Department, Faculty, Room, Subject,
    Batch, TimeSlot, Constraint
} = require('../models');

const departmentData = require('./departments.seed');

const seedDatabase = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI, {
            tls: true,
            tlsAllowInvalidCertificates: true
        });
        console.log('Connected to MongoDB');

        // Clear existing data
        console.log('Clearing existing data...');
        await Promise.all([
            User.deleteMany({}),
            Department.deleteMany({}),
            Faculty.deleteMany({}),
            Room.deleteMany({}),
            Subject.deleteMany({}),
            Batch.deleteMany({}),
            TimeSlot.deleteMany({}),
            Constraint.deleteMany({})
        ]);
        console.log('Cleared existing data');

        // Seed departments
        const departments = await Department.insertMany(departmentData);
        console.log(`✓ Seeded ${departments.length} departments`);

        // Seed admin user (password will be hashed by User model's pre-save hook)
        await User.create({
            email: 'admin@college.edu',
            password: 'Admin@123',
            name: 'System Administrator',
            role: 'admin'
        });
        console.log('✓ Seeded admin user (admin@college.edu / Admin@123)');

        // Get CSE department for sample data
        const cseDept = departments.find(d => d.code === 'CSE');

        // Seed sample rooms
        const rooms = await Room.insertMany([
            { code: 'CR101', name: 'Classroom 101', building: 'Main Block', floor: 1, capacity: 60, type: 'lecture' },
            { code: 'CR102', name: 'Classroom 102', building: 'Main Block', floor: 1, capacity: 60, type: 'lecture' },
            { code: 'LAB01', name: 'Computer Lab 1', building: 'IT Block', floor: 2, capacity: 60, type: 'lab', facilities: ['computers', 'ac', 'projector'] },
            { code: 'LAB02', name: 'Computer Lab 2', building: 'IT Block', floor: 2, capacity: 60, type: 'lab', facilities: ['computers', 'ac', 'projector'] },
            { code: 'SEM01', name: 'Seminar Hall', building: 'Main Block', floor: 0, capacity: 100, type: 'seminar', facilities: ['projector', 'ac', 'smartboard'] }
        ]);
        console.log(`✓ Seeded ${rooms.length} rooms`);

        // Seed sample subjects
        const subjects = await Subject.insertMany([
            { code: 'CS301', name: 'Data Structures', shortName: 'DSA', department: cseDept._id, semester: 3, credits: 4, isLab: false, lectureHoursPerWeek: 3 },
            { code: 'CS302', name: 'Operating Systems', shortName: 'OS', department: cseDept._id, semester: 3, credits: 4, isLab: false, lectureHoursPerWeek: 3 },
            { code: 'CS303', name: 'Database Systems', shortName: 'DBMS', department: cseDept._id, semester: 3, credits: 4, isLab: false, lectureHoursPerWeek: 3 },
            { code: 'CS304L', name: 'DSA Lab', shortName: 'DSA-L', department: cseDept._id, semester: 3, credits: 2, isLab: true, labHoursPerWeek: 2, roomType: 'lab' },
            { code: 'CS305L', name: 'DBMS Lab', shortName: 'DBMS-L', department: cseDept._id, semester: 3, credits: 2, isLab: true, labHoursPerWeek: 2, roomType: 'lab' }
        ]);
        console.log(`✓ Seeded ${subjects.length} subjects`);

        // Seed sample faculties
        const faculties = await Faculty.insertMany([
            { employeeId: 'FAC001', name: 'Dr. Sharma', email: 'sharma@college.edu', department: cseDept._id, designation: 'Professor', subjects: [subjects[0]._id, subjects[3]._id], maxDailyClasses: 4 },
            { employeeId: 'FAC002', name: 'Dr. Verma', email: 'verma@college.edu', department: cseDept._id, designation: 'Associate Professor', subjects: [subjects[1]._id], maxDailyClasses: 4 },
            { employeeId: 'FAC003', name: 'Prof. Singh', email: 'singh@college.edu', department: cseDept._id, designation: 'Assistant Professor', subjects: [subjects[2]._id, subjects[4]._id], maxDailyClasses: 5 }
        ]);
        console.log(`✓ Seeded ${faculties.length} faculties`);

        // Seed sample batch
        const batch = await Batch.create({
            code: 'CSE-3A',
            name: 'CSE Semester 3 Section A',
            department: cseDept._id,
            semester: 3,
            academicYear: '2024-25',
            size: 60,
            shift: 'morning',
            subjects: [
                { subject: subjects[0]._id, classesPerWeek: 3, assignedFaculty: faculties[0]._id },
                { subject: subjects[1]._id, classesPerWeek: 3, assignedFaculty: faculties[1]._id },
                { subject: subjects[2]._id, classesPerWeek: 3, assignedFaculty: faculties[2]._id },
                { subject: subjects[3]._id, classesPerWeek: 2, assignedFaculty: faculties[0]._id },
                { subject: subjects[4]._id, classesPerWeek: 2, assignedFaculty: faculties[2]._id }
            ]
        });
        console.log(`✓ Seeded batch: ${batch.code}`);

        // Seed default time slots
        const timeSlot = await TimeSlot.create({
            name: 'Default Morning Schedule',
            shift: 'morning',
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            slots: [
                { slotNumber: 1, startTime: '09:00', endTime: '09:50', isBreak: false },
                { slotNumber: 2, startTime: '09:50', endTime: '10:40', isBreak: false },
                { slotNumber: 3, startTime: '10:40', endTime: '10:55', isBreak: true, breakName: 'Tea Break' },
                { slotNumber: 4, startTime: '10:55', endTime: '11:45', isBreak: false },
                { slotNumber: 5, startTime: '11:45', endTime: '12:35', isBreak: false },
                { slotNumber: 6, startTime: '12:35', endTime: '13:30', isBreak: true, breakName: 'Lunch' },
                { slotNumber: 7, startTime: '13:30', endTime: '14:20', isBreak: false },
                { slotNumber: 8, startTime: '14:20', endTime: '15:10', isBreak: false }
            ],
            isDefault: true
        });
        console.log('✓ Seeded default time slots');

        // Seed default constraints
        const constraint = await Constraint.create({
            name: 'Default Constraints',
            isDefault: true,
            constraints: {
                hard: {
                    maxClassesPerDayBatch: 6,
                    noConsecutiveLabsForBatch: true,
                    respectFacultyUnavailability: true,
                    respectRoomCapacity: true,
                    labsOnlyInLabRooms: true
                },
                soft: {
                    facultyLoadBalance: { enabled: true, weight: 5 },
                    avoidConsecutiveForFaculty: { enabled: true, maxConsecutive: 2, weight: 5 },
                    studentDailyLoadLimit: { enabled: true, maxClasses: 5, weight: 7 },
                    evenDistribution: { enabled: true, weight: 4 },
                    minimizeIdleGaps: { enabled: true, weight: 5 }
                }
            }
        });
        console.log('✓ Seeded default constraints');

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📋 Summary:');
        console.log(`   - ${departments.length} departments`);
        console.log(`   - 1 admin user`);
        console.log(`   - ${rooms.length} rooms`);
        console.log(`   - ${subjects.length} subjects`);
        console.log(`   - ${faculties.length} faculties`);
        console.log(`   - 1 batch`);
        console.log(`   - 1 time slot configuration`);
        console.log(`   - 1 constraint configuration`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
};

// Run if called directly
if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;
