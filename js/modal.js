
/**
 * SUMNOVA V2 PRODUCTION MODAL DIALOG CONTROLLER
 * Enterprise SaaS Modal Dialog Manager
 * 
 * Responsibilities: Managing dynamic modal dialogs using existing HTML structure
 * (#modal-container, #modal-content-box, #modal-title, #modal-body-content, 
 * #modal-footer-actions, #btn-close-modal), focus trapping, accessibility (ARIA),
 * keyboard handling (Esc key), backdrop click dismissal, and memory-safe cleanup.
 */

// =========================================================
// STATE & CONFIGURATION
// =========================================================

const state = {
    initialized: false,
    isOpen: false,
    abortController: null,
    previousActiveElement: null,
    options: {
        closable: true,
        closeOnOverlay: true,
        closeOnEscape: true
    },
    dom: {
        container: null,
        contentBox: null,
        title: null,
        body: null,
        footer: null,
        closeBtn: null
    }
};

// =========================================================
// INITIALIZATION & DESTRUCTION
// =========================================================

/**
 * Initializes the modal controller, caches DOM references, and binds event listeners
 * using an AbortController for clean teardown.
 * 
 * @returns {void}
 */
export function initializeModal() {
    if (state.initialized) {
        return;
    }

    try {
        state.abortController = new AbortController();
        const { signal } = state.abortController;

        state.dom.container = document.getElementById('modal-container');
        state.dom.contentBox = document.getElementById('modal-content-box');
        state.dom.title = document.getElementById('modal-title');
        state.dom.body = document.getElementById('modal-body-content');
        state.dom.footer = document.getElementById('modal-footer-actions');
        state.dom.closeBtn = document.getElementById('btn-close-modal');

        if (state.dom.container) {
            state.dom.container.setAttribute('role', 'dialog');
            state.dom.container.setAttribute('aria-modal', 'true');
            state.dom.container.setAttribute('aria-hidden', 'true');
        }

        // Bind Close Button
        if (state.dom.closeBtn) {
            state.dom.closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (state.options.closable) {
                    closeModal();
                }
            }, { signal });
        }

        // Bind Overlay / Backdrop Click
        if (state.dom.container) {
            state.dom.container.addEventListener('click', (e) => {
                if (e.target === state.dom.container && state.options.closeOnOverlay && state.options.closable) {
                    closeModal();
                }
            }, { signal });
        }

        // Bind Keyboard & Focus Trap
        document.addEventListener('keydown', handleKeyDown, { signal });

        state.initialized = true;
    } catch (error) {
        console.error('Error initializing modal module:', error);
    }
}

/**
 * Destroys the modal module, closes any active modal, and cleans up event listeners.
 * 
 * @returns {void}
 */
export function destroyModal() {
    if (!state.initialized) return;

    closeModal();

    if (state.abortController) {
        state.abortController.abort();
        state.abortController = null;
    }

    state.dom.container = null;
    state.dom.contentBox = null;
    state.dom.title = null;
    state.dom.body = null;
    state.dom.footer = null;
    state.dom.closeBtn = null;
    state.initialized = false;
}

// =========================================================
// CORE MODAL METHODS
// =========================================================

/**
 * Opens the modal with specified options (title, content, actions, config flags).
 * 
 * @param {Object} [options={}] - Modal configuration options
 * @param {string} [options.title=''] - Modal title header text
 * @param {string|HTMLElement|DocumentFragment|Array<HTMLElement>} [options.content=''] - Modal body content
 * @param {Array<Object>} [options.actions=[]] - Footer action buttons configuration
 * @param {boolean} [options.closable=true] - Whether the modal can be closed
 * @param {boolean} [options.closeOnOverlay=true] - Whether clicking backdrop closes modal
 * @param {boolean} [options.closeOnEscape=true] - Whether pressing Escape closes modal
 * @returns {void}
 */
export function openModal(options = {}) {
    if (!state.initialized) {
        initializeModal();
    }

    const {
        title = '',
        content = '',
        actions = [],
        closable = true,
        closeOnOverlay = true,
        closeOnEscape = true
    } = options;

    state.options = { closable, closeOnOverlay, closeOnEscape };
    state.previousActiveElement = document.activeElement;

    setModalTitle(title);
    setModalBody(content);
    setModalFooter(actions);

    if (state.dom.closeBtn) {
        if (closable) {
            state.dom.closeBtn.classList.remove('hidden');
        } else {
            state.dom.closeBtn.classList.add('hidden');
        }
    }

    if (state.dom.container) {
        state.dom.container.classList.remove('hidden');
        state.dom.container.setAttribute('aria-hidden', 'false');
    }

    state.isOpen = true;

    // Focus first interactive element inside modal
    setTimeout(() => {
        focusFirstElement();
    }, 50);
}

/**
 * Closes the modal, restores focus, and resets state.
 * 
 * @returns {void}
 */
export function closeModal() {
    if (!state.isOpen) return;

    if (state.dom.container) {
        state.dom.container.classList.add('hidden');
        state.dom.container.setAttribute('aria-hidden', 'true');
    }

    // Clear content safely
    if (state.dom.body) state.dom.body.innerHTML = '';
    if (state.dom.footer) state.dom.footer.innerHTML = '';
    if (state.dom.title) state.dom.title.textContent = '';

    state.isOpen = false;

    // Restore previous focus
    if (state.previousActiveElement && typeof state.previousActiveElement.focus === 'function') {
        try {
            state.previousActiveElement.focus();
        } catch (e) {
            // Ignore focus restoration errors
        }
    }
    state.previousActiveElement = null;
}

/**
 * Returns whether the modal is currently open.
 * 
 * @returns {boolean}
 */
export function isModalOpen() {
    return state.isOpen;
}

// =========================================================
// HELPER METHODS FOR CONTENT MANAGEMENT
// =========================================================

/**
 * Updates the modal title.
 * 
 * @param {string} title - Title text
 * @returns {void}
 */
export function setModalTitle(title) {
    if (!state.initialized) initializeModal();
    if (state.dom.title) {
        state.dom.title.textContent = typeof title === 'string' ? title : '';
    }
}

/**
 * Updates the modal body content securely.
 * 
 * @param {string|HTMLElement|DocumentFragment|Array<HTMLElement>} content - Content to render
 * @returns {void}
 */
export function setModalBody(content) {
    if (!state.initialized) initializeModal();
    const body = state.dom.body;
    if (!body) return;

    body.innerHTML = '';

    if (!content) return;

    if (typeof content === 'string') {
        body.textContent = content;
    } else if (content instanceof HTMLElement || content instanceof DocumentFragment) {
        body.appendChild(content);
    } else if (Array.isArray(content)) {
        content.forEach(item => {
            if (item instanceof HTMLElement) {
                body.appendChild(item);
            }
        });
    }
}

/**
 * Dynamically renders footer action buttons.
 * 
 * @param {Array<Object>} actions - List of button config objects ({ label, className, callback, disabled, type })
 * @returns {void}
 */
export function setModalFooter(actions) {
    if (!state.initialized) initializeModal();
    const footer = state.dom.footer;
    if (!footer) return;

    footer.innerHTML = '';

    if (!Array.isArray(actions) || actions.length === 0) return;

    actions.forEach(act => {
        const btn = document.createElement('button');
        btn.className = `btn ${act.className || 'btn-secondary'} focusable`;
        btn.textContent = act.label || 'Action';
        btn.type = act.type || 'button';

        if (act.disabled) {
            btn.disabled = true;
        }

        if (typeof act.callback === 'function') {
            btn.addEventListener('click', async (e) => {
                try {
                    await act.callback(e);
                } catch (error) {
                    console.error('Error executing modal button callback:', error);
                }
            });
        }

        footer.appendChild(btn);
    });
}

// =========================================================
// ACCESSIBILITY & KEYBOARD MANAGEMENT
// =========================================================

function handleKeyDown(e) {
    if (!state.isOpen) return;

    if (e.key === 'Escape') {
        if (state.options.closeOnEscape && state.options.closable) {
            e.preventDefault();
            closeModal();
        }
        return;
    }

    if (e.key === 'Tab') {
        trapFocus(e);
    }
}

function trapFocus(e) {
    const container = state.dom.container;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
        if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        }
    } else {
        if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }
}

function focusFirstElement() {
    const container = state.dom.container;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
        try {
            focusableElements[0].focus();
        } catch (e) {
            // Ignore focus error
        }
    }
}

// Auto-initialize on module import if DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeModal, { once: true });
    } else {
        initializeModal();
    }
}
