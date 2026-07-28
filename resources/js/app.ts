import { createInertiaApp, router } from '@inertiajs/vue3';
import { initializeTheme } from '@/composables/useAppearance';
import AuthLayout from '@/layouts/AuthLayout.vue';
import TeacherLayout from '@/layouts/TeacherLayout.vue';
import StudentLayout from '@/layouts/StudentLayout.vue';
import { initializeFlashToast } from '@/lib/flashToast';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Save scroll position per pathname
function saveScroll() {
    sessionStorage.setItem('scroll_pos_' + window.location.pathname, String(window.scrollY));
}

// Restore scroll position for current pathname
function restoreScroll() {
    const saved = sessionStorage.getItem('scroll_pos_' + window.location.pathname);
    if (saved) {
        setTimeout(() => window.scrollTo(0, parseInt(saved, 10)), 50);
    }
}

// Save scroll before any Inertia navigation
router.on('start', () => saveScroll());

// Restore scroll when Inertia finishes navigation
router.on('finish', () => restoreScroll());

// Also save on page unload (browser refresh)
window.addEventListener('beforeunload', saveScroll);

// Restore on initial page load
restoreScroll();

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
