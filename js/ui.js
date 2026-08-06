
/**
 * SUMNOVA V2 PRODUCTION UI GLOBAL CONTROLLER
 * Enterprise Facade for UI Modules, Accessibility, and DOM Utilities
 * 
 * Responsibilities: Centralizing UI interactions, managing module lifecycles 
 * (Loader, Toast, Modal), providing DOM manipulation utilities, ensuring 
 * accessibility (ARIA), and abstracting common frontend UI tasks safely.
 */

import { initializeLoader, destroyLoader, showLoader, hideLoader, setLoaderText } from './loader.js';
import { initializeToast, destroyToast, success, error, warning, info, clearToasts } from './toast.js';
import { initializeModal, destroyModal, openModal, closeModal } from './modal.js';

// =========================================================
// STATE & CONFIGURATION
// =========================================================

const state = {
    initialized: false,
    abortController: null,
    announcerEl: null
};

// =========================================================
// LIFECYCLE MANAGEMENT
// =========================================================

/**
 * Initializes all global UI sub-modules (Loader, Toast, Modal) and creates
 * necessary utility DOM nodes (like ARIA announcers) securely.
 * 
 * @returns {void}
 */
export function initializeUI() {
    if (state.initialized) {
        return;
    }

    try {
        state.abortController = new AbortController();

        // 1. Initialize Sub-Modules
        if (typeof initializeLoader === 'function') initializeLoader();
        if (typeof initializeToast === 'function') initializeToast();
        if (typeof initializeModal === 'function') initializeModal();

        // 2. Setup Global ARIA Live Announcer for Accessibility
        setupAriaAnnouncer();

        state.initialized = true;
    } catch (err) {
        console.error('Error initializing Global UI Controller:', err);
    }
}

/**
 * Destroys all UI sub-modules, clears the UI state, aborts local listeners,
 * and removes utility DOM nodes to prevent memory leaks.
 * 
 * @returns {void}
 */
export function destroyUI() {
    if (!state.initialized) return;

    if (typeof destroyLoader === 'function') destroyLoader();
    if (typeof destroyToast === 'function') destroyToast();
    if (typeof destroyModal === 'function') destroyModal();

    if (state.abortController) {
        state.abortController.abort();
        state.abortController = null;
    }

    if (state.announcerEl && state.announcerEl.parentNode) {
        state.announcerEl.parentNode.removeChild(state.announcerEl);
    }
    state.announcerEl = null;

    state.initialized = false;
}

/**
 * Resets the UI completely. Closes modals, hides loaders, and clears toasts.
 * 
 * @returns {void}
 */
export function clearUI() {
    if (typeof closeModal === 'function') closeModal();
    if (typeof hideLoader === 'function') hideLoader();
    if (typeof clearToasts === 'function') clearToasts();
}

// =========================================================
// FACADE METHODS: TOAST NOTIFICATIONS
// =========================================================

/**
 * Displays a success toast message.
 * @param {string} message 
 */
export function showSuccess(message) {
    if (typeof success === 'function') success(message);
}

/**
 * Displays an error toast message.
 * @param {string} message 
 */
export function showError(message) {
    if (typeof error === 'function') error(message);
}

/**
 * Displays a warning toast message.
 * @param {string} message 
 */
export function showWarning(message) {
    if (typeof warning === 'function') warning(message);
}

/**
 * Displays an informational toast message.
 * @param {string} message 
 */
export function showInfo(message) {
    if (typeof info === 'function') info(message);
}

// =========================================================
// FACADE METHODS: LOADER
// =========================================================

/**
 * Shows the global loading screen and optionally sets the loading text.
 * @param {string} [message] - Optional text to display
 */
export function showLoading(message) {
    if (message && typeof setLoaderText === 'function') {
        setLoaderText(message);
    }
    if (typeof showLoader === 'function') {
        showLoader();
    }
}

/**
 * Hides the global loading screen.
 */
export function hideLoading() {
    if (typeof hideLoader === 'function') {
        hideLoader();
    }
}

// =========================================================
// FACADE METHODS: MODAL
// =========================================================

/**
 * Opens a modal dialog with the specified options.
 * @param {Object} options - Modal configuration options
 */
export function openDialog(options) {
    if (typeof openModal === 'function') {
        openModal(options);
    }
}

/**
 * Closes the currently open modal dialog.
 */
export function closeDialog() {
    if (typeof closeModal === 'function') {
        closeModal();
    }
}

// =========================================================
// DOM UTILITIES & BUTTON STATES
// =========================================================

/**
 * Safely focuses an HTML element if it exists and supports the focus method.
 * 
 * @param {HTMLElement} element - The element to focus
 * @returns {void}
 */
export function safeFocus(element) {
    if (element && typeof element.focus === 'function') {
        try {
            element.focus();
        } catch (e) {
            // Ignore focus failures gracefully
        }
    }
}

/**
 * Scrolls the window to the top smoothly.
 * 
 * @returns {void}
 */
export function scrollToTop() {
    if (typeof window !== 'undefined') {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }
}

/**
 * Toggles the visibility of a DOM element using the 'hidden' CSS class and 'aria-hidden'.
 * 
 * @param {HTMLElement} element - The element to toggle
 * @returns {void}
 */
export function toggleHidden(element) {
    if (!element || !(element instanceof HTMLElement)) return;
    
    const isHidden = element.classList.contains('hidden');
    if (isHidden) {
        showElement(element);
    } else {
        hideElement(element);
    }
}

/**
 * Shows a DOM element by removing the 'hidden' class and updating ARIA.
 * 
 * @param {HTMLElement} element 
 * @returns {void}
 */
export function showElement(element) {
    if (!element || !(element instanceof HTMLElement)) return;
    element.classList.remove('hidden');
    element.setAttribute('aria-hidden', 'false');
}

/**
 * Hides a DOM element by adding the 'hidden' class and updating ARIA.
 * 
 * @param {HTMLElement} element 
 * @returns {void}
 */
export function hideElement(element) {
    if (!element || !(element instanceof HTMLElement)) return;
    element.classList.add('hidden');
    element.setAttribute('aria-hidden', 'true');
}

// =========================================================
// BUTTON STATE MANAGEMENT
// =========================================================

/**
 * Enables an HTML button element.
 * 
 * @param {HTMLButtonElement} button 
 */
export function enableButton(button) {
    if (!button || typeof button.disabled === 'undefined') return;
    button.disabled = false;
    button.removeAttribute('aria-disabled');
}

/**
 * Disables an HTML button element.
 * 
 * @param {HTMLButtonElement} button 
 */
export function disableButton(button) {
    if (!button || typeof button.disabled === 'undefined') return;
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
}

/**
 * Sets a button into a busy/loading state, preventing interaction and optionally
 * showing a loading spinner while preserving the original text.
 * 
 * @param {HTMLButtonElement} button - The button to mutate
 * @param {boolean} busy - Whether the button should be busy (true) or idle (false)
 * @returns {void}
 */
export function setBusy(button, busy) {
    if (!button || !(button instanceof HTMLButtonElement)) return;

    if (busy) {
        if (button.hasAttribute('data-busy') && button.getAttribute('data-busy') === 'true') return;
        
        button.setAttribute('data-busy', 'true');
        button.setAttribute('aria-busy', 'true');
        button.dataset.originalHtml = button.innerHTML;
        button.disabled = true;

        const spinner = createSpinner('small');
        const textSpan = document.createElement('span');
        textSpan.className = 'btn-text-busy';
        textSpan.textContent = ' Please wait...'; // Generic fallback or could keep text

        // Clear and append spinner
        button.innerHTML = '';
        button.appendChild(spinner);
        button.appendChild(textSpan);

    } else {
        if (!button.hasAttribute('data-busy') || button.getAttribute('data-busy') === 'false') return;

        button.setAttribute('data-busy', 'false');
        button.setAttribute('aria-busy', 'false');
        button.disabled = false;

        if (button.dataset.originalHtml) {
            button.innerHTML = button.dataset.originalHtml;
        }
    }
}

/**
 * Creates and returns a dynamic CSS spinner element.
 * 
 * @param {string} [size='normal'] - Spinner size class (e.g., 'small', 'large')
 * @returns {HTMLElement} The constructed spinner element
 */
export function createSpinner(size = 'normal') {
    const spinner = document.createElement('span');
    spinner.className = 'spinner';
    
    if (size === 'small') {
        spinner.classList.add('spinner-sm');
    } else if (size === 'large') {
        spinner.classList.add('spinner-lg');
    }

    spinner.setAttribute('role', 'status');
    spinner.setAttribute('aria-label', 'Loading');
    return spinner;
}

// =========================================================
// ACCESSIBILITY: ARIA LIVE ANNOUNCER
// =========================================================

/**
 * Sets up a visually hidden region for screen readers to announce dynamic changes.
 * 
 * @returns {void}
 */
function setupAriaAnnouncer() {
    let announcer = document.getElementById('sumnova-aria-announcer');
    if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'sumnova-aria-announcer';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'visually-hidden sr-only hidden';
        
        // Inline styles for absolute visual hiding ensuring it doesn't disrupt layout
        Object.assign(announcer.style, {
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: '0',
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: '0'
        });

        document.body.appendChild(announcer);
    }
    state.announcerEl = announcer;
}

/**
 * Announces a message strictly to screen readers via aria-live region.
 * Useful for dynamic changes not otherwise conveyed via focus or alerts.
 * 
 * @param {string} message - The text for the screen reader to announce
 * @returns {void}
 */
export function announce(message) {
    if (!message || typeof message !== 'string') return;
    
    if (!state.announcerEl) {
        setupAriaAnnouncer();
    }

    if (state.announcerEl) {
        // Clear text first to re-trigger announcement for identical consecutive messages
        state.announcerEl.textContent = '';
        setTimeout(() => {
            if (state.announcerEl) {
                state.announcerEl.textContent = message;
            }
        }, 50);
    }
}
