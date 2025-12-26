const Department = require('../models/Department');
const { AppError, catchAsync } = require('../utils/appError');
const Response = require('../utils/responseFormatter');
const APIFeatures = require('../utils/apiFeatures');

exports.getAllDepartments = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Department.find({ isActive: true }), req.query)
        .filter()
        .search(['name', 'code'])
        .sort()
        .limitFields()
        .paginate();

    const departments = await features.query.populate('hod', 'name email');
    const total = await Department.countDocuments({ isActive: true, ...features.queryObj });

    Response.paginated(res, departments, {
        page: req.query.page * 1 || 1,
        limit: req.query.limit * 1 || 10,
        total
    });
});

exports.getDepartment = catchAsync(async (req, res, next) => {
    const department = await Department.findById(req.params.id)
        .populate('hod', 'name email');

    if (!department) {
        return next(new AppError('Department not found', 404));
    }

    Response.success(res, department);
});

exports.createDepartment = catchAsync(async (req, res, next) => {
    const department = await Department.create(req.body);
    Response.created(res, department);
});

exports.updateDepartment = catchAsync(async (req, res, next) => {
    const department = await Department.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!department) {
        return next(new AppError('Department not found', 404));
    }

    Response.success(res, department, 'Department updated successfully');
});

exports.deleteDepartment = catchAsync(async (req, res, next) => {
    const department = await Department.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
    );

    if (!department) {
        return next(new AppError('Department not found', 404));
    }

    Response.success(res, null, 'Department deleted successfully');
});
