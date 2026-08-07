/**
 * SUMNOVA V2 — APPLICATION ENTRY POINT & LANDING CONTROLLER
 * Enterprise SPA Application Shell Bootstrapper and Landing Page Renderer
 * 
 * Responsibilities: Global system bootstrapping, application shell initialization,
 * landing page dynamic DOM generation, lifecycle management, and cleanup.
 */

import { initializeRouter, navigate } from './router.js';
import { initTheme } from './theme.js';
import { initializeNavigation } from './navigation.js';
import { initializeUI } from './ui.js';
import { initSettings } from './settings.js';
import { hideLoader } from './loader.js';

// =========================================================
// STATE & EVENT TRACKING FOR CLEANUP
// =========================================================

let landingAbortController = null;

// =========================================================
// APPLICATION BOOTSTRAPPER
// =========================================================

/**
 * Bootstraps the entire SumNova V2 application shell, initializes global services,
 * sets up core modules, removes the startup loader, and starts the router.
 * 
 * @returns {void}
 */
export function initializeApp() {
    try {
        // 1. Initialize Global Theme System
        if (typeof initTheme === 'function') {
            initTheme();
        }

        // 2. Initialize Navigation & Shell Components
        if (typeof initializeNavigation === 'function') {
            initializeNavigation();
        }

        // 3. Initialize UI Helpers & Global Event Listeners
        if (typeof initializeUI === 'function') {
    initializeUI();
}

        // 4. Initialize Settings Store & Preferences
        if (typeof initSettings === 'function') {
            initSettings();
        }

        // 5. Initialize Router (Boots initial hash route)
        if (typeof initializeRouter === 'function') {
            initializeRouter();
        }

        // 6. Dismiss Loading Screen
        if (typeof hideLoader === 'function') {
            hideLoader();
        } else {
            const loader = document.getElementById('loading-screen');
            if (loader) {
                loader.classList.add('hidden');
                loader.setAttribute('aria-hidden', 'true');
            }
        }
    } catch (error) {
        console.error('Critical Error during application initialization:', error);
        if (typeof hideLoader === 'function') {
            hideLoader();
        }
    }
}

// =========================================================
// LANDING PAGE MODULE CONTROLLER
// =========================================================

/**
 * Dynamically renders the complete SumNova SaaS landing page inside #app-root
 * using pure vanilla JavaScript DOM APIs for enterprise-grade security and performance.
 * 
 * @returns {Function} Cleanup function to remove event listeners and prevent memory leaks.
 */
export function initializeLanding() {
    landingAbortController = new AbortController();
    const { signal } = landingAbortController;

    const appRoot = document.getElementById('app-root');
    if (!appRoot) return () => {};

    // Clear root container securely
    appRoot.innerHTML = '';

    // Create Landing Page Container Wrapper
    const landingContainer = document.createElement('div');
    landingContainer.className = 'landing-page-container';

    // ---------------------------------------------------------
    // 1. HERO SECTION
    // ---------------------------------------------------------
    const heroSection = document.createElement('section');
    heroSection.className = 'landing-hero';

    const heroContent = document.createElement('div');
    heroContent.className = 'hero-content';

    const badge = document.createElement('div');
    badge.className = 'hero-badge';
    badge.textContent = '✨ Introducing SumNova V2 — Enterprise AI Summarization';

    const heroTitle = document.createElement('h1');
    heroTitle.className = 'hero-title';
    heroTitle.textContent = 'Learn Faster. Understand Deeper.';

    const heroSubtitle = document.createElement('p');
    heroSubtitle.className = 'hero-subtitle';
    heroSubtitle.textContent = 'Transform lengthy documents, research papers, and video transcripts into clear, actionable intelligence in seconds with advanced AI.';

    const heroCtaGroup = document.createElement('div');
    heroCtaGroup.className = 'hero-cta-group';

    const primaryCta = document.createElement('button');
    primaryCta.className = 'btn btn-primary';
    primaryCta.textContent = 'Get Started Free';
    primaryCta.addEventListener('click', () => {
        navigate('#/signup');
    }, { signal });

    const secondaryCta = document.createElement('button');
    secondaryCta.className = 'btn btn-secondary';
    secondaryCta.textContent = 'Sign In';
    secondaryCta.addEventListener('click', () => {
        navigate('#/login');
    }, { signal });

    heroCtaGroup.appendChild(primaryCta);
    heroCtaGroup.appendChild(secondaryCta);

    heroContent.appendChild(badge);
    heroContent.appendChild(heroTitle);
    heroContent.appendChild(heroSubtitle);
    heroContent.appendChild(heroCtaGroup);

    // AI Illustration Placeholder
    const heroVisual = document.createElement('div');
    heroVisual.className = 'hero-visual-card card';
    
    const visualHeader = document.createElement('div');
    visualHeader.className = 'visual-header';
    visualHeader.textContent = 'SumNova Neural Engine v2.4';

    const visualBody = document.createElement('div');
    visualBody.className = 'visual-body';
    visualBody.textContent = '⚡ Analyzing document context... [99.8% Accuracy]';

    heroVisual.appendChild(visualHeader);
    heroVisual.appendChild(visualBody);

    heroSection.appendChild(heroContent);
    heroSection.appendChild(heroVisual);

    // ---------------------------------------------------------
    // 2. FEATURES SECTION
    // ---------------------------------------------------------
    const featuresSection = document.createElement('section');
    featuresSection.className = 'landing-features';

    const featuresHeader = document.createElement('div');
    featuresHeader.className = 'section-header';
    
    const featuresTitle = document.createElement('h2');
    featuresTitle.textContent = 'Engineered for High Performers';
    
    const featuresDesc = document.createElement('p');
    featuresDesc.textContent = 'Everything you need to digest complex information without cognitive overload.';

    featuresHeader.appendChild(featuresTitle);
    featuresHeader.appendChild(featuresDesc);

    const featuresGrid = document.createElement('div');
    featuresGrid.className = 'features-grid';

    const featureItems = [
        { title: 'Lightning Fast Summaries', desc: 'Get core takeaways instantly powered by state-of-the-art language models.' },
        { title: 'Secure Firestore Sync', desc: 'Your processing history and saved insights synchronized seamlessly across devices.' },
        { title: 'Interactive Workspace', desc: 'Ask questions directly to your documents with our context-aware AI assistant.' }
    ];

    featureItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card feature-card';

        const h3 = document.createElement('h3');
        h3.textContent = item.title;

        const p = document.createElement('p');
        p.textContent = item.desc;

        card.appendChild(h3);
        card.appendChild(p);
        featuresGrid.appendChild(card);
    });

    featuresSection.appendChild(featuresHeader);
    featuresSection.appendChild(featuresGrid);

    // ---------------------------------------------------------
    // 3. PRICING PREVIEW SECTION
    // ---------------------------------------------------------
    const pricingSection = document.createElement('section');
    pricingSection.className = 'landing-pricing';

    const pricingHeader = document.createElement('div');
    pricingHeader.className = 'section-header';
    
    const pricingTitle = document.createElement('h2');
    pricingTitle.textContent = 'Simple, Transparent Pricing';
    
    const pricingDesc = document.createElement('p');
    pricingDesc.textContent = 'Start free, upgrade when your workflow demands enterprise scale.';

    pricingHeader.appendChild(pricingTitle);
    pricingHeader.appendChild(pricingDesc);

    const pricingCard = document.createElement('div');
    pricingCard.className = 'card pricing-card';

    const planName = document.createElement('h3');
    planName.textContent = 'Pro Intelligence';

    const planPrice = document.createElement('div');
    planPrice.className = 'plan-price';
    planPrice.textContent = '$12 / month';

    const planFeatures = document.createElement('ul');
    planFeatures.className = 'plan-features-list';
    ['Unlimited AI Summaries', 'Advanced Workspace Chat', 'Priority Cloud Processing', 'Export to PDF & Markdown'].forEach(feat => {
        const li = document.createElement('li');
        li.textContent = `✓ ${feat}`;
        planFeatures.appendChild(li);
    });

    const planCta = document.createElement('button');
    planCta.className = 'btn btn-primary';
    planCta.textContent = 'Start 14-Day Free Trial';
    planCta.addEventListener('click', () => {
        navigate('#/signup');
    }, { signal });

    pricingCard.appendChild(planName);
    pricingCard.appendChild(planPrice);
    pricingCard.appendChild(planFeatures);
    pricingCard.appendChild(planCta);

    pricingSection.appendChild(pricingHeader);
    pricingSection.appendChild(pricingCard);

    // ---------------------------------------------------------
    // 4. TESTIMONIALS SECTION
    // ---------------------------------------------------------
    const testimonialsSection = document.createElement('section');
    testimonialsSection.className = 'landing-testimonials';

    const testHeader = document.createElement('div');
    testHeader.className = 'section-header';
    const testTitle = document.createElement('h2');
    testTitle.textContent = 'Trusted by Researchers & Leaders';
    testHeader.appendChild(testTitle);

    const testCard = document.createElement('div');
    testCard.className = 'card testimonial-card';
    const quote = document.createElement('blockquote');
    quote.textContent = '"SumNova has cut my daily research review time by 75%. It is an indispensable tool for anyone handling heavy document workflows."';
    const author = document.createElement('cite');
    author.textContent = '— Dr. Elena Vance, Senior AI Research Fellow';

    testCard.appendChild(quote);
    testCard.appendChild(author);
    testimonialsSection.appendChild(testHeader);
    testimonialsSection.appendChild(testCard);

    // ---------------------------------------------------------
    // 5. FOOTER CALL TO ACTION
    // ---------------------------------------------------------
    const ctaSection = document.createElement('section');
    ctaSection.className = 'landing-bottom-cta';

    const ctaHeading = document.createElement('h2');
    ctaHeading.textContent = 'Ready to Transform Your Workflow?';

    const ctaButton = document.createElement('button');
    ctaButton.className = 'btn btn-primary';
    ctaButton.textContent = 'Get Started Now';
    ctaButton.addEventListener('click', () => {
        navigate('#/signup');
    }, { signal });

    ctaSection.appendChild(ctaHeading);
    ctaSection.appendChild(ctaButton);

    // Assemble Landing Container
    landingContainer.appendChild(heroSection);
    landingContainer.appendChild(featuresSection);
    landingContainer.appendChild(pricingSection);
    landingContainer.appendChild(testimonialsSection);
    landingContainer.appendChild(ctaSection);

    appRoot.appendChild(landingContainer);

    // Return Cleanup Function
    return () => {
        if (landingAbortController) {
            landingAbortController.abort();
            landingAbortController = null;
        }
    };
}

// =========================================================
// AUTO-BOOTSTRAP ON DOM LOAD
// =========================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
} else {
    initializeApp();
}

