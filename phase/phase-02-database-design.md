# 📋 PHASE 2: Database Design & MongoDB Setup

> **Duration:** 2-3 days  
> **Dependencies:** Phase 1  
> **Priority:** Critical - Required for all backend development

---

## 🎯 Phase Objectives

Design and implement the complete database architecture using MongoDB. This includes schema design, relationships, indexing strategies, and creating all Mongoose models.

---

## 📑 Task Breakdown

---

### 2.1 MongoDB Atlas Account & Cluster Setup

**Goal:** Set up a production-ready MongoDB cluster.

**Step-by-Step Instructions:**

1. **Create MongoDB Atlas Account:**
   - Navigate to https://www.mongodb.com/cloud/atlas
   - Click "Try Free" and sign up with email or Google
   - Verify your email address

2. **Create a New Project:**
   - In the Atlas dashboard, click "New Project"
   - Name it: `SmartTimetableScheduler`
   - Add any team members if needed

3. **Create a Cluster:**
   - Click "Build a Database"
   - Select **FREE** tier (M0 Sandbox)
   - Choose cloud provider: AWS (recommended)
   - Select region closest to your users (e.g., Mumbai for India)
   - Cluster name: `timetable-cluster`
   - Click "Create"

4. **Configure Database Access (Users):**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Authentication Method: Password
   - Username: `timetable_admin`
   - Password: Generate a secure password (save this!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

5. **Configure Network Access:**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - For development: Add your current IP
   - For production: Add `0.0.0.0/0` (allows all - secure with strong passwords)
   - Click "Confirm"

6. **Get Connection String:**
   - Go to "Database" → Click "Connect" on your cluster
   - Choose "Connect your application"
   - Driver: Node.js, Version: 5.5 or later
   - Copy the connection string:
     ```
     mongodb+srv://timetable_admin:<password>@timetable-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password
   - Add database name: `timetable_dev`

7. **Update Backend `.env`:**
   ```env
   MONGODB_URI=mongodb+srv://timetable_admin:YOUR_PASSWORD@timetable-cluster.xxxxx.mongodb.net/timetable_dev?retryWrites=true&w=majority
   ```

8. **Test Connection:**
   ```javascript
   // Quick test in Node.js
   const mongoose = require('mongoose');
   mongoose.connect(process.env.MONGODB_URI)
     .then(() => console.log('Connected!'))
     .catch(err => console.error(err));
   ```

---

### 2.2 Database Architecture Planning

**Goal:** Design the overall database architecture.

**Step-by-Step Instructions:**

1. **Identify All Entities:**
   List every entity in your system:
   - Users (authentication)
   - Departments
   - Faculties
   - Rooms
   - Subjects
   - Batches
   - Time Slots
   - Constraints
   - Fixed Slots
   - Solver Jobs
   - Timetables
   - Audit Logs
   - Notifications

2. **Determine Relationships:**
   Create a relationship map:
   ```
   Department ─┬─ has many ─► Faculties
               ├─ has many ─► Subjects
               ├─ has many ─► Batches
               └─ has one ──► HOD (User)
   
   Faculty ────┬─ belongs to ─► Department
               └─ teaches ────► Subjects (many-to-many)
   
   Batch ──────┬─ belongs to ─► Department
               └─ has ────────► Subjects (with classes_per_week)
   
   Subject ────┬─ belongs to ─► Department
               └─ taught by ──► Faculties (many-to-many)
   
   Timetable ─┬─ has many ───► Events
              └─ belongs to ─► Department
   
   Event ─────┬─ references ─► Batch
              ├─ references ─► Subject
              ├─ references ─► Faculty
              └─ references ─► Room
   ```

3. **Choose Embedding vs Referencing:**

   | Data Relationship | Strategy | Reason |
   |-------------------|----------|--------|
   | Events in Timetable | **Embed** | Always accessed together |
   | Batch subjects | **Embed** | Part of batch definition |
   | Faculty in Department | **Reference** | Queried separately |
   | Subject in Batch | **Reference** | Shared across batches |

4. **Document Your Decisions:**
   Create file: `docs/database-architecture.md`
   Include the relationship diagram and rationale.

---

### 2.3 Collection Schema Design (All Collections)

**Goal:** Design detailed schemas for all collections.

**Step-by-Step Instructions:**

For each collection, define:
- Field names and types
- Required fields
- Default values
- Validation rules
- Indexes needed

---

#### **COLLECTION 1: Users**

```javascript
// models/User.js
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false  // Never return password in queries
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  role: {
    type: String,
    enum: ['admin', 'hod', 'scheduler', 'viewer'],
    default: 'viewer'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: function() { return this.role === 'hod'; }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  refreshToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true  // Adds createdAt and updatedAt
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
```

---

#### **COLLECTION 2: Departments**

```javascript
// models/Department.js
const departmentSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 10
  },
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
    maxlength: 100
  },
  hod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  shifts: [{
    type: String,
    enum: ['morning', 'afternoon', 'evening']
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Indexes
departmentSchema.index({ code: 1 }, { unique: true });
departmentSchema.index({ isActive: 1 });
```

---

#### **COLLECTION 3: Faculties**

```javascript
// models/Faculty.js
const facultySchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  phone: {
    type: String,
    match: [/^\d{10}$/, 'Phone must be 10 digits']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  designation: {
    type: String,
    enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Guest Faculty'],
    default: 'Assistant Professor'
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  maxDailyClasses: {
    type: Number,
    min: 1,
    max: 8,
    default: 4
  },
  maxWeeklyClasses: {
    type: Number,
    min: 1,
    max: 30,
    default: 20
  },
  avgLeavesPerMonth: {
    type: Number,
    min: 0,
    max: 10,
    default: 1
  },
  unavailableSlots: [{
    day: {
      type: String,
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    },
    slot: Number
  }],
  preferences: {
    preferredSlots: [{
      day: String,
      slot: Number
    }],
    avoidConsecutive: {
      type: Boolean,
      default: false
    },
    preferMorning: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Indexes
facultySchema.index({ employeeId: 1 }, { unique: true });
facultySchema.index({ department: 1 });
facultySchema.index({ subjects: 1 });
facultySchema.index({ isActive: 1 });
```

---

#### **COLLECTION 4: Rooms**

```javascript
// models/Room.js
const roomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Room code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  building: {
    type: String,
    trim: true
  },
  floor: {
    type: Number,
    min: 0,
    max: 20
  },
  capacity: {
    type: Number,
    required: [true, 'Room capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: 500
  },
  type: {
    type: String,
    enum: ['lecture', 'lab', 'seminar', 'auditorium'],
    default: 'lecture'
  },
  facilities: [{
    type: String,
    enum: ['projector', 'ac', 'whiteboard', 'smartboard', 'computers', 'lab_equipment']
  }],
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
    // Optional: null means shared room
  },
  shifts: [{
    type: String,
    enum: ['morning', 'afternoon', 'evening']
  }],
  unavailableSlots: [{
    day: String,
    slot: Number,
    reason: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Indexes
roomSchema.index({ code: 1 }, { unique: true });
roomSchema.index({ type: 1, capacity: 1 });
roomSchema.index({ department: 1 });
roomSchema.index({ isActive: 1 });
```

---

#### **COLLECTION 5: Subjects**

```javascript
// models/Subject.js
const subjectSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },
  shortName: {
    type: String,
    trim: true,
    maxlength: 10
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  credits: {
    type: Number,
    min: 1,
    max: 6,
    default: 3
  },
  isLab: {
    type: Boolean,
    default: false
  },
  labHoursPerWeek: {
    type: Number,
    min: 0,
    default: 0
  },
  lectureHoursPerWeek: {
    type: Number,
    min: 0,
    default: 3
  },
  requiresSpecialRoom: {
    type: Boolean,
    default: false
  },
  roomType: {
    type: String,
    enum: ['lecture', 'lab', 'seminar']
  },
  isElective: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Indexes
subjectSchema.index({ code: 1 }, { unique: true });
subjectSchema.index({ department: 1, semester: 1 });
subjectSchema.index({ isLab: 1 });
```

---

#### **COLLECTION 6: Batches**

```javascript
// models/Batch.js
const batchSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Batch code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  academicYear: {
    type: String,  // e.g., "2024-25"
    required: true
  },
  size: {
    type: Number,
    required: true,
    min: 1,
    max: 200
  },
  shift: {
    type: String,
    enum: ['morning', 'afternoon', 'evening'],
    default: 'morning'
  },
  subjects: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    classesPerWeek: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    assignedFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Indexes
batchSchema.index({ code: 1 }, { unique: true });
batchSchema.index({ department: 1, semester: 1 });
batchSchema.index({ academicYear: 1 });
```

---

#### **COLLECTION 7: Time Slots**

```javascript
// models/TimeSlot.js
const timeSlotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
    // null = default for all departments
  },
  shift: {
    type: String,
    enum: ['morning', 'afternoon', 'evening'],
    required: true
  },
  slots: [{
    slotNumber: {
      type: Number,
      required: true
    },
    startTime: {
      type: String,  // "09:00"
      required: true,
      match: /^\d{2}:\d{2}$/
    },
    endTime: {
      type: String,  // "09:50"
      required: true,
      match: /^\d{2}:\d{2}$/
    },
    isBreak: {
      type: Boolean,
      default: false
    },
    breakName: String  // "Tea Break", "Lunch"
  }],
  days: [{
    type: String,
    enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Example slots configuration:
// Morning: 9:00-9:50, 9:50-10:40, 10:50-11:40, 11:40-12:30, 
//          1:30-2:20, 2:20-3:10
```

---

#### **COLLECTION 8: Constraints**

```javascript
// models/Constraint.js
const constraintSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  constraints: {
    hard: {
      maxClassesPerDayBatch: {
        type: Number,
        default: 6
      },
      noConsecutiveLabsForBatch: {
        type: Boolean,
        default: true
      },
      respectFacultyUnavailability: {
        type: Boolean,
        default: true
      },
      respectRoomCapacity: {
        type: Boolean,
        default: true
      },
      labsOnlyInLabRooms: {
        type: Boolean,
        default: true
      }
    },
    soft: {
      facultyLoadBalance: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, min: 1, max: 10, default: 5 }
      },
      avoidConsecutiveForFaculty: {
        enabled: { type: Boolean, default: true },
        maxConsecutive: { type: Number, default: 2 },
        weight: { type: Number, min: 1, max: 10, default: 5 }
      },
      studentDailyLoadLimit: {
        enabled: { type: Boolean, default: true },
        maxClasses: { type: Number, default: 5 },
        weight: { type: Number, min: 1, max: 10, default: 7 }
      },
      evenDistribution: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, min: 1, max: 10, default: 4 }
      },
      roomUtilization: {
        enabled: { type: Boolean, default: false },
        weight: { type: Number, min: 1, max: 10, default: 3 }
      },
      minimizeIdleGaps: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, min: 1, max: 10, default: 5 }
      },
      preferredSlotMatching: {
        enabled: { type: Boolean, default: false },
        weight: { type: Number, min: 1, max: 10, default: 2 }
      }
    }
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });
```

---

#### **COLLECTION 9: Fixed Slots**

```javascript
// models/FixedSlot.js
const fixedSlotSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  semester: Number,
  academicYear: String,
  fixedSlots: [{
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty'
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    },
    day: {
      type: String,
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      required: true
    },
    slot: {
      type: Number,
      required: true
    },
    reason: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });
```

---

#### **COLLECTION 10: Solver Jobs**

```javascript
// models/SolverJob.js
const solverJobSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  semester: Number,
  academicYear: String,
  status: {
    type: String,
    enum: ['pending', 'queued', 'running', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  inputData: {
    batches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
    faculties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' }],
    rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    constraints: { type: mongoose.Schema.Types.ObjectId, ref: 'Constraint' },
    fixedSlots: { type: mongoose.Schema.Types.ObjectId, ref: 'FixedSlot' },
    timeSlots: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot' }
  },
  config: {
    timeout: { type: Number, default: 300 },  // seconds
    maxSolutions: { type: Number, default: 5 },
    weights: {
      type: Map,
      of: Number
    }
  },
  results: [{
    score: Number,
    timetable: { type: mongoose.Schema.Types.ObjectId, ref: 'Timetable' },
    violations: {
      hard: Number,
      soft: Number,
      details: [String]
    }
  }],
  error: String,
  startedAt: Date,
  completedAt: Date
}, { timestamps: true });

// Indexes
solverJobSchema.index({ status: 1, createdAt: -1 });
solverJobSchema.index({ requestedBy: 1 });
solverJobSchema.index({ department: 1 });
```

---

#### **COLLECTION 11: Timetables**

```javascript
// models/Timetable.js
const timetableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  score: {
    type: Number,
    min: 0,
    max: 1
  },
  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'published', 'archived'],
    default: 'draft'
  },
  events: [{
    day: {
      type: String,
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      required: true
    },
    slot: {
      type: Number,
      required: true
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    duration: {
      type: Number,
      default: 1
    },
    isFixed: {
      type: Boolean,
      default: false
    }
  }],
  violations: {
    hard: { type: Number, default: 0 },
    soft: { type: Number, default: 0 },
    details: [{
      type: { type: String },
      description: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    }]
  },
  metadata: {
    generatedBy: {
      type: String,
      enum: ['solver', 'manual'],
      default: 'solver'
    },
    solverJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SolverJob'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    publishedAt: Date
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Indexes
timetableSchema.index({ department: 1, semester: 1, status: 1 });
timetableSchema.index({ 'events.batch': 1 });
timetableSchema.index({ 'events.faculty': 1 });
timetableSchema.index({ 'events.room': 1 });
timetableSchema.index({ academicYear: 1 });
```

---

#### **COLLECTION 12: Audit Logs**

```javascript
// models/AuditLog.js
const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'PUBLISH'],
    required: true
  },
  entity: {
    type: String,
    enum: ['user', 'faculty', 'room', 'subject', 'batch', 'timetable', 'constraint'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String
}, { 
  timestamps: { createdAt: true, updatedAt: false }
});

// Indexes
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

// Auto-delete after 90 days (optional)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
```

---

### 2.4 Relationships & References Strategy

**Already covered in 2.2 and 2.3**

---

### 2.5 Indexing Strategy for Performance

**Goal:** Create all necessary indexes.

**Step-by-Step Instructions:**

1. **Create an index script:**

```javascript
// scripts/createIndexes.js
const mongoose = require('mongoose');
require('dotenv').config();

const createIndexes = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const db = mongoose.connection.db;
  
  // Users
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ role: 1 });
  
  // Faculties
  await db.collection('faculties').createIndex({ employeeId: 1 }, { unique: true });
  await db.collection('faculties').createIndex({ department: 1 });
  
  // ... add all other indexes
  
  console.log('Indexes created successfully');
  process.exit(0);
};

createIndexes();
```

2. **Run the script:**
   ```bash
   node scripts/createIndexes.js
   ```

---

### 2.6 Data Validation Rules

**Already included in schema definitions above.**

---

### 2.7 Mongoose Models Creation

**Goal:** Create all model files.

**Step-by-Step Instructions:**

1. **Create models directory:**
   ```bash
   mkdir backend/src/models
   ```

2. **Create index file to export all models:**

```javascript
// models/index.js
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
```

3. **Create each model file with the schemas defined above.**

---

### 2.8 Seed Data Preparation

**Goal:** Create realistic test data.

**Step-by-Step Instructions:**

1. **Create seeds directory:**
   ```bash
   mkdir backend/src/seeds
   ```

2. **Create seed files:**

```javascript
// seeds/departments.seed.js
const departments = [
  { code: 'CSE', name: 'Computer Science and Engineering', shifts: ['morning'] },
  { code: 'ECE', name: 'Electronics and Communication Engineering', shifts: ['morning'] },
  { code: 'ME', name: 'Mechanical Engineering', shifts: ['morning', 'afternoon'] },
  { code: 'CE', name: 'Civil Engineering', shifts: ['morning'] },
  { code: 'EE', name: 'Electrical Engineering', shifts: ['afternoon'] }
];

module.exports = departments;
```

```javascript
// seeds/index.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { User, Department, Faculty, Room, Subject, Batch, TimeSlot, Constraint } = require('../models');

const seedDatabase = async () => {
  try {
    // Clear existing data
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
    const deptData = require('./departments.seed');
    const departments = await Department.insertMany(deptData);
    console.log(`Seeded ${departments.length} departments`);
    
    // Seed admin user
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    await User.create({
      email: 'admin@college.edu',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'admin'
    });
    console.log('Seeded admin user');
    
    // ... continue with other seeds
    
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Seeding error:', error);
  }
};

module.exports = seedDatabase;
```

3. **Add seed script to package.json:**
   ```json
   "scripts": {
     "seed": "node src/seeds/index.js"
   }
   ```

---

### 2.9 Database Connection Module

```javascript
// config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
    return conn;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

---

### 2.10 Backup & Recovery Strategy

**Goal:** Document and automate backups.

**Step-by-Step Instructions:**

1. **For MongoDB Atlas (Recommended):**
   - Backups are automatic on M10+ clusters
   - For M0 (free tier), use manual exports

2. **Manual Backup Script:**

```bash
#!/bin/bash
# scripts/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/$DATE"

mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR"

# Compress
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

echo "Backup created: $BACKUP_DIR.tar.gz"
```

3. **Restore Script:**

```bash
#!/bin/bash
# scripts/restore.sh

BACKUP_FILE=$1

tar -xzf "$BACKUP_FILE"
BACKUP_DIR="${BACKUP_FILE%.tar.gz}"

mongorestore --uri="$MONGODB_URI" "$BACKUP_DIR"

echo "Restore completed from: $BACKUP_FILE"
```

---

## ✅ Phase 2 Completion Checklist

```
□ MongoDB Atlas cluster created and running
□ Database user configured with proper permissions
□ Network access configured
□ Connection string saved in .env
□ All 12 collection schemas designed
□ Relationships documented
□ All indexes defined
□ Mongoose models created (12 files)
□ Seed data scripts created
□ Database connection module created
□ Backup scripts created
□ Connection tested successfully
□ All changes committed to Git
```

---

## ⏭️ Next Phase

Once all items are checked, proceed to **Phase 3: Authentication & Authorization System**
