/**
 * SUMNOVA V2 PRODUCTION TOAST NOTIFICATION CONTROLLER
 * Enterprise SaaS Toast System
 * 
 * Responsibilities: Managing dynamic toast notifications, queue limits (max 5),
 * auto-dismissal timers, manual dismissal, accessibility attributes, and 
 * memory-safe lifecycle cleanups via AbortController.
 */

// =========================================================
// STATE & CONFIGURATION
// =========================================================

const VALID_TYPES = ['success', 'error', 'warning', 'info'];
const DEFAULT_DURATION = 4000;
const MAX_VISIBLE_TOASTS = 5;

const state = {
    initialized: false,
    abortController: null,
    container: null,
    activeToasts: [] // Array of { element, timerId }
};

// =========================================================
// INITIALIZATION & DESTRUCTION
// =========================================================

/**
 * Initializes the toast notification module, caches the existing #toast-container reference,
 * and prevents duplicate initialization.
 * 
 * @returns {void}
 */
export function initializeToast() {
    if (state.initialized) {
        return;
    }

    try {
        state.abortController = new AbortController();
        state.container = document.getElementById('toast-container');

        if (!state.container) {
            console.warn('Warning: #toast-container element not found in DOM during toast initialization.');
        }

        state.initialized = true;
    } catch (error) {
        console.error('Error initializing toast module:', error);
    }
}

/**
 * Destroys the toast module, clears all active toasts and timers, and resets state.
 * 
 * @returns {void}
 */
export function destroyToast() {
    if (!state.initialized) return;

    clearToasts();

    if (state.abortController) {
        state.abortController.abort();
        state.abortController = null;
    }

    state.container = null;
    state.initialized = false;
}

// =========================================================
// CORE TOAST METHODS
// =========================================================

/**
 * Displays a toast notification with the specified message, type, and duration.
 * 
 * @param {string} message - The message text to display
 * @param {string} [type='info'] - The toast type ('success', 'error', 'warning', 'info')
 * @param {number} [duration=4000] - Duration in milliseconds before auto-dismissal
 * @returns {void}
 */
export function showToast(message, type = 'info', duration = DEFAULT_DURATION) {
    if (!message || typeof message !== 'string') return;

    if (!state.initialized) {
        initializeToast();
    }

    const container = state.container || document.getElementById('toast-container');
    if (!container) return;

    // Validate type
    const safeType = VALID_TYPES.includes(type) ? type : 'info';

    // Enforce queue limit: remove oldest if limit reached
    if (state.activeToasts.length >= MAX_VISIBLE_TOASTS) {
        const oldest = state.activeToasts.shift();
        if (oldest) {
            if (oldest.timerId) clearTimeout(oldest.timerId);
            if (oldest.element && oldest.element.parentNode) {
                oldest.element.remove();
            }
        }
    }

    // Create toast DOM elements
    const toastEl = document.createElement('div');
    toastEl.className = `toast ${safeType} focusable`;
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');

    const msgSpan = document.createElement('span');
    msgSpan.className = 'toast-message';
    msgSpan.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-icon toast-close';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.textContent = '×';

    toastEl.appendChild(msgSpan);
    toastEl.appendChild(closeBtn);

    const toastRecord = {
        element: toastEl,
        timerId: null
    };

    // Manual dismissal handler
    const dismiss = () => {
        if (toastRecord.timerId) clearTimeout(toastRecord.timerId);
        
        const index = state.activeToasts.indexOf(toastRecord);
        if (index > -1) {
            state.activeToasts.splice(index, 1);
        }

        toastEl.style.opacity = '0';
        toastEl.style.transform = 'translateY(-8px)';
        toastEl.style.transition = 'opacity 150ms ease, transform 150ms ease';

        setTimeout(() => {
            if (toastEl.parentNode) {
                toastEl.remove();
            }
        }, 150);
    };

    closeBtn.addEventListener('click', dismiss, { once: true });

    // Auto-dismissal timer
    const autoDismissDuration = typeof duration === 'number' ? duration : DEFAULT_DURATION;
    toastRecord.timerId = setTimeout(dismiss, autoDismissDuration);

    state.activeToasts.push(toastRecord);
    container.appendChild(toastEl);
}

// =========================================================
// HELPER METHODS
// =========================================================

/**
 * Displays a success toast notification.
 * 
 * @param {string} message 
 */
export function success(message) {
    showToast(message, 'success');
}

/**
 * Displays an error toast notification.
 * 
 * @param {string} message 
 */
export function error(message) {
    showToast(message, 'error');
}

/**
 * Displays a warning toast notification.
 * 
 * @param {string} message 
 */
export function warning(message) {
    showToast(message, 'warning');
}

/**
 * Displays an info toast notification.
 * 
 * @param {string} message 
 */
export function info(message) {
    showToast(message, 'info');
}

/**
 * Immediately removes all active toast notifications and clears their timers.
 * 
 * @returns {void}
 */
export function clearToasts() {
    state.activeToasts.forEach(record => {
        if (record.timerId) clearTimeout(record.timerId);
        if (record.element && record.element.parentNode) {
            record.element.remove();
        }
    });
    state.activeToasts = [];
}

// Auto-initialize on module import if DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeToast, { once: true });
    } else {
        initializeToast();
    }
}

