/**
 * SUMNOVA V2 PRODUCTION AUTHENTICATION CONTROLLER
 * Enterprise Firebase Authentication & View Initializer Manager
 * 
 * Responsibilities: Managing Firebase Auth readiness with guaranteed non-blocking
 * resolution, authentication APIs (signUp, signIn, signOut, resetPassword, resendVerificationEmail, getCurrentUser, isAuthenticated),
 * and dynamic rendering of auth views (#/login, #/signup, #/forgot-password, #/verify-email)
 * inside #app-root with full accessibility, AbortController cleanup, and UI integration.
 */

import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut, sendPasswordResetEmail, sendEmailVerification } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { auth } from './config.js';

import { showSuccess, showError, setBusy, safeFocus, announce } from './ui.js';
function navigateTo(path) {
    window.location.hash = path.startsWith('#/')
        ? path
        : `#${path.startsWith('/') ? path : `/${path}`}`;
}
// =========================================================
// STATE & CONFIGURATION
// =========================================================

const state = {
    currentUser: null,
    authInitialized: false,
    authReadyPromise: null,
    activeAbortController: null
};

// =========================================================
// AUTHENTICATION READINESS & CORE API
// =========================================================

/**
 * Initializes a deterministic, non-blocking promise that resolves once Firebase Auth
 * has determined the initial authentication state. Guarantees it never hangs indefinitely.
 * 
 * @returns {Promise<boolean>} Resolves to true if authenticated, false otherwise.
 */
export function isAuthenticated() {
    if (state.authInitialized && state.authReadyPromise) {
        return state.authReadyPromise;
    }

    state.authReadyPromise = new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
            console.warn('Auth readiness check timed out; falling back to unauthenticated state.');
            state.authInitialized = true;
            resolve(false);
        }, 4000);

        try {
            const firebaseAuth = auth || (typeof getAuth === 'function' ? getAuth() : null);
            if (!firebaseAuth) {
                clearTimeout(timeoutId);
                state.authInitialized = true;
                resolve(false);
                return;
            }

            const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
                clearTimeout(timeoutId);
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
                state.currentUser = user;
                state.authInitialized = true;
                resolve(Boolean(user));
            }, (error) => {
                clearTimeout(timeoutId);
                console.warn('Auth state change observer error:', error);
                state.authInitialized = true;
                resolve(false);
            });
        } catch (e) {
            clearTimeout(timeoutId);
            console.warn('Exception during auth state initialization:', e);
            state.authInitialized = true;
            resolve(false);
        }
    });

    return state.authReadyPromise;
}

/**
 * Returns the current authenticated Firebase user object or null.
 * 
 * @returns {Object|null}
 */
export function getCurrentUser() {
    const firebaseAuth = auth || (typeof getAuth === 'function' ? getAuth() : null);
    return firebaseAuth ? firebaseAuth.currentUser : state.currentUser;
}

/**
 * Signs up a new user with email and password.
 * 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Object>}
 */
export async function signUp(email, password) {
    const firebaseAuth = auth || (typeof getAuth === 'function' ? getAuth() : null);
    if (!firebaseAuth) throw new Error('Authentication service not available.');
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    state.currentUser = userCredential.user;
    return userCredential.user;
}

/**
 * Signs in an existing user with email and password.
 * 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Object>}
 */
export async function signIn(email, password) {
    const firebaseAuth = auth || (typeof getAuth === 'function' ? getAuth() : null);
    if (!firebaseAuth) throw new Error('Authentication service not available.');
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    state.currentUser = userCredential.user;
    return userCredential.user;
}

/**
 * Signs out the current user.
 * 
 * @returns {Promise<void>}
 */
export async function signOut() {
    const firebaseAuth = auth || (typeof getAuth === 'function' ? getAuth() : null);
    if (!firebaseAuth) return;
    await fbSignOut(firebaseAuth);
    state.currentUser = null;
}

/**
 * Sends a password reset email to the user.
 * 
 * @param {string} email 
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
    const firebaseAuth = auth || (typeof getAuth === 'function' ? getAuth() : null);
    if (!firebaseAuth) throw new Error('Authentication service not available.');
    await sendPasswordResetEmail(firebaseAuth, email);
}

/**
 * Sends an email verification link to the current user.
 * 
 * @returns {Promise<void>}
 */
export async function resendVerificationEmail() {
    const user = getCurrentUser();
    if (!user) throw new Error('No user is currently signed in.');
    await sendEmailVerification(user);
}

// =========================================================
// ERROR MESSAGE TRANSLATOR
// =========================================================

function translateAuthError(error) {
    const code = error && error.code ? error.code : '';
    switch (code) {
        case 'auth/invalid-email':
            return 'Invalid email address format.';
        case 'auth/user-disabled':
            return 'This user account has been disabled.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Incorrect email or password.';
        case 'auth/email-already-in-use':
            return 'Email is already registered.';
        case 'auth/weak-password':
            return 'Password is too weak. Please use at least 6 characters.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection and try again.';
        case 'auth/too-many-requests':
            return 'Access temporarily blocked due to many failed attempts. Try again later.';
        default:
            return error.message || 'An unexpected authentication error occurred. Please try again.';
    }
}

// =========================================================
// VIEW INITIALIZERS (ROUTER COMPATIBLE)
// =========================================================

/**
 * Renders the Login View inside #app-root.
 * 
 * @returns {Function} Cleanup function
 */
export function initializeLogin() {
    state.activeAbortController = new AbortController();
    const { signal } = state.activeAbortController;

    const appRoot = document.getElementById('app-root');
    if (!appRoot) return () => {};

    appRoot.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'auth-view-container';

    const card = document.createElement('div');
    card.className = 'card auth-card';

    const title = document.createElement('h2');
    title.textContent = 'Sign In to SumNova';

    const form = document.createElement('form');
    form.className = 'auth-form';
    form.noValidate = true;

    // Email Field
    const emailGroup = document.createElement('div');
    emailGroup.className = 'form-group';
    const emailLabel = document.createElement('label');
    emailLabel.setAttribute('for', 'login-email');
    emailLabel.textContent = 'Email Address';
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'login-email';
    emailInput.className = 'form-input focusable';
    emailInput.required = true;
    emailInput.setAttribute('autocomplete', 'email');
    emailGroup.appendChild(emailLabel);
    emailGroup.appendChild(emailInput);

    // Password Field
    const passGroup = document.createElement('div');
    passGroup.className = 'form-group';
    const passLabel = document.createElement('label');
    passLabel.setAttribute('for', 'login-password');
    passLabel.textContent = 'Password';
    const passInput = document.createElement('input');
    passInput.type = 'password';
    passInput.id = 'login-password';
    passInput.className = 'form-input focusable';
    passInput.required = true;
    passInput.setAttribute('autocomplete', 'current-password');
    passGroup.appendChild(passLabel);
    passGroup.appendChild(passInput);

    // Actions & Links
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-primary focusable';
    submitBtn.textContent = 'Sign In';

    const footerLinks = document.createElement('div');
    footerLinks.className = 'auth-footer-links';
    
    const forgotLink = document.createElement('a');
    forgotLink.href = '#/forgot-password';
    forgotLink.className = 'focusable';
    forgotLink.textContent = 'Forgot Password?';

    const signupLink = document.createElement('a');
    signupLink.href = '#/signup';
    signupLink.className = 'focusable';
    signupLink.textContent = "Don't have an account? Sign Up";

    footerLinks.appendChild(forgotLink);
    footerLinks.appendChild(document.createTextNode(' | '));
    footerLinks.appendChild(signupLink);

    form.appendChild(emailGroup);
    form.appendChild(passGroup);
    form.appendChild(submitBtn);
    form.appendChild(footerLinks);

    card.appendChild(title);
    card.appendChild(form);
    container.appendChild(card);
    appRoot.appendChild(container);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passInput.value;

        if (!email || !password) {
            showError('Please enter both email and password.');
            return;
        }

        setBusy(submitBtn, true);
        try {
            await signIn(email, password);
            showSuccess('Successfully signed in!');
            navigateTo('#/dashboard');
        } catch (err) {
            const userMsg = translateAuthError(err);
            showError(userMsg);
            announce(userMsg);
        } finally {
            setBusy(submitBtn, false);
        }
    }, { signal });

    safeFocus(emailInput);

    return () => {
        if (state.activeAbortController) {
            state.activeAbortController.abort();
            state.activeAbortController = null;
        }
    };
}

/**
 * Renders the Signup View inside #app-root.
 * 
 * @returns {Function} Cleanup function
 */
export function initializeSignup() {
    state.activeAbortController = new AbortController();
    const { signal } = state.activeAbortController;

    const appRoot = document.getElementById('app-root');
    if (!appRoot) return () => {};

    appRoot.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'auth-view-container';

    const card = document.createElement('div');
    card.className = 'card auth-card';

    const title = document.createElement('h2');
    title.textContent = 'Create Your SumNova Account';

    const form = document.createElement('form');
    form.className = 'auth-form';
    form.noValidate = true;

    // Email Field
    const emailGroup = document.createElement('div');
    emailGroup.className = 'form-group';
    const emailLabel = document.createElement('label');
    emailLabel.setAttribute('for', 'signup-email');
    emailLabel.textContent = 'Email Address';
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'signup-email';
    emailInput.className = 'form-input focusable';
    emailInput.required = true;
    emailInput.setAttribute('autocomplete', 'email');
    emailGroup.appendChild(emailLabel);
    emailGroup.appendChild(emailInput);

    // Password Field
    const passGroup = document.createElement('div');
    passGroup.className = 'form-group';
    const passLabel = document.createElement('label');
    passLabel.setAttribute('for', 'signup-password');
    passLabel.textContent = 'Password (min 6 characters)';
    const passInput = document.createElement('input');
    passInput.type = 'password';
    passInput.id = 'signup-password';
    passInput.className = 'form-input focusable';
    passInput.required = true;
    passInput.setAttribute('autocomplete', 'new-password');
    passGroup.appendChild(passLabel);
    passGroup.appendChild(passInput);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-primary focusable';
    submitBtn.textContent = 'Create Account';

    const footerLinks = document.createElement('div');
    footerLinks.className = 'auth-footer-links';
    const loginLink = document.createElement('a');
    loginLink.href = '#/login';
    loginLink.className = 'focusable';
    loginLink.textContent = 'Already have an account? Sign In';
    footerLinks.appendChild(loginLink);

    form.appendChild(emailGroup);
    form.appendChild(passGroup);
    form.appendChild(submitBtn);
    form.appendChild(footerLinks);

    card.appendChild(title);
    card.appendChild(form);
    container.appendChild(card);
    appRoot.appendChild(container);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passInput.value;

        if (!email || password.length < 6) {
            showError('Please enter a valid email and a password of at least 6 characters.');
            return;
        }

        setBusy(submitBtn, true);
        try {
            await signUp(email, password);
            showSuccess('Account created successfully!');
            navigateTo('#/dashboard');
        } catch (err) {
            const userMsg = translateAuthError(err);
            showError(userMsg);
            announce(userMsg);
        } finally {
            setBusy(submitBtn, false);
        }
    }, { signal });

    safeFocus(emailInput);

    return () => {
        if (state.activeAbortController) {
            state.activeAbortController.abort();
            state.activeAbortController = null;
        }
    };
}

/**
 * Renders the Forgot Password View inside #app-root.
 * 
 * @returns {Function} Cleanup function
 */
export function initializeForgotPassword() {
    state.activeAbortController = new AbortController();
    const { signal } = state.activeAbortController;

    const appRoot = document.getElementById('app-root');
    if (!appRoot) return () => {};

    appRoot.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'auth-view-container';

    const card = document.createElement('div');
    card.className = 'card auth-card';

    const title = document.createElement('h2');
    title.textContent = 'Reset Password';

    const form = document.createElement('form');
    form.className = 'auth-form';
    form.noValidate = true;

    const emailGroup = document.createElement('div');
    emailGroup.className = 'form-group';
    const emailLabel = document.createElement('label');
    emailLabel.setAttribute('for', 'reset-email');
    emailLabel.textContent = 'Email Address';
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'reset-email';
    emailInput.className = 'form-input focusable';
    emailInput.required = true;
    emailGroup.appendChild(emailLabel);
    emailGroup.appendChild(emailInput);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-primary focusable';
    submitBtn.textContent = 'Send Reset Link';

    const footerLinks = document.createElement('div');
    footerLinks.className = 'auth-footer-links';
    const loginLink = document.createElement('a');
    loginLink.href = '#/login';
    loginLink.className = 'focusable';
    loginLink.textContent = 'Back to Sign In';
    footerLinks.appendChild(loginLink);

    form.appendChild(emailGroup);
    form.appendChild(submitBtn);
    form.appendChild(footerLinks);

    card.appendChild(title);
    card.appendChild(form);
    container.appendChild(card);
    appRoot.appendChild(container);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();

        if (!email) {
            showError('Please enter your email address.');
            return;
        }

        setBusy(submitBtn, true);
        try {
            await resetPassword(email);
            showSuccess('Password reset email sent. Check your inbox.');
            navigateTo('#/login');
        } catch (err) {
            const userMsg = translateAuthError(err);
            showError(userMsg);
            announce(userMsg);
        } finally {
            setBusy(submitBtn, false);
        }
    }, { signal });

    safeFocus(emailInput);

    return () => {
        if (state.activeAbortController) {
            state.activeAbortController.abort();
            state.activeAbortController = null;
        }
    };
}

/**
 * Renders the Verify Email View inside #app-root.
 * 
 * @returns {Function} Cleanup function
 */
export function initializeVerifyEmail() {
    state.activeAbortController = new AbortController();
    const { signal } = state.activeAbortController;

    const appRoot = document.getElementById('app-root');
    if (!appRoot) return () => {};

    appRoot.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'auth-view-container';

    const card = document.createElement('div');
    card.className = 'card auth-card';

    const title = document.createElement('h2');
    title.textContent = 'Verify Your Email';

    const desc = document.createElement('p');
    desc.textContent = 'Please verify your email address to access all enterprise SumNova features.';

    const resendBtn = document.createElement('button');
    resendBtn.type = 'button';
    resendBtn.className = 'btn btn-primary focusable';
    resendBtn.textContent = 'Resend Verification Email';

    const dashboardLink = document.createElement('a');
    dashboardLink.href = '#/dashboard';
    dashboardLink.className = 'btn btn-secondary focusable';
    dashboardLink.textContent = 'Continue to Dashboard';

    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(resendBtn);
    card.appendChild(dashboardLink);
    container.appendChild(card);
    appRoot.appendChild(container);

    resendBtn.addEventListener('click', async () => {
        setBusy(resendBtn, true);
        try {
            await resendVerificationEmail();
            showSuccess('Verification email sent successfully.');
        } catch (err) {
            const userMsg = translateAuthError(err);
            showError(userMsg);
        } finally {
            setBusy(resendBtn, false);
        }
    }, { signal });

    return () => {
        if (state.activeAbortController) {
            state.activeAbortController.abort();
            state.activeAbortController = null;
        }
    };
}
