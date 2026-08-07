/**
 * SUMNOVA V2 — APPLICATION ENTRY POINT & LANDING CONTROLLER
 * Enterprise SPA Application Shell Bootstrapper
 * 
 * Responsibilities: Initializing global subsystems, managing the landing page view,
 * coordinating startup sequences, and providing robust mobile diagnostic error-reporting.
 */

import { initializeTheme } from './theme.js';
import { initializeNavigation, destroyNavigation } from './navigation.js';
import { initializeUI } from './ui.js';
import { initSettings } from './settings.js';
import { initializeRouter } from './router.js';
import { showLoader, hideLoader } from './loader.js';

// =========================================================
// TEMPORARY MOBILE BOOT DIAGNOSTIC STATE & HANDLERS
// =========================================================

let currentStage = 'Pre-init';

/**
 * Displays a fatal diagnostic error panel directly on the webpage for mobile debugging.
 * [TEMPORARY DIAGNOSTIC BLOCK]
 * 
 * @param {Error|string} error - The caught exception or error message
 * @param {string} stage - The specific application startup stage where the failure occurred
 */
function renderStartupErrorDiagnostic(error, stage) {
    try {
        // Ensure loader is hidden so the error panel is front and center
        if (typeof hideLoader === 'function') {
            hideLoader();
        }

        let diagnosticContainer = document.getElementById('sumnova-boot-diagnostic-panel');
        if (!diagnosticContainer) {
            diagnosticContainer = document.createElement('div');
            diagnosticContainer.id = 'sumnova-boot-diagnostic-panel';
            document.body.appendChild(diagnosticContainer);
        }

        const message = error && error.message ? error.message : String(error);
        const name = error && error.name ? error.name : 'Error';
        const stack = error && error.stack ? error.stack : 'No stack trace available';

        diagnosticContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #121212;
            color: #ff5252;
            z-index: 999999;
            padding: 24px;
            box-sizing: border-box;
            overflow-y: auto;
            font-family: monospace, sans-serif;
            font-size: 14px;
            line-height: 1.5;
        `;

        diagnosticContainer.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto; background: #1e1e1e; padding: 20px; border-radius: 8px; border: 1px solid #ff5252; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                <h2 style="color: #ff5252; margin-top: 0; border-bottom: 1px solid #333; padding-bottom: 10px;">SumNova V2 Startup Error</h2>
                <p style="margin: 10px 0; color: #ffa726;"><strong>Failed during:</strong> ${escapeHtml(stage)}</p>
                <p style="margin: 10px 0; color: #fff;"><strong>Error Type:</strong> ${escapeHtml(name)}</p>
                <p style="margin: 10px 0; color: #fff;"><strong>Message:</strong> ${escapeHtml(message)}</p>
                <div style="margin-top: 15px;">
                    <strong>Stack Trace:</strong>
                    <pre style="background: #111; color: #e0e0e0; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 12px; margin-top: 5px;">${escapeHtml(stack)}</pre>
                </div>
                <button onclick="window.location.reload()" style="margin-top: 20px; background: #ff5252; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; cursor: pointer; width: 100%;">Reload Application</button>
            </div>
        `;
    } catch (diagErr) {
        console.error('Fatal error rendering diagnostic panel:', diagErr);
    }
}

/**
 * Basic HTML escaping helper for safe diagnostic rendering.
 * [TEMPORARY DIAGNOSTIC HELPER]
 */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Register global error listeners for uncaught exceptions during boot or runtime
if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
        renderStartupErrorDiagnostic(event.error || event.message, `Global Window Error (${currentStage})`);
    });

    window.addEventListener('unhandledrejection', (event) => {
        renderStartupErrorDiagnostic(event.reason || 'Unhandled Promise Rejection', `Unhandled Promise Rejection (${currentStage})`);
    });
}

// =========================================================
// STATE & CONFIGURATION
// =========================================================

const state = {
    initialized: false,
    abortController: null
};

// =========================================================
// APPLICATION INITIALIZATION & BOOT SEQUENCE
// =========================================================

/**
 * Initializes the entire SumNova V2 single-page application shell,
 * wrapping all boot stages in robust diagnostic error handling.
 * 
 * @returns {void}
 */
export function initializeApp() {
    if (state.initialized) {
        return;
    }

    try {
        state.abortController = new AbortController();

        // Ensure global loader is visible while booting
        if (typeof showLoader === 'function') {
            showLoader();
        }

        // Stage 1: Theme
        currentStage = 'Initializing theme';
        if (typeof initializeTheme === 'function') {
            initializeTheme();
        }

        // Stage 2: Navigation
        currentStage = 'Initializing navigation';
        if (typeof initializeNavigation === 'function') {
            initializeNavigation();
        }

        // Stage 3: UI Controller
        currentStage = 'Initializing UI';
        if (typeof initializeUI === 'function') {
            initializeUI();
        }

        // Stage 4: Settings
        currentStage = 'Initializing settings';
        if (typeof initSettings === 'function') {
            initSettings();
        }

        // Stage 5: Router
        currentStage = 'Initializing router';
        if (typeof initializeRouter === 'function') {
            initializeRouter();
        }

        // Stage 6: Hiding loader
        currentStage = 'Hiding loader';
        if (typeof hideLoader === 'function') {
            hideLoader();
        }

        state.initialized = true;
    } catch (err) {
        console.error(`SumNova Boot Failure at stage [${currentStage}]:`, err);
        renderStartupErrorDiagnostic(err, currentStage);
    }
}

/**
 * Destroys the application state and cleans up root listeners.
 * 
 * @returns {void}
 */
export function destroyApp() {
    if (!state.initialized) return;

    if (typeof destroyNavigation === 'function') {
        destroyNavigation();
    }

    if (state.abortController) {
        state.abortController.abort();
        state.abortController = null;
    }

    state.initialized = false;
}

// =========================================================
// LANDING PAGE CONTROLLER
// =========================================================

/**
 * Renders the primary landing page view inside `#app-root` for the root route (`/`).
 * 
 * @returns {Function} Cleanup function for landing page listeners
 */
export function initializeLanding() {
    const appRoot = document.getElementById('app-root');
    if (!appRoot) {
        return () => {};
    }

    appRoot.innerHTML = '';

    const landingContainer = document.createElement('div');
    landingContainer.className = 'landing-container';

    const heroSection = document.createElement('section');
    heroSection.className = 'hero-section';

    const title = document.createElement('h1');
    title.className = 'hero-title';
    title.textContent = 'Learn Faster. Understand Better.';

    const subtitle = document.createElement('p');
    subtitle.className = 'hero-subtitle';
    subtitle.textContent = 'SumNova V2 is your enterprise-grade intelligent study companion powered by modern web architecture.';

    const ctaContainer = document.createElement('div');
    ctaContainer.className = 'hero-cta-container';

    const getStartedBtn = document.createElement('a');
    getStartedBtn.href = '#/signup';
    getStartedBtn.className = 'btn btn-primary btn-lg focusable';
    getStartedBtn.textContent = 'Get Started';

    const loginBtn = document.createElement('a');
    loginBtn.href = '#/login';
    loginBtn.className = 'btn btn-secondary btn-lg focusable';
    loginBtn.textContent = 'Sign In';

    ctaContainer.appendChild(getStartedBtn);
    ctaContainer.appendChild(loginBtn);

    heroSection.appendChild(title);
    heroSection.appendChild(subtitle);
    heroSection.appendChild(ctaContainer);
    landingContainer.appendChild(heroSection);
    appRoot.appendChild(landingContainer);

    // Return cleanup function
    return () => {
        appRoot.innerHTML = '';
    };
}

// Auto-boot application once the DOM is fully loaded
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
    } else {
        initializeApp();
    }
}
