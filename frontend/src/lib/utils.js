export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

export function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

export function formatTime(time) {
    return time;
}

export function getDayName(day) {
    const days = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' };
    return days[day] || day;
}

export function getStatusColor(status) {
    const colors = {
        draft: 'bg-gray-100 text-gray-800',
        review: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-blue-100 text-blue-800',
        published: 'bg-green-100 text-green-800',
        archived: 'bg-gray-100 text-gray-600',
        pending: 'bg-yellow-100 text-yellow-800',
        running: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}
