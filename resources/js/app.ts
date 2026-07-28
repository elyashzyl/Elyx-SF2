import { createInertiaApp } from '@inertiajs/vue3';
import { initializeTheme } from '@/composables/useAppearance';
import AuthLayout from '@/layouts/AuthLayout.vue';
import TeacherLayout from '@/layouts/TeacherLayout.vue';
import StudentLayout from '@/layouts/StudentLayout.vue';
import { initializeFlashToast } from '@/lib/flashToast';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Restore scroll position on page load (works for browser refresh)
const scrollKey = 'scroll_pos_' + window.location.pathname;
const saved = sessionStorage.getItem(scrollKey);
if (saved) {
    setTimeout(() => window.scrollTo(0, parseInt(saved, 10)), 50);
}

// Save scroll position before page unload
window.addEventListener('beforeunload', () => {
    sessionStorage.setItem(scrollKey, String(window.scrollY));
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'Welcome':
                return null;
            case name.startsWith('Teacher/'):
                return TeacherLayout;
            case name.startsWith('Student/'):
                return StudentLayout;
            case name.startsWith('auth/'):
                return AuthLayout;
        }
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on page load...
initializeTheme();

// This will listen for flash toast data from the server...
initializeFlashToast();
