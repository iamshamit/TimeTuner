const PERMISSIONS = {
    // User Management
    'users:read': ['admin'],
    'users:create': ['admin'],
    'users:update': ['admin'],
    'users:delete': ['admin'],

    // Department Management
    'departments:read': ['admin', 'hod', 'scheduler', 'viewer'],
    'departments:create': ['admin'],
    'departments:update': ['admin'],
    'departments:delete': ['admin'],

    // Faculty Management
    'faculties:read': ['admin', 'hod', 'scheduler', 'viewer'],
    'faculties:create': ['admin', 'hod'],
    'faculties:update': ['admin', 'hod'],
    'faculties:delete': ['admin'],

    // Room Management
    'rooms:read': ['admin', 'hod', 'scheduler', 'viewer'],
    'rooms:create': ['admin', 'scheduler'],
    'rooms:update': ['admin', 'scheduler'],
    'rooms:delete': ['admin'],

    // Subject Management
    'subjects:read': ['admin', 'hod', 'scheduler', 'viewer'],
    'subjects:create': ['admin', 'hod'],
    'subjects:update': ['admin', 'hod'],
    'subjects:delete': ['admin'],

    // Batch Management
    'batches:read': ['admin', 'hod', 'scheduler', 'viewer'],
    'batches:create': ['admin', 'hod', 'scheduler'],
    'batches:update': ['admin', 'hod', 'scheduler'],
    'batches:delete': ['admin', 'hod'],

    // Timetable Management
    'timetables:read': ['admin', 'hod', 'scheduler', 'viewer'],
    'timetables:create': ['admin', 'hod', 'scheduler'],
    'timetables:update': ['admin', 'hod', 'scheduler'],
    'timetables:delete': ['admin', 'hod'],
    'timetables:approve': ['admin', 'hod'],
    'timetables:publish': ['admin', 'hod'],

    // Solver
    'solver:run': ['admin', 'hod', 'scheduler'],
    'solver:cancel': ['admin', 'hod', 'scheduler']
};

const hasPermission = (role, permission) => {
    return PERMISSIONS[permission]?.includes(role) || false;
};

const getPermissionsForRole = (role) => {
    return Object.entries(PERMISSIONS)
        .filter(([, roles]) => roles.includes(role))
        .map(([permission]) => permission);
};

module.exports = { PERMISSIONS, hasPermission, getPermissionsForRole };
