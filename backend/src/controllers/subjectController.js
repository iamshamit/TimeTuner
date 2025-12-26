const Subject = require('../models/Subject');
const { AppError, catchAsync } = require('../utils/appError');
const Response = require('../utils/responseFormatter');
const APIFeatures = require('../utils/apiFeatures');

exports.getAllSubjects = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Subject.find({ isActive: true }), req.query)
        .filter()
        .search(['name', 'code', 'shortName'])
        .sort()
        .limitFields()
        .paginate();

    const subjects = await features.query.populate('department', 'code name');
    const total = await Subject.countDocuments({ isActive: true, ...features.queryObj });

    Response.paginated(res, subjects, {
        page: req.query.page * 1 || 1,
        limit: req.query.limit * 1 || 10,
        total
    });
});

exports.getSubject = catchAsync(async (req, res, next) => {
    const subject = await Subject.findById(req.params.id)
        .populate('department', 'code name');

    if (!subject) {
        return next(new AppError('Subject not found', 404));
    }

    Response.success(res, subject);
});

exports.createSubject = catchAsync(async (req, res, next) => {
    const subject = await Subject.create(req.body);
    const populated = await Subject.findById(subject._id).populate('department', 'code name');
    Response.created(res, populated);
});

exports.updateSubject = catchAsync(async (req, res, next) => {
    const subject = await Subject.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    ).populate('department', 'code name');

    if (!subject) {
        return next(new AppError('Subject not found', 404));
    }

    Response.success(res, subject, 'Subject updated successfully');
});

exports.deleteSubject = catchAsync(async (req, res, next) => {
    const subject = await Subject.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
    );

    if (!subject) {
        return next(new AppError('Subject not found', 404));
    }

    Response.success(res, null, 'Subject deleted successfully');
});

// Get subjects by department and semester
exports.getSubjectsBySemester = catchAsync(async (req, res, next) => {
    const { department, semester } = req.params;

    const subjects = await Subject.find({
        department,
        semester: parseInt(semester),
        isActive: true
    }).populate('department', 'code name');

    Response.success(res, subjects);
});
