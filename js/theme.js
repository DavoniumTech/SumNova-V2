
/**
 * SUMNOVA V2 PRODUCTION THEME CONTROLLER
 * Enterprise Theme Management System (Light / Dark / System)
 * 
 * Responsibilities: Managing application theme state, persisting preference in localStorage,
 * synchronizing with CSS data-theme attributes, handling OS media query preference changes,
 * memory-safe lifecycle cleanup via AbortController.
 */

// =========================================================
// STATE & CONFIGURATION
// =========================================================

const STORAGE_KEY = 'sumnova-theme';
const VALID_THEMES = ['light', 'dark', 'system'];

const state = {
    initialized: false,
    currentTheme: 'system',
    abortController: null,
    mediaQueryList: null
};

// =========================================================
// INITIALIZATION & DESTRUCTION
// =========================================================

/**
 * Initializes the theme module once, reads persisted or default settings,
 * applies the theme, and listens for OS color scheme changes.
 * 
 * @returns {void}
 */
export function initTheme() {
    if (state.initialized) {
        return;
    }

    try {
        state.abortController = new AbortController();
        const { signal } = state.abortController;

        // Read saved theme or default to system
        let savedTheme = 'system';
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored && VALID_THEMES.includes(stored)) {
                savedTheme = stored;
            }
        } catch (e) {
            console.warn('Unable to access localStorage for theme retrieval:', e);
        }

        state.currentTheme = savedTheme;
        applyTheme(savedTheme);

        // Set up matchMedia listener for system preference changes
        if (typeof window !== 'undefined' && window.matchMedia) {
            state.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handleMediaChange = () => {
                syncSystemTheme();
            };

            if (state.mediaQueryList.addEventListener) {
                state.mediaQueryList.addEventListener('change', handleMediaChange, { signal });
            } else if (state.mediaQueryList.addListener) {
                // Fallback for older environments
                state.mediaQueryList.addListener(handleMediaChange);
            }
        }

        state.initialized = true;
    } catch (error) {
        console.error('Error initializing theme module:', error);
    }
}

/**
 * Destroys the theme module, aborts media query listeners, and resets state.
 * 
 * @returns {void}
 */
export function destroyTheme() {
    if (!state.initialized) return;

    if (state.abortController) {
        state.abortController.abort();
        state.abortController = null;
    }

    state.mediaQueryList = null;
    state.initialized = false;
}

// =========================================================
// CORE THEME METHODS
// =========================================================

/**
 * Applies the specified theme to the document root element.
 * 
 * @param {string} theme - 'light', 'dark', or 'system'
 * @returns {void}
 */
export function applyTheme(theme) {
    if (!VALID_THEMES.includes(theme)) return;

    const root = document.documentElement;
    if (!root) return;

    if (theme === 'light') {
        root.setAttribute('data-theme', 'light');
    } else if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
    } else {
        // System preference mode: remove attribute to let CSS media query take effect
        root.removeAttribute('data-theme');
    }
}

/**
 * Validates, saves, and applies a new theme preference.
 * 
 * @param {string} theme - 'light', 'dark', or 'system'
 * @returns {void}
 */
export function setTheme(theme) {
    if (!VALID_THEMES.includes(theme)) {
        console.warn(`Invalid theme provided: "${theme}". Ignored.`);
        return;
    }

    state.currentTheme = theme;

    try {
        localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
        console.warn('Unable to save theme to localStorage:', e);
    }

    applyTheme(theme);
}

/**
 * Returns the current active theme setting ('light', 'dark', or 'system').
 * 
 * @returns {string}
 */
export function getTheme() {
    return state.currentTheme;
}

/**
 * Cycles through themes in exact sequence: system -> light -> dark -> system.
 * 
 * @returns {string} The newly applied theme
 */
export function toggleTheme() {
    let nextTheme = 'system';

    if (state.currentTheme === 'system') {
        nextTheme = 'light';
    } else if (state.currentTheme === 'light') {
        nextTheme = 'dark';
    } else if (state.currentTheme === 'dark') {
        nextTheme = 'system';
    }

    setTheme(nextTheme);
    return nextTheme;
}

/**
 * Automatically re-applies system theme updates if the current mode is set to 'system'.
 * 
 * @returns {void}
 */
export function syncSystemTheme() {
    if (state.currentTheme === 'system') {
        applyTheme('system');
    }
}

// Auto-initialize on module import if DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme, { once: true });
    } else {
        initTheme();
    }
}
