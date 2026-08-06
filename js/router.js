/**
 * SUMNOVA V2 PRODUCTION ROUTER
 * Version 2.1 (Commercial Enterprise Hash Router)
 * 
 * Architecture: Hash-based SPA Router for Single-index.html Application Shell
 * Responsibilities: Dynamic module loading, route guarding, lifecycle management,
 * state cleanup, accessibility focus management, and loading screen synchronization.
 */

import { isAuthenticated } from './auth.js';

// =========================================================
// STATE & CONFIGURATION
// =========================================================

const state = {
    initialized: false,
    currentRoute: null,
    currentCleanup: null,
    isNavigating: false,
    navSequence: 0
};

const DOM = {
    root: document.getElementById('app-root'),
    header: document.getElementById('shell-header-container'),
    footer: document.getElementById('shell-footer-container'),
    loader: document.getElementById('loading-screen')
};

// =========================================================
// ROUTE REGISTRY
// =========================================================

const routes = {
    '/': {
        type: 'public',
        module: './app.js',
        init: 'initializeLanding',
        meta: { title: 'SumNova | Learn Faster. Understand Better.' }
    },
    '/login': {
        type: 'guest',
        module: './auth.js',
        init: 'initializeLogin',
        meta: { title: 'Log In | SumNova' }
    },
    '/signup': {
        type: 'guest',
        module: './auth.js',
        init: 'initializeSignup',
        meta: { title: 'Create Account | SumNova' }
    },
    '/forgot-password': {
        type: 'guest',
        module: './auth.js',
        init: 'initializeForgotPassword',
        meta: { title: 'Reset Password | SumNova' }
    },
    '/verify-email': {
        type: 'guest',
        module: './auth.js',
        init: 'initializeVerifyEmail',
        meta: { title: 'Verify Email | SumNova' }
    },
    '/dashboard': {
        type: 'protected',
        module: './ui.js',
        init: 'initializeDashboard',
        meta: { title: 'Dashboard | SumNova' }
    },
    '/workspace': {
        type: 'protected',
        module: './ai.js',
        init: 'initializeWorkspace',
        meta: { title: 'AI Workspace | SumNova' }
    },
    '/history': {
        type: 'protected',
        module: './firestore.js',
        init: 'initializeHistory',
        meta: { title: 'Processing History | SumNova' }
    },
    '/saved': {
        type: 'protected',
        module: './firestore.js',
        init: 'initializeSaved',
        meta: { title: 'Saved Summaries | SumNova' }
    },
    '/profile': {
        type: 'protected',
        module: './settings.js',
        init: 'initializeProfile',
        meta: { title: 'User Profile | SumNova' }
    },
    '/settings': {
        type: 'protected',
        module: './settings.js',
        init: 'initializeSettings',
        meta: { title: 'Account Settings | SumNova' }
    },
    '/404': {
        type: 'public',
        module: './ui.js',
        init: 'initializeNotFound',
        meta: { title: 'Page Not Found | SumNova' }
    }
};

// =========================================================
// CORE NAVIGATION LOGIC
// =========================================================

/**
 * Navigates to a target hash route with full lifecycle handling, guards, and loop protection.
 * 
 * @param {string} rawHash - The target URL hash (e.g., '#/dashboard')
 * @param {boolean} [updateHistory=true] - Whether to update window.location.hash
 * @param {number} [redirectCount=0] - Internal recursion counter for redirect loops
 * @returns {Promise<void>}
 */
export async function navigate(rawHash, updateHistory = true, redirectCount = 0) {
    if (redirectCount > 5) {
        console.error('Critical Error: Maximum redirect depth exceeded in router.');
        hideLoader();
        return;
    }

    const navId = ++state.navSequence;

    // Normalize path from hash string
    let path = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
    if (!path || path === '') path = '/';
    if (path.endsWith('/') && path.length > 1) {
        path = path.slice(0, -1);
    }

    const routeConfig = routes[path] || routes['/404'];
    const targetPath = routes[path] ? path : '/404';

    try {
        state.isNavigating = true;
        showLoader();

        // 1. Authentication & Route Guard Evaluation
        let isAuth = false;
        try {
            isAuth = typeof isAuthenticated === 'function' ? await isAuthenticated() : false;
        } catch (authErr) {
            console.warn('Auth check failed or returned error:', authErr);
        }

        if (navId !== state.navSequence) return;

        if (routeConfig.type === 'protected' && !isAuth) {
            state.isNavigating = false;
            return navigate('#/login', true, redirectCount + 1);
        }
        if (routeConfig.type === 'guest' && isAuth) {
            state.isNavigating = false;
            return navigate('#/dashboard', true, redirectCount + 1);
        }

        // 2. Synchronize Hash History
        if (updateHistory && window.location.hash !== `#${targetPath}`) {
            window.location.hash = `#${targetPath}`;
        }

        // 3. Execute Previous Page Cleanup (Memory Leak Prevention)
        if (typeof state.currentCleanup === 'function') {
            try {
                state.currentCleanup();
            } catch (err) {
                console.error('Error during previous page cleanup:', err);
            }
            state.currentCleanup = null;
        }

        if (navId !== state.navSequence) return;

        // 4. Reset App Container View
        if (DOM.root) {
            DOM.root.innerHTML = '';
        }

        // 5. Lazy Load Module Controller & Execute Initializer
        if (routeConfig.module && routeConfig.init) {
            const module = await import(routeConfig.module);
            if (navId !== state.navSequence) return;

            if (typeof module[routeConfig.init] === 'function') {
                state.currentCleanup = await module[routeConfig.init]();
            }
        }

        if (navId !== state.navSequence) return;

        // 6. Update State, Metadata, and Scroll Position
        state.currentRoute = targetPath;
        updateMetadata(routeConfig.meta);
        window.scrollTo({ top: 0, behavior: 'auto' });
        manageAccessibilityFocus();

    } catch (error) {
        console.error('Navigation Execution Error:', error);
        if (targetPath !== '/404') {
            return navigate('#/404', true, redirectCount + 1);
        }
    } finally {
        if (navId === state.navSequence) {
            state.isNavigating = false;
            hideLoader();
        }
    }
}

// =========================================================
// UI HELPERS, ACCESSIBILITY & METADATA
// =========================================================

function showLoader() {
    if (DOM.loader) {
        DOM.loader.classList.remove('hidden');
        DOM.loader.setAttribute('aria-hidden', 'false');
    }
}

function hideLoader() {
    if (DOM.loader) {
        DOM.loader.classList.add('hidden');
        DOM.loader.setAttribute('aria-hidden', 'true');
    }
}

function updateMetadata(meta) {
    if (meta && meta.title) {
        document.title = meta.title;
    }
}

function manageAccessibilityFocus() {
    if (DOM.root) {
        DOM.root.setAttribute('tabindex', '-1');
        DOM.root.focus({ preventScroll: true });
        DOM.root.style.outline = 'none';
    }
}

// =========================================================
// API: ROUTE REGISTRATION
// =========================================================

/**
 * Dynamically registers or overrides a route configuration.
 * 
 * @param {string} path 
 * @param {Object} config 
 */
export function registerRoute(path, config) {
    routes[path] = config;
}

// =========================================================
// EVENT LISTENERS & INITIALIZATION
// =========================================================

/**
 * Event delegation handler for internal anchor hash links.
 * 
 * @param {MouseEvent} e 
 */
function handleLinkClick(e) {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    const target = link.getAttribute('target');

    if (!href || target === '_blank') return;

    if (href.startsWith('#/')) {
        e.preventDefault();
        navigate(href);
    }
}

/**
 * Initializes the router idempotently, binds event listeners once, and boots initial view.
 * 
 * @returns {void}
 */
export function initializeRouter() {
    if (state.initialized) {
        return;
    }
    state.initialized = true;

    // Listen to hash change events (Browser Back / Forward buttons)
    window.addEventListener('hashchange', () => {
        const currentHash = window.location.hash || '#/';
        navigate(currentHash, false);
    });

    // Event delegation for internal SPA navigation links
    document.body.addEventListener('click', handleLinkClick);

    // Initial boot navigation load
    const initialHash = window.location.hash || '#/';
    navigate(initialHash, false);
}

