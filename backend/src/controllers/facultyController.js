const Faculty = require('../models/Faculty');
const { AppError, catchAsync } = require('../utils/appError');
const Response = require('../utils/responseFormatter');
const APIFeatures = require('../utils/apiFeatures');

exports.getAllFaculties = catchAsync(async (req, res, next) => {
    // Filter by department for HOD
    let filter = { isActive: true };
    if (req.user.role === 'hod' && req.user.department) {
        filter.department = req.user.department;
    }

    const features = new APIFeatures(Faculty.find(filter), req.query)
        .filter()
        .search(['name', 'employeeId', 'email'])
        .sort()
        .limitFields()
        .paginate();

    const faculties = await features.query
        .populate('department', 'code name')
        .populate('subjects', 'code name');

    const total = await Faculty.countDocuments({ ...filter, ...features.queryObj });

    Response.paginated(res, faculties, {
        page: req.query.page * 1 || 1,
        limit: req.query.limit * 1 || 10,
        total
    });
});

exports.getFaculty = catchAsync(async (req, res, next) => {
    const faculty = await Faculty.findById(req.params.id)
        .populate('department', 'code name')
        .populate('subjects', 'code name shortName');

    if (!faculty) {
        return next(new AppError('Faculty not found', 404));
    }

    Response.success(res, faculty);
});

exports.createFaculty = catchAsync(async (req, res, next) => {
    const faculty = await Faculty.create(req.body);

    const populated = await Faculty.findById(faculty._id)
        .populate('department', 'code name')
        .populate('subjects', 'code name');

    Response.created(res, populated);
});

exports.updateFaculty = catchAsync(async (req, res, next) => {
    const faculty = await Faculty.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    )
        .populate('department', 'code name')
        .populate('subjects', 'code name');

    if (!faculty) {
        return next(new AppError('Faculty not found', 404));
    }

    Response.success(res, faculty, 'Faculty updated successfully');
});

exports.deleteFaculty = catchAsync(async (req, res, next) => {
    const faculty = await Faculty.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
    );

    if (!faculty) {
        return next(new AppError('Faculty not found', 404));
    }

    Response.success(res, null, 'Faculty deleted successfully');
});

exports.assignSubjects = catchAsync(async (req, res, next) => {
    const { subjects } = req.body;

    const faculty = await Faculty.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { subjects: { $each: subjects } } },
        { new: true }
    ).populate('subjects', 'code name');

    if (!faculty) {
        return next(new AppError('Faculty not found', 404));
    }

    Response.success(res, faculty, 'Subjects assigned successfully');
});
