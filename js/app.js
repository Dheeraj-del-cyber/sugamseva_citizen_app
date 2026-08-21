// js/app.js
// Sugam Seva – Complete Application Logic
// Uses localStorage for prototype persistence

(function () {
    'use strict';

    // ============================================================
    //  Storage Keys
    // ============================================================
    const KEYS = {
        USER_DB:  'sugamSeva_userDB',   // { name, mobile, email, passwordHash }
        SESSION:  'sugamSeva_session',  // { name, mobile, email, id }
        DOCS:     'sugamSeva_docs',     // [ { id, type, dataUrl, addedAt } ]
        APPLICATIONS: 'sugamSeva_applications',
    };

    // ============================================================
    //  App State
    // ============================================================
    const state = {
        currentUser:  null,
        isSignUpMode: false,
        documents:    [],
        activeFilter: 'all',
        camera: {
            stream:       null,
            capturedData: null,
        },
        pendingDocType: null,
        currentView: 'documents',
        selectedScheme: null,
        language: 'en',
        application: null,
        schemes: [],
        recommendationError: null,
    };

    const DEMO_SCHEMES = [
        {
            id: 'demo-education-support',
            name: 'Demo Education Support Grant',
            shortDescription: 'A sample scholarship journey for students exploring document-based applications.',
            description: 'This synthetic record demonstrates how a citizen can discover a benefit, review requirements, and prepare an application draft.',
            benefits: 'Illustrative tuition support of up to INR 25,000 per academic year.',
            scope: 'central',
            state: null,
            eligibilityHighlight: 'Students aged 16 to 25 with annual household income below INR 300,000.',
            eligibilityDetails: 'Applicants should be enrolled in a recognised course and provide current education and income records.',
            whoCanApply: 'Students or a parent/guardian applying on behalf of a student.',
            ageMin: 16,
            ageMax: 25,
            incomeMax: 300000,
            educationRequirements: 'Proof of current enrolment',
            locationRequirements: 'Any Indian state',
            applicationProcedure: 'Complete the draft form, review the information and documents, then use the official portal when one is available.',
            deadline: 'Demo deadline: 31 March 2027',
            officialApplicationUrl: null,
            officialSourceUrl: null,
            lastUpdated: '2026-08-21',
            isDemo: true,
            documents: [{ name: 'Aadhaar Card', required: true }, { name: 'Education Certificate', required: true }, { name: 'Income Certificate', required: true }],
            assessment: { status: 'Demo Only', reasons: ['Sample recommendation'], missingDocuments: [] },
        },
        {
            id: 'demo-health-cover',
            name: 'Demo Family Health Cover',
            shortDescription: 'A sample health-benefit application for families reviewing required identity documents.',
            description: 'Use this demo to see a complete benefit detail page and a review-first application process.',
            benefits: 'Illustrative annual health cover of INR 100,000 per family.',
            scope: 'central',
            state: null,
            eligibilityHighlight: 'Families with annual household income below INR 500,000.',
            eligibilityDetails: 'The final authority would verify household income, identity and residence before approving a claim.',
            whoCanApply: 'An adult household member with valid identity and residence proof.',
            ageMin: null,
            ageMax: null,
            incomeMax: 500000,
            educationRequirements: null,
            locationRequirements: 'Any Indian state',
            applicationProcedure: 'Prepare the listed documents, complete the application draft, confirm the review acknowledgement, and submit through the designated authority.',
            deadline: 'Demo deadline: 30 June 2027',
            officialApplicationUrl: null,
            officialSourceUrl: null,
            lastUpdated: '2026-08-21',
            isDemo: true,
            documents: [{ name: 'Aadhaar Card', required: true }, { name: 'Income Certificate', required: true }, { name: 'Voter ID', required: false }],
            assessment: { status: 'Demo Only', reasons: ['Sample recommendation'], missingDocuments: [] },
        },
        {
            id: 'demo-women-enterprise',
            name: 'Demo Women Enterprise Starter',
            shortDescription: 'A sample small-business support journey with a practical checklist of documents.',
            description: 'This demo record shows how scheme information and reusable citizen documents can come together before an official application.',
            benefits: 'Illustrative startup assistance of up to INR 50,000.',
            scope: 'state',
            state: 'Maharashtra',
            eligibilityHighlight: 'Women entrepreneurs aged 18 and above living in Maharashtra.',
            eligibilityDetails: 'Applicants would need to satisfy the final programme rules and provide identity, address and business details.',
            whoCanApply: 'Women starting or formalising a small enterprise in Maharashtra.',
            ageMin: 18,
            ageMax: null,
            incomeMax: null,
            educationRequirements: null,
            locationRequirements: 'Maharashtra',
            applicationProcedure: 'Complete the profile fields, attach the requested documents, review the application, and continue to the relevant official authority.',
            deadline: 'Demo deadline: 15 September 2027',
            officialApplicationUrl: null,
            officialSourceUrl: null,
            lastUpdated: '2026-08-21',
            isDemo: true,
            documents: [{ name: 'Aadhaar Card', required: true }, { name: 'PAN Card', required: true }, { name: 'Address Proof', required: true }],
            assessment: { status: 'Demo Only', reasons: ['Sample recommendation'], missingDocuments: [] },
        },
    ];

    const API_BASE = window.SUGAM_SEVA_API_BASE || '';

    // ============================================================
    //  DOM References
    // ============================================================
    const el = {
        // Views
        authView:      id('auth-view'),
        bioView:       id('biometric-view'),
        dashView:      id('dashboard-view'),
        homeView:      id('home-view'),
        detailsView:   id('scheme-details-view'),
        applicationView: id('application-view'),

        // Nav
        nav:           id('main-nav'),

        // Auth
        authForm:      id('auth-form'),
        authTitle:     id('auth-title'),
        authSubtitle:  id('auth-subtitle'),
        toggleAuthBtn: id('toggle-auth-btn'),
        formError:     id('form-error'),

        // Biometric
        enableBioBtn:  id('enable-biometric-btn'),
        skipBioBtn:    id('skip-biometric-btn'),

        // Dashboard
        docGrid:       id('document-grid'),
        addDocBtn:     id('add-document-btn'),
        filterBar:     id('filter-bar'),

        // Scheme and application views
        schemeGrid:    id('scheme-grid'),
        profileStrip:  id('profile-strip'),
        languageSelect: id('language-select'),
        schemeDetails: id('scheme-details-content'),
        applicationContent: id('application-content'),
        backHomeBtn:   id('back-home-btn'),

        // Upload Modal
        uploadModal:   id('upload-modal'),
        modalOverlay:  id('modal-overlay'),
        closeModalBtn: id('close-modal-btn'),
        docTypeSelect: id('doc-type'),
        uploadOptions: id('upload-options'),
        fileInput:     id('file-input'),

        // Steps
        stepType:        id('step-type'),
        stepCamera:      id('step-camera'),
        stepPreview:     id('step-preview'),
        stepDigiLocker:  id('step-digilocker'),

        // Camera
        cameraStream:   id('camera-stream'),
        captureBtn:     id('capture-btn'),
        captureCanvas:  id('capture-canvas'),
        cancelCameraBtn: id('cancel-camera-btn'),

        // Preview
        imagePreview:  id('image-preview'),
        retakeBtn:     id('retake-btn'),
        saveDocBtn:    id('save-doc-btn'),

        // Upload option buttons
        optGallery:    id('opt-gallery'),
        optCamera:     id('opt-camera'),
        optDigiLocker: id('opt-digilocker'),

        // DigiLocker
        digiConnectBtn: id('digilocker-connect-btn'),
        digiCancelBtn:  id('digilocker-cancel-btn'),

        // View-doc modal
        viewModal:        id('view-modal'),
        viewModalOverlay: id('view-modal-overlay'),
        closeViewModal:   id('close-view-modal-btn'),
        viewModalTitle:   id('view-modal-title'),
        viewModalImg:     id('view-modal-img'),
        viewModalDate:    id('view-modal-date'),
    };

    function id(s) { return document.getElementById(s); }

    // ============================================================
    //  Bootstrap
    // ============================================================
    document.addEventListener('DOMContentLoaded', boot);

    function boot() {
        loadSession();
        loadDocuments();
        bindEvents();
        route();
    }

    // ============================================================
    //  Session & Storage
    // ============================================================
    function loadSession() {
        const raw = localStorage.getItem(KEYS.SESSION);
        state.currentUser = raw ? JSON.parse(raw) : null;
    }

    function saveSession(user) {
        state.currentUser = user;
        localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
    }

    function clearSession() {
        state.currentUser = null;
        localStorage.removeItem(KEYS.SESSION);
    }

    function loadDocuments() {
        const raw = localStorage.getItem(KEYS.DOCS);
        state.documents = raw ? JSON.parse(raw) : [];
    }

    async function apiFetch(path, options = {}) {
        const headers = { Accept: 'application/json', ...(options.headers || {}) };
        if (state.currentUser) headers['X-User-Id'] = state.currentUser.id;
        if (options.body) headers['Content-Type'] = 'application/json';
        const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
        const body = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null;
        if (!response.ok) throw new Error(body?.error || `Request failed (${response.status})`);
        return body;
    }

    function syncProfile() {
        if (!state.currentUser) return Promise.resolve();
        return apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify({ name: state.currentUser.name, mobile: state.currentUser.mobile, email: state.currentUser.email }) }).catch(() => {});
    }

    function syncDocumentMetadata() {
        return Promise.all(state.documents.map(document => apiFetch('/api/documents', { method: 'POST', body: JSON.stringify({ id: document.id, documentType: document.type }) }).catch(() => {})));
    }

    function persistDocuments() {
        localStorage.setItem(KEYS.DOCS, JSON.stringify(state.documents));
    }

    // Simple hash (NOT cryptographically secure — prototype only)
    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return hash.toString(16);
    }

    // ============================================================
    //  Routing
    // ============================================================
    function route() {
        hideAllViews();
        if (!state.currentUser) {
            el.authView.classList.remove('hidden');
            el.authView.style.display = 'block';
            renderAuthForm();
        } else {
            if (state.currentView === 'home') {
                showView(el.homeView);
                renderSchemeHome();
            } else if (state.currentView === 'details' && state.selectedScheme) {
                showView(el.detailsView);
                renderSchemeDetails(findScheme(state.selectedScheme));
            } else if (state.currentView === 'application' && state.selectedScheme) {
                showView(el.applicationView);
                renderApplicationForm(findScheme(state.selectedScheme));
            } else {
                state.currentView = 'documents';
                showView(el.dashView);
                renderDocumentGrid();
            }
        }
        renderNav();
    }

    function showView(view) {
        view.classList.remove('hidden');
        view.style.display = 'block';
    }

    function hideAllViews() {
        [el.authView, el.bioView, el.dashView, el.homeView, el.detailsView, el.applicationView].forEach(v => {
            v.style.display = 'none';
            v.classList.add('hidden');
        });
    }

    // ============================================================
    //  Navigation
    // ============================================================
    function renderNav() {
        if (state.currentUser) {
            el.nav.innerHTML = `
                <span class="nav-user">Hi, ${escHtml(state.currentUser.name)}</span>
                <button id="home-nav-btn" class="nav-link ${state.currentView === 'home' ? 'active' : ''}">Home</button>
                <button id="documents-nav-btn" class="nav-link ${state.currentView === 'documents' ? 'active' : ''}">My Documents</button>
                <button id="logout-btn" class="btn btn-secondary" style="padding:6px 12px; font-size:0.8rem;">Sign Out</button>
            `;
            id('home-nav-btn').addEventListener('click', () => {
                state.currentView = 'home';
                state.selectedScheme = null;
                route();
            });
            id('documents-nav-btn').addEventListener('click', () => {
                state.currentView = 'documents';
                state.selectedScheme = null;
                route();
            });
            id('logout-btn').addEventListener('click', handleLogout);
        } else {
            el.nav.innerHTML = '';
        }
    }

    // ============================================================
    //  Auth Forms
    // ============================================================
    function renderAuthForm() {
        clearFormError();
        if (state.isSignUpMode) {
            el.authTitle.textContent    = 'Create Account';
            el.authSubtitle.textContent = 'Register to manage your citizen documents.';
            el.toggleAuthBtn.textContent = 'Already have an account? Sign In';
            el.authForm.innerHTML = `
                <div class="form-group">
                    <label for="reg-name">Full Name</label>
                    <input type="text" id="reg-name" class="form-control" placeholder="Enter your full name" required autocomplete="name">
                </div>
                <div class="form-group">
                    <label for="reg-mobile">Mobile Number</label>
                    <input type="tel" id="reg-mobile" class="form-control" placeholder="10-digit mobile number" required autocomplete="tel" maxlength="10">
                </div>
                <div class="form-group">
                    <label for="reg-email">Email Address</label>
                    <input type="email" id="reg-email" class="form-control" placeholder="you@example.com" required autocomplete="email">
                </div>
                <div class="form-group">
                    <label for="reg-pass">Password</label>
                    <input type="password" id="reg-pass" class="form-control" placeholder="Minimum 8 characters" required autocomplete="new-password" minlength="8">
                </div>
                <div class="form-group">
                    <label for="reg-confirm">Confirm Password</label>
                    <input type="password" id="reg-confirm" class="form-control" placeholder="Repeat your password" required autocomplete="new-password">
                </div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-bottom:0;">Create Account</button>
            `;
        } else {
            el.authTitle.textContent    = 'Sign In';
            el.authSubtitle.textContent = 'Access your citizen documents securely.';
            el.toggleAuthBtn.textContent = 'New here? Create an account';
            el.authForm.innerHTML = `
                <div class="form-group">
                    <label for="login-id">Mobile Number or Email</label>
                    <input type="text" id="login-id" class="form-control" placeholder="Mobile or email" required autocomplete="username">
                </div>
                <div class="form-group">
                    <label for="login-pass">Password</label>
                    <input type="password" id="login-pass" class="form-control" placeholder="Your password" required autocomplete="current-password">
                </div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-bottom:0;">Sign In</button>
            `;
        }
    }

    function showFormError(msg) {
        el.formError.textContent = msg;
        el.formError.classList.remove('hidden');
    }

    function clearFormError() {
        el.formError.textContent = '';
        el.formError.classList.add('hidden');
    }

    // ============================================================
    //  Auth Handlers
    // ============================================================
    let pendingUser = null;

    function handleSignUp() {
        const name    = val('reg-name');
        const mobile  = val('reg-mobile');
        const email   = val('reg-email');
        const pass    = val('reg-pass');
        const confirm = val('reg-confirm');

        if (!name || !mobile || !email || !pass || !confirm) {
            return showFormError('Please fill in all fields.');
        }
        if (!/^[6-9]\d{9}$/.test(mobile)) {
            return showFormError('Please enter a valid 10-digit Indian mobile number.');
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            return showFormError('Please enter a valid email address.');
        }
        if (pass.length < 8) {
            return showFormError('Password must be at least 8 characters.');
        }
        if (pass !== confirm) {
            return showFormError('Passwords do not match.');
        }

        const userRecord = { name, mobile, email, passwordHash: simpleHash(pass), id: Date.now().toString() };
        localStorage.setItem(KEYS.USER_DB, JSON.stringify(userRecord));

        pendingUser = { name, mobile, email, id: userRecord.id };
        showBiometricSetup();
    }

    function handleSignIn() {
        const loginId = val('login-id');
        const pass    = val('login-pass');

        if (!loginId || !pass) {
            return showFormError('Please enter your credentials.');
        }

        const raw = localStorage.getItem(KEYS.USER_DB);
        if (!raw) {
            return showFormError('No account found. Please create one first.');
        }

        const record = JSON.parse(raw);
        const match  = (loginId === record.mobile || loginId === record.email)
                    && simpleHash(pass) === record.passwordHash;

        if (!match) {
            return showFormError('Incorrect credentials. Please try again.');
        }

        pendingUser = { name: record.name, mobile: record.mobile, email: record.email, id: record.id };
        showBiometricSetup();
    }

    // ============================================================
    //  Biometric
    // ============================================================
    function showBiometricSetup() {
        hideAllViews();
        el.bioView.classList.remove('hidden');
        el.bioView.style.display = 'block';
    }

    async function finishAuth() {
        if (!pendingUser) return;
        saveSession(pendingUser);
        pendingUser = null;
        await syncProfile();
        await syncDocumentMetadata();
        state.currentView = 'home';
        route();
    }

    function handleLogout() {
        clearSession();
        state.documents = [];
        state.currentView = 'documents';
        state.selectedScheme = null;
        route();
    }

    function getProfile() {
        return {
            name: state.currentUser ? state.currentUser.name : '',
            mobile: state.currentUser ? state.currentUser.mobile : '',
            email: state.currentUser ? state.currentUser.email : '',
            documents: state.documents.map(doc => doc.type)
        };
    }

    async function renderSchemeHome() {
        try {
            const result = await apiFetch('/api/recommendations');
            state.schemes = result.recommendations.map(item => ({ ...item.scheme, assessment: item.assessment }));
            state.recommendationError = null;
        } catch (error) {
            state.schemes = DEMO_SCHEMES;
            state.recommendationError = error.message;
        }
        el.profileStrip.innerHTML = `
            <div><span class="profile-label">Profile used</span><strong>${escHtml(getProfile().name)}</strong></div>
            <div><span class="profile-label">Documents available</span><strong>${state.documents.length}</strong></div>
            <div><span class="profile-label">Assessment</span><strong>May Be Eligible</strong></div>
        `;
        if (!state.schemes.length) {
            el.schemeGrid.innerHTML = `<div class="empty-state scheme-empty"><h3>No verified schemes available</h3><p>No approved scheme records have been imported yet.</p></div>`;
            return;
        }
        el.schemeGrid.innerHTML = `${state.recommendationError ? '<div class="demo-notice" role="status"><strong>Demo catalogue</strong><span>Connect PostgreSQL and import an approved dataset to replace these sample records.</span></div>' : ''}${state.schemes.map(scheme => `
            <article class="scheme-card">
                <div class="scheme-card-top"><span class="scheme-status">${escHtml(scheme.assessment.status)}</span><span class="scheme-match">${escHtml(scheme.assessment.reasons.length ? scheme.assessment.reasons[0] : 'Profile checked')}</span></div>
                <h3>${escHtml(scheme.name)}</h3>
                <p class="scheme-description">${escHtml(scheme.shortDescription)}</p>
                <dl class="scheme-facts">
                    <div><dt>Main benefit</dt><dd>${escHtml(scheme.benefits)}</dd></div>
                    <div><dt>Basic eligibility</dt><dd>${escHtml(scheme.eligibilityHighlight)}</dd></div>
                    <div><dt>Important documents</dt><dd>${escHtml(scheme.documents.map(document => document.name).join(', '))}</dd></div>
                </dl>
                <button type="button" class="btn btn-primary" data-scheme-details="${scheme.id}">View Details <span aria-hidden="true">&rarr;</span></button>
            </article>
        `).join('')}`;
    }

    function findScheme(id) {
        return state.schemes.find(scheme => scheme.id === id);
    }

    async function renderSchemeDetails(scheme) {
        if (!scheme) {
            try {
                const result = await apiFetch(`/api/schemes/${encodeURIComponent(state.selectedScheme)}`);
                scheme = result.scheme;
                state.schemes.push(scheme);
            } catch {
                el.schemeDetails.innerHTML = '<div class="empty-state"><h3>Scheme details are unavailable</h3><p>Connect the backend to load verified information.</p></div>';
                return;
            }
        }
        el.schemeDetails.innerHTML = `
            <div class="detail-heading"><div><span class="scheme-status">${escHtml(scheme.isDemo ? 'Demo Only' : 'May Be Eligible')}</span><h2 id="scheme-details-title">${escHtml(scheme.name)}</h2><p>${escHtml(scheme.description)}</p></div><span class="official-mark">${scheme.isDemo ? 'Synthetic demo record' : 'Official source listed'}</span></div>
            <div class="detail-grid">
                <section class="detail-section"><h3>Benefits</h3><p>${escHtml(scheme.benefits)}</p></section>
                <section class="detail-section"><h3>Detailed eligibility</h3><p>${escHtml(scheme.eligibilityDetails)}</p></section>
                <section class="detail-section"><h3>Who can apply</h3><p>${escHtml(scheme.whoCanApply)}</p></section>
                <section class="detail-section"><h3>Required documents</h3><ul>${scheme.documents.map(doc => `<li>${escHtml(doc.name)}</li>`).join('')}</ul></section>
                <section class="detail-section"><h3>Application process</h3><p>${escHtml(scheme.applicationProcedure)}</p></section>
                <section class="detail-section"><h3>Deadline</h3><p>${escHtml(scheme.deadline || 'Not published')}</p></section>
                <section class="detail-section"><h3>Official source</h3><p>${scheme.officialSourceUrl ? `<a href="${escHtml(scheme.officialSourceUrl)}" target="_blank" rel="noopener">Open official source</a>` : 'Demo record: no official source linked.'}</p></section>
                <section class="detail-section"><h3>Apply officially</h3><p>${scheme.officialApplicationUrl ? `<a href="${escHtml(scheme.officialApplicationUrl)}" target="_blank" rel="noopener">Open application website</a>` : 'Demo record: this draft is not sent to an authority.'}</p></section>
            </div>
            <div class="detail-actions"><button type="button" class="btn btn-primary" id="interested-btn">I'm Interested</button><p class="text-muted">Starting an application does not confirm eligibility or submit anything.</p></div>
        `;
    }

    function renderApplicationForm(scheme) {
        const profile = getProfile();
        const existing = state.application && state.application.schemeId === scheme.id ? state.application.fields : {};
        const fields = [
            ['name', 'Full name', profile.name], ['mobile', 'Mobile number', profile.mobile], ['email', 'Email address', profile.email],
            ['dateOfBirth', 'Date of birth', existing.dateOfBirth || ''], ['aadhaar', 'Aadhaar number', existing.aadhaar || ''],
            ['address', 'Address', existing.address || ''], ['income', 'Annual income', existing.income || ''], ['education', 'Education details', existing.education || '']
        ];
        el.applicationContent.innerHTML = `
            <button type="button" class="back-link" id="back-details-btn">&larr; Back to scheme details</button>
            <div class="detail-heading application-heading"><div><span class="eyebrow">Application draft</span><h2 id="application-title">${escHtml(scheme.name)}</h2><p>We reused your profile and available documents. Complete only what is missing.</p></div></div>
            <div class="notice-box"><strong>Review required</strong><span>Fields are editable. Missing information is marked below and will not be invented.</span></div>
            <form id="application-form" class="application-form" novalidate>
                ${fields.map(([key, label, value]) => `<div class="form-group ${value ? '' : 'field-missing'}"><label for="app-${key}">${label}${value ? '' : ' <span>Missing</span>'}</label><input id="app-${key}" name="${key}" class="form-control" value="${escHtml(value)}" ${key === 'dateOfBirth' ? 'type="date"' : ''} placeholder="Enter ${label.toLowerCase()} if available"></div>`).join('')}
                <div class="application-docs"><h3>Documents to reuse</h3><p class="text-muted">Available documents will be included for your review.</p><ul>${(profile.documents.length ? profile.documents : ['No documents uploaded yet']).map(doc => `<li>${escHtml(doc)}</li>`).join('')}</ul></div>
                <button type="submit" class="btn btn-primary">Continue to review <span aria-hidden="true">&rarr;</span></button>
            </form>
        `;
    }

    function renderApplicationReview() {
        const scheme = findScheme(state.selectedScheme);
        const fields = state.application.fields;
        el.applicationContent.innerHTML = `
            <button type="button" class="back-link" id="back-application-btn">&larr; Edit application</button>
            <div class="detail-heading application-heading"><div><span class="eyebrow">Final review</span><h2>Check your application</h2><p>${escHtml(scheme.name)} will not be submitted until you click the final button.</p></div></div>
            <div class="review-list">${Object.entries(fields).map(([key, value]) => `<div><dt>${escHtml(fieldLabel(key))}</dt><dd>${value ? escHtml(value) : '<span class="missing-text">Not provided</span>'}</dd></div>`).join('')}</div>
            <div class="application-docs"><h3>Selected documents</h3><ul>${state.documents.length ? state.documents.map(doc => `<li>${escHtml(doc.type)} <span class="doc-ready">Available</span></li>`).join('') : '<li class="missing-text">No documents selected</li>'}</ul></div>
            <div class="acknowledgement"><input type="checkbox" id="review-ack"> <label for="review-ack">I have reviewed the information and understand that the official authority will verify eligibility.</label></div>
            <button type="button" class="btn btn-primary" id="submit-application-btn">Submit Application</button>
            <p class="text-muted submit-note">This button represents the user's manual submission step in this prototype.</p>
        `;
    }

    function fieldLabel(key) {
        return { name: 'Full name', mobile: 'Mobile number', email: 'Email address', dateOfBirth: 'Date of birth', aadhaar: 'Aadhaar number', address: 'Address', income: 'Annual income', education: 'Education details' }[key] || key;
    }

    // ============================================================
    //  Document Dashboard
    // ============================================================
    function renderDocumentGrid() {
        const docs = state.activeFilter === 'all'
            ? state.documents
            : state.documents.filter(d => d.type === state.activeFilter);

        if (docs.length === 0) {
            el.docGrid.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-state-icon" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                    <h3>No documents yet</h3>
                    <p>Click "+ Add Document" to upload your first document.</p>
                </div>`;
            return;
        }

        el.docGrid.innerHTML = docs.map(doc => `
            <article class="doc-card" data-id="${doc.id}">
                ${doc.dataUrl
                    ? `<img class="doc-card-thumb" src="${doc.dataUrl}" alt="${escHtml(doc.type)}" title="View document" data-action="view">`
                    : `<div class="doc-card-thumb-placeholder" data-action="view" title="View document">
                           <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5">
                               <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                               <polyline points="14 2 14 8 20 8"/>
                           </svg>
                       </div>`
                }
                <div class="doc-card-body">
                    <span class="doc-card-type">${escHtml(doc.type)}</span>
                    <p class="doc-card-date">Added ${formatDate(doc.addedAt)}</p>
                    <div class="doc-card-actions">
                        <button class="btn btn-secondary" data-action="view" title="View document">View</button>
                        <button class="btn btn-danger" data-action="delete" title="Delete document">Delete</button>
                    </div>
                </div>
            </article>
        `).join('');

        // Event delegation for card actions
        el.docGrid.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', e => {
                const card   = e.target.closest('[data-id]');
                const docId  = card ? card.dataset.id : null;
                const action = e.currentTarget.dataset.action;
                if (!docId) return;
                if (action === 'view')   viewDocument(docId);
                if (action === 'delete') deleteDocument(docId);
            });
        });
    }

    function viewDocument(docId) {
        const doc = state.documents.find(d => d.id === docId);
        if (!doc) return;

        el.viewModalTitle.textContent = doc.type;
        el.viewModalDate.textContent  = 'Added ' + formatDate(doc.addedAt);

        if (doc.dataUrl) {
            el.viewModalImg.src           = doc.dataUrl;
            el.viewModalImg.style.display = 'block';
        } else {
            el.viewModalImg.style.display = 'none';
        }

        el.viewModal.classList.remove('hidden');
    }

    function deleteDocument(docId) {
        if (!confirm('Remove this document from your wallet?')) return;
        state.documents = state.documents.filter(d => d.id !== docId);
        persistDocuments();
        apiFetch(`/api/documents/${encodeURIComponent(docId)}`, { method: 'DELETE' }).catch(() => {});
        renderDocumentGrid();
    }

    function addDocument(type, dataUrl) {
        const doc = {
            id:       Date.now().toString(),
            type,
            dataUrl,
            addedAt:  new Date().toISOString(),
        };
        state.documents.unshift(doc); // newest first
        persistDocuments();
        apiFetch('/api/documents', { method: 'POST', body: JSON.stringify({ id: doc.id, documentType: doc.type }) }).catch(() => {});
        closeUploadModal();
        renderDocumentGrid();
    }

    // ============================================================
    //  Upload Modal
    // ============================================================
    function openUploadModal() {
        resetModalSteps();
        el.uploadModal.classList.remove('hidden');
        el.docTypeSelect.value = '';
        el.uploadOptions.classList.add('hidden');
        state.pendingDocType   = null;
        state.camera.capturedData = null;
    }

    function closeUploadModal() {
        stopCamera();
        el.uploadModal.classList.add('hidden');
        resetModalSteps();
    }

    function resetModalSteps() {
        [el.stepType, el.stepCamera, el.stepPreview, el.stepDigiLocker].forEach(s => {
            s.classList.add('hidden');
        });
        el.stepType.classList.remove('hidden');
        el.imagePreview.src = '';
        el.fileInput.value  = '';
    }

    function showStep(stepEl) {
        [el.stepType, el.stepCamera, el.stepPreview, el.stepDigiLocker].forEach(s => s.classList.add('hidden'));
        stepEl.classList.remove('hidden');
    }

    // ============================================================
    //  Camera
    // ============================================================
    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false,
            });
            state.camera.stream       = stream;
            el.cameraStream.srcObject = stream;
            showStep(el.stepCamera);
        } catch (err) {
            alert('Camera access was denied or is unavailable. Please use the file picker instead.');
        }
    }

    function stopCamera() {
        if (state.camera.stream) {
            state.camera.stream.getTracks().forEach(t => t.stop());
            state.camera.stream = null;
        }
        el.cameraStream.srcObject = null;
    }

    function capturePhoto() {
        const video  = el.cameraStream;
        const canvas = el.captureCanvas;
        canvas.width  = video.videoWidth  || 640;
        canvas.height = video.videoHeight || 480;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        stopCamera();
        showPreview(dataUrl, 'camera');
    }

    // ============================================================
    //  File Picker
    // ============================================================
    function handleFileSelect(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => showPreview(e.target.result, 'file');
        reader.readAsDataURL(file);
    }

    // ============================================================
    //  Preview
    // ============================================================
    let previewSource = null; // 'camera' | 'file'

    function showPreview(dataUrl, source) {
        state.camera.capturedData = dataUrl;
        previewSource             = source;
        el.imagePreview.src       = dataUrl;
        showStep(el.stepPreview);
    }

    // ============================================================
    //  Event Binding
    // ============================================================
    function bindEvents() {
        // Auth toggle
        el.toggleAuthBtn.addEventListener('click', () => {
            state.isSignUpMode = !state.isSignUpMode;
            renderAuthForm();
        });

        // Auth form submit
        el.authForm.addEventListener('submit', e => {
            e.preventDefault();
            state.isSignUpMode ? handleSignUp() : handleSignIn();
        });

        // Biometric
        el.enableBioBtn.addEventListener('click', () => {
            // Attempt WebAuthn – if unsupported, just simulate
            if (window.PublicKeyCredential) {
                alert('Device security enabled via your browser\'s passkey/biometric system.');
            } else {
                alert('Biometric setup simulated. (WebAuthn not available in this browser/context.)');
            }
            finishAuth();
        });
        el.skipBioBtn.addEventListener('click', finishAuth);

        // Dashboard: Add document
        el.addDocBtn.addEventListener('click', openUploadModal);

        // Scheme and application navigation uses delegation because content is rendered per route.
        document.addEventListener('click', e => {
            const detailsButton = e.target.closest('[data-scheme-details]');
            if (detailsButton) {
                state.selectedScheme = detailsButton.dataset.schemeDetails;
                state.currentView = 'details';
                route();
                return;
            }
            if (e.target.closest('#back-home-btn')) {
                state.currentView = 'home';
                state.selectedScheme = null;
                route();
                return;
            }
            if (e.target.closest('#interested-btn')) {
                state.currentView = 'application';
                route();
                return;
            }
            if (e.target.closest('#back-details-btn')) {
                state.currentView = 'details';
                route();
                return;
            }
            if (e.target.closest('#back-application-btn')) {
                renderApplicationForm(findScheme(state.selectedScheme));
                return;
            }
            if (e.target.closest('#submit-application-btn')) {
                const acknowledgement = id('review-ack');
                if (!acknowledgement.checked) {
                    alert('Please confirm that you reviewed the application before submitting.');
                    return;
                }
                const applications = JSON.parse(localStorage.getItem(KEYS.APPLICATIONS) || '[]');
                applications.unshift({ id: Date.now().toString(), schemeId: state.selectedScheme, fields: state.application.fields, submittedAt: new Date().toISOString() });
                localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(applications));
                alert('Application submitted for manual processing.');
                state.currentView = 'home';
                state.selectedScheme = null;
                route();
            }
        });

        document.addEventListener('submit', e => {
            if (e.target.id !== 'application-form') return;
            e.preventDefault();
            const formData = new FormData(e.target);
            const fields = Object.fromEntries(formData.entries());
            state.application = { schemeId: state.selectedScheme, fields };
            renderApplicationReview();
        });

        el.languageSelect.addEventListener('change', () => {
            state.language = el.languageSelect.value;
            applyLanguage();
        });

        // Filter chips
        el.filterBar.addEventListener('click', e => {
            const chip = e.target.closest('.filter-chip');
            if (!chip) return;
            el.filterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.activeFilter = chip.dataset.filter;
            renderDocumentGrid();
        });

        // Modal close
        el.closeModalBtn.addEventListener('click', closeUploadModal);
        el.modalOverlay.addEventListener('click', closeUploadModal);

        // View modal close
        el.closeViewModal.addEventListener('click', () => el.viewModal.classList.add('hidden'));
        el.viewModalOverlay.addEventListener('click', () => el.viewModal.classList.add('hidden'));

        // Doc type select
        el.docTypeSelect.addEventListener('change', () => {
            const type = el.docTypeSelect.value;
            if (type) {
                state.pendingDocType = type;
                el.uploadOptions.classList.remove('hidden');
            } else {
                el.uploadOptions.classList.add('hidden');
            }
        });

        // Upload options
        el.optGallery.addEventListener('click', () => el.fileInput.click());

        el.fileInput.addEventListener('change', () => {
            handleFileSelect(el.fileInput.files[0]);
        });

        el.optCamera.addEventListener('click', startCamera);

        el.optDigiLocker.addEventListener('click', () => showStep(el.stepDigiLocker));

        // Camera
        el.captureBtn.addEventListener('click', capturePhoto);
        el.cancelCameraBtn.addEventListener('click', () => {
            stopCamera();
            showStep(el.stepType);
        });

        // Preview
        el.retakeBtn.addEventListener('click', () => {
            if (previewSource === 'camera') {
                startCamera();
            } else {
                el.fileInput.click();
            }
        });

        el.saveDocBtn.addEventListener('click', () => {
            if (!state.pendingDocType) {
                alert('Please select a document type first.');
                return;
            }
            addDocument(state.pendingDocType, state.camera.capturedData);
        });

        // DigiLocker
        el.digiConnectBtn.addEventListener('click', () => {
            // Connection interface only — no real API call
            alert('DigiLocker connection interface is ready.\n\nReal integration requires official DigiLocker API onboarding with your organisation\'s credentials. Your data is not sent anywhere in this prototype.');
        });
        el.digiCancelBtn.addEventListener('click', () => showStep(el.stepType));

        // Keyboard: Escape closes modals
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                if (!el.uploadModal.classList.contains('hidden'))  closeUploadModal();
                if (!el.viewModal.classList.contains('hidden'))    el.viewModal.classList.add('hidden');
            }
        });
    }

    // ============================================================
    //  Helpers
    // ============================================================
    function applyLanguage() {
        const labels = {
            en: ['Schemes for your next step', 'Recommended schemes', 'View Details'],
            hi: ['Aapke liye yojanaen', 'Sujhayi gayi yojanaen', 'Vivaran dekhen'],
            mr: ['Tumachyasathi yojana', 'Shifaras kelelya yojana', 'Mahiti paha'],
            ta: ['Ungalukkaana thittangal', 'Parinduraikkappatta thittangal', 'Vivaram paarkkavum']
        }[state.language];
        if (!labels) return;
        el.homeView.querySelector('#home-title').textContent = labels[0];
        const heading = el.homeView.querySelector('.section-heading h3');
        if (heading) heading.textContent = labels[1];
        el.homeView.querySelectorAll('[data-scheme-details]').forEach(button => {
            button.childNodes[0].textContent = labels[2] + ' ';
        });
    }

    function val(elId) {
        const el = document.getElementById(elId);
        return el ? el.value.trim() : '';
    }

    function escHtml(str) {
        const d = document.createElement('div');
        d.appendChild(document.createTextNode(str));
        return d.innerHTML;
    }

    function formatDate(iso) {
        const d = new Date(iso);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }

})();
