/**
 * SUMNOVA V2 PRODUCTION NAVIGATION & APP SHELL CONTROLLER
 * Enterprise SaaS Header, Footer, and Navigation Manager
 * 
 * Responsibilities: Dynamic rendering of shell header and footer into existing
 * containers (#shell-header-container, #shell-footer-container), responsive mobile
 * drawer handling, authentication-aware link visibility, active route highlighting,
 * and memory-safe lifecycle management via AbortController.
 */

import { navigate } from './router.js';
import { isAuthenticated, logout } from './auth.js';

// =========================================================
// STATE & CONFIGURATION
// =========================================================

const state = {
    initialized: false,
    abortController: null,
    mobileMenuOpen: false
};

// =========================================================
// CORE INITIALIZATION & DESTRUCTION
// =========================================================

/**
 * Initializes the navigation system, builds header and footer, binds all event
 * listeners safely with AbortController, and sets up authentication observation.
 * 
 * @returns {Promise<void>}
 */
export async function initializeNavigation() {
    if (state.initialized) {
        return;
    }

    try {
        state.abortController = new AbortController();
        const { signal } = state.abortController;

        // 1. Render Header and Footer into existing shell containers
        await renderHeader();
        await renderFooter();

        // 2. Bind Global Event Listeners via Delegation & Signal
        const headerContainer = document.getElementById('shell-header-container');
        if (headerContainer) {
            headerContainer.addEventListener('click', handleHeaderClick, { signal });
        }

        // 3. Listen to window hash changes or navigation events to update active states
        window.addEventListener('hashchange', updateActiveLinks, { signal });

        // 4. Keyboard Escape key support for mobile drawer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && state.mobileMenuOpen) {
                closeMobileMenu();
            }
        }, { signal });

        // 5. Initial active link sync
        updateActiveLinks();

        state.initialized = true;
    } catch (error) {
        console.error('Error initializing navigation:', error);
    }
}

/**
 * Destroys the navigation system, aborts all event listeners, and clears shell containers
 * to prevent memory leaks.
 * 
 * @returns {void}
 */
export function destroyNavigation() {
    if (!state.initialized) return;

    if (state.abortController) {
        state.abortController.abort();
        state.abortController = null;
    }

    const header = document.getElementById('shell-header-container');
    const footer = document.getElementById('shell-footer-container');

    if (header) header.innerHTML = '';
    if (footer) footer.innerHTML = '';

    state.initialized = false;
    state.mobileMenuOpen = false;
}

// =========================================================
// HEADER RENDERER & AUTH STATE AWARENESS
// =========================================================

async function renderHeader() {
    const container = document.getElementById('shell-header-container');
    if (!container) return;

    let isAuth = false;
    try {
        isAuth = typeof isAuthenticated === 'function' ? await isAuthenticated() : false;
    } catch (e) {
        isAuth = false;
    }

    container.innerHTML = '';

    const nav = document.createElement('nav');
    nav.className = 'shell-nav-bar';
    nav.setAttribute('aria-label', 'Main Navigation');

    // Brand / Logo Section
    const brand = document.createElement('a');
    brand.className = 'nav-brand focusable';
    brand.setAttribute('href', isAuth ? '#/dashboard' : '#/');
    brand.setAttribute('aria-label', 'SumNova Home');

    const logoText = document.createElement('span');
    logoText.className = 'brand-text';
    logoText.textContent = 'SumNova';

    const versionBadge = document.createElement('span');
    versionBadge.className = 'brand-version';
    versionBadge.textContent = 'V2';

    brand.appendChild(logoText);
    brand.appendChild(versionBadge);

    // Desktop Links Container
    const linksContainer = document.createElement('div');
    linksContainer.className = 'nav-links-desktop';

    // Define navigation items based on auth state
    const links = isAuth ? [
        { href: '#/dashboard', label: 'Dashboard' },
        { href: '#/workspace', label: 'Workspace' },
        { href: '#/history', label: 'History' },
        { href: '#/saved', label: 'Saved' },
        { href: '#/profile', label: 'Profile' },
        { href: '#/settings', label: 'Settings' }
    ] : [
        { href: '#/', label: 'Home' },
        { href: '#/login', label: 'Login' },
        { href: '#/signup', label: 'Sign Up', isPrimary: true }
    ];

    links.forEach(item => {
        const link = document.createElement('a');
        link.className = `nav-link focusable ${item.isPrimary ? 'btn btn-primary' : ''}`;
        link.setAttribute('href', item.href);
        link.textContent = item.label;
        linksContainer.appendChild(link);
    });

    if (isAuth) {
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'nav-link btn btn-secondary focusable';
        logoutBtn.id = 'nav-logout-btn';
        logoutBtn.textContent = 'Log Out';
        logoutBtn.type = 'button';
        linksContainer.appendChild(logoutBtn);
    }

    // Hamburger Toggle for Mobile
    const hamburger = document.createElement('button');
    hamburger.className = 'nav-hamburger focusable';
    hamburger.id = 'nav-hamburger-btn';
    hamburger.setAttribute('aria-label', 'Toggle navigation menu');
    hamburger.setAttribute('aria-expanded', 'false');
    
    for (let i = 0; i < 3; i++) {
        const bar = document.createElement('span');
        bar.className = 'hamburger-bar';
        hamburger.appendChild(bar);
    }

    nav.appendChild(brand);
    nav.appendChild(linksContainer);
    nav.appendChild(hamburger);
    container.appendChild(nav);

    // Mobile Drawer Menu
    renderMobileDrawer(isAuth);
}

function renderMobileDrawer(isAuth) {
    let drawer = document.getElementById('shell-mobile-drawer');
    if (!drawer) {
        drawer = document.createElement('div');
        drawer.id = 'shell-mobile-drawer';
        drawer.className = 'mobile-drawer hidden';
        drawer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(drawer);
    }

    drawer.innerHTML = '';

    const drawerContent = document.createElement('div');
    drawerContent.className = 'mobile-drawer-content';

    const links = isAuth ? [
        { href: '#/dashboard', label: 'Dashboard' },
        { href: '#/workspace', label: 'Workspace' },
        { href: '#/history', label: 'History' },
        { href: '#/saved', label: 'Saved' },
        { href: '#/profile', label: 'Profile' },
        { href: '#/settings', label: 'Settings' }
    ] : [
        { href: '#/', label: 'Home' },
        { href: '#/login', label: 'Login' },
        { href: '#/signup', label: 'Sign Up', isPrimary: true }
    ];

    links.forEach(item => {
        const link = document.createElement('a');
        link.className = `mobile-nav-link focusable ${item.isPrimary ? 'btn btn-primary' : ''}`;
        link.setAttribute('href', item.href);
        link.textContent = item.label;
        drawerContent.appendChild(link);
    });

    if (isAuth) {
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'mobile-nav-link btn btn-secondary focusable';
        logoutBtn.id = 'mobile-logout-btn';
        logoutBtn.textContent = 'Log Out';
        logoutBtn.type = 'button';
        drawerContent.appendChild(logoutBtn);
    }

    drawer.appendChild(drawerContent);
}

// =========================================================
// FOOTER RENDERER
// =========================================================

async function renderFooter() {
    const container = document.getElementById('shell-footer-container');
    if (!container) return;

    container.innerHTML = '';

    const footer = document.createElement('footer');
    footer.className = 'shell-footer';

    const inner = document.createElement('div');
    inner.className = 'footer-inner';

    const currentYear = new Date().getFullYear();

    const copyright = document.createElement('div');
    copyright.className = 'footer-copyright';
    copyright.textContent = `© ${currentYear} SumNova. Powered by Davonium Technologies.`;

    const linksDiv = document.createElement('div');
    linksDiv.className = 'footer-links';

    const footerLinks = [
        { href: '#/', label: 'Company' },
        { href: '#/', label: 'Privacy' },
        { href: '#/', label: 'Terms' },
        { href: '#/', label: 'Support' },
        { href: '#/', label: 'Contact' }
    ];

    footerLinks.forEach(item => {
        const a = document.createElement('a');
        a.className = 'footer-link focusable';
        a.setAttribute('href', item.href);
        a.textContent = item.label;
        linksDiv.appendChild(a);
    });

    inner.appendChild(copyright);
    inner.appendChild(linksDiv);
    footer.appendChild(inner);
    container.appendChild(footer);
}

// =========================================================
// EVENT HANDLING & INTERACTION
// =========================================================

async function handleHeaderClick(e) {
    const target = e.target;

    // Handle Hamburger Click
    if (target.closest('#nav-hamburger-btn')) {
        e.preventDefault();
        toggleMobileMenu();
        return;
    }

    // Handle Logout Click
    if (target.closest('#nav-logout-btn') || target.closest('#mobile-logout-btn')) {
        e.preventDefault();
        if (typeof logout === 'function') {
            await logout();
        }
        navigate('#/login');
        await refreshNavigationAuth();
        return;
    }

    // Handle Link Navigation
    const link = target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (href && href.startsWith('#/')) {
        e.preventDefault();
        closeMobileMenu();
        navigate(href);
    }
}

function toggleMobileMenu() {
    state.mobileMenuOpen = !state.mobileMenuOpen;
    const drawer = document.getElementById('shell-mobile-drawer');
    const hamburger = document.getElementById('nav-hamburger-btn');

    if (drawer && hamburger) {
        if (state.mobileMenuOpen) {
            drawer.classList.remove('hidden');
            drawer.setAttribute('aria-hidden', 'false');
            hamburger.setAttribute('aria-expanded', 'true');
        } else {
            drawer.classList.add('hidden');
            drawer.setAttribute('aria-hidden', 'true');
            hamburger.setAttribute('aria-expanded', 'false');
        }
    }
}

function closeMobileMenu() {
    if (!state.mobileMenuOpen) return;
    state.mobileMenuOpen = false;
    const drawer = document.getElementById('shell-mobile-drawer');
    const hamburger = document.getElementById('nav-hamburger-btn');

    if (drawer && hamburger) {
        drawer.classList.add('hidden');
        drawer.setAttribute('aria-hidden', 'true');
        hamburger.setAttribute('aria-expanded', 'false');
    }
}

function updateActiveLinks() {
    const currentHash = window.location.hash || '#/';
    const allLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

    allLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentHash) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });
}

/**
 * Public helper to refresh header links when authentication status changes.
 */
export async function refreshNavigationAuth() {
    await renderHeader();
    updateActiveLinks();
}

