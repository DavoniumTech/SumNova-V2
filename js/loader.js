/**
 * SUMNOVA V2 PRODUCTION LOADER CONTROLLER
 * Enterprise Loading Screen & Async Task Wrapper Manager
 * 
 * Responsibilities: Caching DOM references for #loading-screen, #global-spinner, 
 * and #loading-text, managing visibility states, ARIA accessibility attributes,
 * async task wrapping (`withLoader`), and lifecycle cleanups.
 */

// =========================================================
// STATE & CONFIGURATION
// =========================================================

const state = {
    initialized: false,
    visible: false,
    currentText: 'Loading...',
    abortController: null,
    dom: {
        screen: null,
        spinner: null,
        text: null
    }
};

// =========================================================
// INITIALIZATION & DESTRUCTION
// =========================================================

/**
 * Initializes the loader module, caches DOM references, sets ARIA attributes,
 * and prevents duplicate initialization.
 * 
 * @returns {void}
 */
export function initializeLoader() {
    if (state.initialized) {
        return;
    }

    try {
        state.abortController = new AbortController();
        
        state.dom.screen = document.getElementById('loading-screen');
        state.dom.spinner = document.getElementById('global-spinner');
        state.dom.text = document.getElementById('loading-text');

        if (state.dom.screen) {
            state.dom.screen.setAttribute('role', 'status');
            state.dom.screen.setAttribute('aria-live', 'polite');
            
            // Initial visibility sync based on DOM class list
            state.visible = !state.dom.screen.classList.contains('hidden');
            state.dom.screen.setAttribute('aria-hidden', state.visible ? 'false' : 'true');
        }

        if (state.dom.text && state.dom.text.textContent.trim()) {
            state.currentText = state.dom.text.textContent.trim();
        }

        state.initialized = true;
    } catch (error) {
        console.error('Error initializing loader:', error);
    }
}

/**
 * Destroys the loader module, aborts listeners, and clears cached DOM references.
 * 
 * @returns {void}
 */
export function destroyLoader() {
    if (!state.initialized) return;

    if (state.abortController) {
        state.abortController.abort();
        state.abortController = null;
    }

    state.dom.screen = null;
    state.dom.spinner = null;
    state.dom.text = null;
    state.initialized = false;
    state.visible = false;
}

// =========================================================
// CORE LOADER METHODS
// =========================================================

/**
 * Displays the global loading screen and updates accessibility state.
 * 
 * @returns {void}
 */
export function showLoader() {
    if (!state.initialized) {
        initializeLoader();
    }

    if (state.visible) {
        return; // Prevent duplicate execution
    }

    state.visible = true;

    if (state.dom.screen) {
        state.dom.screen.classList.remove('hidden');
        state.dom.screen.setAttribute('aria-hidden', 'false');
    }
}

/**
 * Hides the global loading screen and updates accessibility state safely.
 * 
 * @returns {void}
 */
export function hideLoader() {
    if (!state.initialized) {
        initializeLoader();
    }

    if (!state.visible && state.dom.screen && state.dom.screen.classList.contains('hidden')) {
        return;
    }

    state.visible = false;

    if (state.dom.screen) {
        state.dom.screen.classList.add('hidden');
        state.dom.screen.setAttribute('aria-hidden', 'true');
    }
}

/**
 * Updates the text message displayed inside #loading-text.
 * 
 * @param {string} text - The loading message to display
 * @returns {void}
 */
export function setLoaderText(text) {
    if (!text || typeof text !== 'string') return;
    
    state.currentText = text;

    if (!state.initialized) {
        initializeLoader();
    }

    if (state.dom.text) {
        state.dom.text.textContent = text;
    }
}

/**
 * Checks whether the loader screen is currently visible to the user.
 * 
 * @returns {boolean}
 */
export function isLoaderVisible() {
    return state.visible;
}

/**
 * Automatically wraps an asynchronous function with the loader, showing the loader,
 * updating text, awaiting execution, and ensuring the loader hides even if errors occur.
 * 
 * @param {Function} asyncFunction - The async task function to execute
 * @param {string} [message] - Optional loading message to display during execution
 * @returns {Promise<any>} Result of the async function
 */
export async function withLoader(asyncFunction, message) {
    if (typeof asyncFunction !== 'function') {
        throw new TypeError('withLoader requires a valid asynchronous function argument.');
    }

    if (message) {
        setLoaderText(message);
    }

    showLoader();

    try {
        const result = await asyncFunction();
        return result;
    } catch (error) {
        throw error;
    } finally {
        hideLoader();
    }
}

// Auto-initialize on module import if DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLoader, { once: true });
    } else {
        initializeLoader();
    }
}

