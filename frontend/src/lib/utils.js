import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
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

// Status colors for dark glassmorphism theme
export function getStatusColor(status) {
    const colors = {
        draft: 'badge-draft',
        review: 'badge-review',
        approved: 'badge-approved',
        published: 'badge-published',
        archived: 'badge-archived',
        pending: 'badge-pending',
        running: 'badge-running',
        completed: 'badge-completed',
        failed: 'badge-failed'
    };
    return colors[status] || 'badge-draft';
}

// Color mappings for stat cards
export const statCardColors = {
    blue: {
        bg: 'bg-primary-500/20',
        text: 'text-primary-400',
        border: 'border-primary-500/30',
    },
    green: {
        bg: 'bg-green-500/20',
        text: 'text-green-400',
        border: 'border-green-500/30',
    },
    yellow: {
        bg: 'bg-yellow-500/20',
        text: 'text-yellow-400',
        border: 'border-yellow-500/30',
    },
    purple: {
        bg: 'bg-accent-purple/20',
        text: 'text-purple-400',
        border: 'border-purple-500/30',
    },
    pink: {
        bg: 'bg-pink-500/20',
        text: 'text-pink-400',
        border: 'border-pink-500/30',
    },
};
