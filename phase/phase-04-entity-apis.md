# 📋 PHASE 4: Core Backend - Entity Management APIs

> **Duration:** 4-5 days  
> **Dependencies:** Phase 3  
> **Priority:** High - Core functionality

---

## 🎯 Phase Objectives

Build all CRUD APIs for managing entities (Departments, Faculties, Rooms, Subjects, Batches, etc.) with proper validation, error handling, and response formatting.

---

## 📑 Task Breakdown

---

### 4.1 API Architecture & Standards Definition

**Goal:** Establish consistent API design patterns.

**RESTful API Standards:**

| HTTP Method | Endpoint Pattern | Purpose |
|-------------|------------------|---------|
| GET | `/api/v1/resource` | List all resources |
| GET | `/api/v1/resource/:id` | Get single resource |
| POST | `/api/v1/resource` | Create resource |
| PUT | `/api/v1/resource/:id` | Update resource (full) |
| PATCH | `/api/v1/resource/:id` | Update resource (partial) |
| DELETE | `/api/v1/resource/:id` | Delete resource |

**API Structure:**

```
backend/src/
├── routes/
│   ├── index.js           # Route aggregator
│   ├── auth.js
│   ├── departments.js
│   ├── faculties.js
│   ├── rooms.js
│   ├── subjects.js
│   ├── batches.js
│   ├── timeslots.js
│   ├── constraints.js
│   └── timetables.js
├── controllers/
│   ├── authController.js
│   ├── departmentController.js
│   ├── facultyController.js
│   └── ... (one per entity)
├── services/
│   └── ... (business logic)
└── validators/
    └── ... (request validation)
```

---

### 4.2 Error Handling Framework

**Goal:** Create centralized error handling.

```javascript
// utils/appError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error creators
AppError.badRequest = (message) => new AppError(message, 400);
AppError.unauthorized = (message) => new AppError(message, 401);
AppError.forbidden = (message) => new AppError(message, 403);
AppError.notFound = (message) => new AppError(message, 404);
AppError.conflict = (message) => new AppError(message, 409);
AppError.validation = (message) => new AppError(message, 422);

module.exports = { AppError };
```

```javascript
// middleware/errorHandler.js
const { AppError } = require('../utils/appError');

const handleCastErrorDB = (err) => {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`Duplicate value for field: ${field}`, 409);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(e => e.message);
  return new AppError(`Validation failed: ${errors.join('. ')}`, 400);
};

const handleJWTError = () => new AppError('Invalid token', 401);
const handleJWTExpiredError = () => new AppError('Token expired', 401);

// Development error response
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Production error response
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  } else {
    console.error('ERROR 💥', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err, message: err.message };
    
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    
    sendErrorProd(error, res);
  }
};
```

---

### 4.3 Response Formatting Standards

**Goal:** Consistent API response format.

```javascript
// utils/responseFormatter.js
class ResponseFormatter {
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }
  
  static created(res, data, message = 'Created successfully') {
    return this.success(res, data, message, 201);
  }
  
  static paginated(res, data, pagination) {
    return res.status(200).json({
      success: true,
      message: 'Success',
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        pages: Math.ceil(pagination.total / pagination.limit),
        hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
        hasPrev: pagination.page > 1
      }
    });
  }
  
  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ResponseFormatter;
```

---

### 4.4 Validation Layer (Joi)

**Goal:** Validate all incoming requests.

```bash
npm install joi
```

```javascript
// validators/departmentValidator.js
const Joi = require('joi');

const departmentSchema = {
  create: Joi.object({
    code: Joi.string().required().uppercase().max(10)
      .messages({
        'string.empty': 'Department code is required',
        'string.max': 'Code cannot exceed 10 characters'
      }),
    name: Joi.string().required().max(100),
    hod: Joi.string().hex().length(24),  // ObjectId
    shifts: Joi.array().items(
      Joi.string().valid('morning', 'afternoon', 'evening')
    ).default(['morning'])
  }),
  
  update: Joi.object({
    code: Joi.string().uppercase().max(10),
    name: Joi.string().max(100),
    hod: Joi.string().hex().length(24),
    shifts: Joi.array().items(
      Joi.string().valid('morning', 'afternoon', 'evening')
    ),
    isActive: Joi.boolean()
  })
};

module.exports = departmentSchema;
```

```javascript
// middleware/validate.js
const { AppError } = require('../utils/appError');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errorMessages = error.details.map(d => d.message).join('. ');
      return next(new AppError(errorMessages, 400));
    }
    
    req.body = value; // Use validated/sanitized values
    next();
  };
};

module.exports = validate;
```

---

### 4.5 Department CRUD APIs

**Goal:** Complete Department management.

```javascript
// controllers/departmentController.js
const Department = require('../models/Department');
const { AppError } = require('../utils/appError');
const Response = require('../utils/responseFormatter');
const APIFeatures = require('../utils/apiFeatures');

exports.getAllDepartments = async (req, res, next) => {
  try {
    // Build query with filtering, sorting, pagination
    const features = new APIFeatures(Department.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    
    const departments = await features.query.populate('hod', 'name email');
    const total = await Department.countDocuments(features.queryObj);
    
    Response.paginated(res, departments, {
      page: req.query.page * 1 || 1,
      limit: req.query.limit * 1 || 10,
      total
    });
  } catch (error) {
    next(error);
  }
};

exports.getDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('hod', 'name email');
    
    if (!department) {
      return next(new AppError('Department not found', 404));
    }
    
    Response.success(res, department);
  } catch (error) {
    next(error);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const department = await Department.create(req.body);
    Response.created(res, department);
  } catch (error) {
    next(error);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!department) {
      return next(new AppError('Department not found', 404));
    }
    
    Response.success(res, department, 'Department updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    // Soft delete by setting isActive to false
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!department) {
      return next(new AppError('Department not found', 404));
    }
    
    Response.success(res, null, 'Department deleted successfully');
  } catch (error) {
    next(error);
  }
};
```

```javascript
// routes/departments.js
const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { protect, checkPermission } = require('../middleware/auth');
const validate = require('../middleware/validate');
const departmentSchema = require('../validators/departmentValidator');

router.use(protect); // All routes require authentication

router.route('/')
  .get(
    checkPermission('departments:read'),
    departmentController.getAllDepartments
  )
  .post(
    checkPermission('departments:create'),
    validate(departmentSchema.create),
    departmentController.createDepartment
  );

router.route('/:id')
  .get(
    checkPermission('departments:read'),
    departmentController.getDepartment
  )
  .patch(
    checkPermission('departments:update'),
    validate(departmentSchema.update),
    departmentController.updateDepartment
  )
  .delete(
    checkPermission('departments:delete'),
    departmentController.deleteDepartment
  );

module.exports = router;
```

---

### 4.6 Faculty CRUD APIs

**Goal:** Complete Faculty management with subject assignment.

```javascript
// controllers/facultyController.js
const Faculty = require('../models/Faculty');
const { AppError } = require('../utils/appError');
const Response = require('../utils/responseFormatter');
const APIFeatures = require('../utils/apiFeatures');

exports.getAllFaculties = async (req, res, next) => {
  try {
    // Filter by department for HOD
    let filter = {};
    if (req.user.role === 'hod') {
      filter.department = req.user.department;
    }
    
    const features = new APIFeatures(Faculty.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    
    const faculties = await features.query
      .populate('department', 'code name')
      .populate('subjects', 'code name');
    
    const total = await Faculty.countDocuments({ ...features.queryObj, ...filter });
    
    Response.paginated(res, faculties, {
      page: req.query.page * 1 || 1,
      limit: req.query.limit * 1 || 10,
      total
    });
  } catch (error) {
    next(error);
  }
};

exports.getFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('department', 'code name')
      .populate('subjects', 'code name shortName');
    
    if (!faculty) {
      return next(new AppError('Faculty not found', 404));
    }
    
    Response.success(res, faculty);
  } catch (error) {
    next(error);
  }
};

exports.createFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.create(req.body);
    
    const populated = await Faculty.findById(faculty._id)
      .populate('department', 'code name')
      .populate('subjects', 'code name');
    
    Response.created(res, populated);
  } catch (error) {
    next(error);
  }
};

exports.updateFaculty = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

exports.deleteFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!faculty) {
      return next(new AppError('Faculty not found', 404));
    }
    
    Response.success(res, null, 'Faculty deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Assign subjects to faculty
exports.assignSubjects = async (req, res, next) => {
  try {
    const { subjects } = req.body; // Array of subject IDs
    
    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { subjects: { $each: subjects } } },
      { new: true }
    ).populate('subjects', 'code name');
    
    if (!faculty) {
      return next(new AppError('Faculty not found', 404));
    }
    
    Response.success(res, faculty, 'Subjects assigned successfully');
  } catch (error) {
    next(error);
  }
};
```

---

### 4.7-4.12 Remaining Entity APIs

Follow the same pattern for:
- **Rooms** (`/api/v1/rooms`)
- **Subjects** (`/api/v1/subjects`)
- **Batches** (`/api/v1/batches`)
- **Time Slots** (`/api/v1/timeslots`)
- **Constraints** (`/api/v1/constraints`)
- **Fixed Slots** (`/api/v1/fixed-slots`)

Each should include: GET all, GET one, POST, PATCH, DELETE

---

### 4.13 Bulk Import/Export APIs

**Goal:** Allow CSV import and export.

```bash
npm install multer csv-parse csv-stringify xlsx
```

```javascript
// controllers/importController.js
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const Faculty = require('../models/Faculty');
const Room = require('../models/Room');
const Response = require('../utils/responseFormatter');
const { AppError } = require('../utils/appError');

// Multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new AppError('Only CSV files are allowed', 400), false);
    }
  }
});

exports.uploadCSV = upload.single('file');

exports.importFaculties = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload a CSV file', 400));
    }
    
    // Parse CSV
    const records = parse(req.file.buffer.toString(), {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    const results = {
      success: [],
      failed: []
    };
    
    for (const record of records) {
      try {
        const faculty = await Faculty.create({
          employeeId: record.employeeId,
          name: record.name,
          email: record.email,
          department: record.departmentId,
          designation: record.designation || 'Assistant Professor',
          maxDailyClasses: parseInt(record.maxDailyClasses) || 4
        });
        results.success.push(faculty.employeeId);
      } catch (error) {
        results.failed.push({
          employeeId: record.employeeId,
          error: error.message
        });
      }
    }
    
    Response.success(res, results, 
      `Import complete: ${results.success.length} success, ${results.failed.length} failed`
    );
  } catch (error) {
    next(error);
  }
};

exports.exportFaculties = async (req, res, next) => {
  try {
    const faculties = await Faculty.find({ isActive: true })
      .populate('department', 'code')
      .lean();
    
    const XLSX = require('xlsx');
    
    const data = faculties.map(f => ({
      'Employee ID': f.employeeId,
      'Name': f.name,
      'Email': f.email,
      'Department': f.department?.code,
      'Designation': f.designation,
      'Max Daily Classes': f.maxDailyClasses
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Faculties');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename=faculties.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
```

---

### 4.14 Search & Filter Implementation

**Goal:** Implement advanced filtering.

```javascript
// utils/apiFeatures.js
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.queryObj = {};
  }
  
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach(el => delete queryObj[el]);
    
    // Advanced filtering: gte, gt, lte, lt
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    
    this.queryObj = JSON.parse(queryStr);
    this.query = this.query.find(this.queryObj);
    
    return this;
  }
  
  search() {
    if (this.queryString.search) {
      const searchRegex = new RegExp(this.queryString.search, 'i');
      this.query = this.query.find({
        $or: [
          { name: searchRegex },
          { code: searchRegex },
          { email: searchRegex }
        ]
      });
    }
    return this;
  }
  
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }
  
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }
  
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = Math.min(this.queryString.limit * 1 || 10, 100);
    const skip = (page - 1) * limit;
    
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
```

**Example Usage:**
```
GET /api/v1/faculties?department=xxx&sort=-name&page=1&limit=20&search=sharma
```

---

### 4.15 Pagination Implementation

**Already included in APIFeatures class above.**

---

## ✅ Phase 4 Completion Checklist

```
□ API architecture documented
□ Error handling framework created
□ Response formatting standardized
□ Validation layer (Joi) implemented
□ Department CRUD APIs complete
□ Faculty CRUD APIs complete
□ Room CRUD APIs complete
□ Subject CRUD APIs complete
□ Batch CRUD APIs complete
□ Time Slot APIs complete
□ Constraint APIs complete
□ Fixed Slot APIs complete
□ Bulk import/export working
□ Search & filter implementation
□ Pagination working
□ All routes tested with Postman
□ API documentation updated
□ Changes committed to Git
```

---

## ⏭️ Next Phase

Proceed to **Phase 5: Python Solver Engine - Foundation**
