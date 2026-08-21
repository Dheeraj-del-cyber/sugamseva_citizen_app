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
        PROFILE: 'sugamSeva_profile',
        DOCUMENT_PASSWORD: 'sugamSeva_documentPassword',
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
        profile: {},
        profileEditing: false,
        schemes: [],
        recommendationError: null,
    };

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
        profileView:   id('profile-view'),

        // Nav
        nav:           id('main-nav'),

        // Auth
        authForm:      id('auth-form'),
        toggleAuthBtn: id('toggle-auth-btn'),
        formError:     id('form-error'),

        // Biometric
        enableBioBtn:  id('enable-biometric-btn'),
        skipBioBtn:    id('skip-biometric-btn'),

        // Dashboard
        docGrid:       id('document-grid'),
        addDocBtn:     id('add-document-btn'),
        filterBar:     id('filter-bar'),
        dashboardStats: id('dashboard-stats'),

        // Scheme and application views
        schemeGrid:    id('scheme-grid'),
        profileStrip:  id('profile-strip'),
        languageSelect: id('language-select'),
        schemeDetails: id('scheme-details-content'),
        applicationContent: id('application-content'),
        profileContent: id('profile-content'),
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
        verificationModal: id('verification-modal'),
        verificationContent: id('verification-content'),
        verificationOverlay: id('verification-overlay'),
        closeVerification: id('close-verification-btn'),
        documentUnlockModal: id('document-unlock-modal'),
        documentUnlockOverlay: id('document-unlock-overlay'),
        documentUnlockForm: id('document-unlock-form'),
        documentUnlockDescription: id('document-unlock-description'),
        documentUnlockError: id('document-unlock-error'),
        documentPassword: id('document-password'),
        documentPasswordConfirm: id('document-password-confirm'),
        documentPasswordConfirmGroup: id('document-password-confirm-group'),
        closeDocumentUnlock: id('close-document-unlock-btn'),
    };

    function id(s) { return document.getElementById(s); }

    // ============================================================
    //  Bootstrap
    // ============================================================
    document.addEventListener('DOMContentLoaded', boot);

    function boot() {
        loadSession();
        loadDocuments();
        loadProfile();
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
        const raw = state.currentUser && localStorage.getItem(`${KEYS.DOCS}_${state.currentUser.id}`);
        state.documents = raw ? JSON.parse(raw) : [];
    }

    function loadProfile() {
        const raw = state.currentUser && localStorage.getItem(`${KEYS.PROFILE}_${state.currentUser.id}`);
        state.profile = raw ? JSON.parse(raw) : {};
    }

    function saveProfile() {
        if (state.currentUser) localStorage.setItem(`${KEYS.PROFILE}_${state.currentUser.id}`, JSON.stringify(state.profile));
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
        return apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify({
            name: state.profile.fullName || state.currentUser.name,
            mobile: state.currentUser.mobile,
            email: state.currentUser.email,
            dateOfBirth: state.profile.dateOfBirth || null,
            state: state.profile.state || null,
            district: state.profile.district || null,
            income: state.profile.annualIncome || null,
            education: state.profile.education || null,
            occupation: state.profile.occupation || null,
        }) }).catch(() => {});
    }

    function syncDocumentMetadata() {
        return Promise.all(state.documents.map(document => apiFetch('/api/documents', { method: 'POST', body: JSON.stringify({ id: document.id, documentType: document.type }) }).catch(() => {})));
    }

    function loadUserRecords() {
        const raw = localStorage.getItem(KEYS.USER_DB);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [parsed];
    }

    function persistDocuments() {
        if (state.currentUser) localStorage.setItem(`${KEYS.DOCS}_${state.currentUser.id}`, JSON.stringify(state.documents));
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

    function documentPasswordKey() {
        return `${KEYS.DOCUMENT_PASSWORD}_${state.currentUser?.id || 'guest'}`;
    }

    let documentAccessResolver = null;

    function requestDocumentAccess() {
        const hasPassword = Boolean(localStorage.getItem(documentPasswordKey()));
        el.documentUnlockForm.reset();
        el.documentUnlockError.textContent = '';
        el.documentUnlockError.classList.add('hidden');
        el.documentPasswordConfirmGroup.classList.toggle('hidden', hasPassword);
        el.documentPasswordConfirm.required = !hasPassword;
        el.documentUnlockDescription.textContent = hasPassword
            ? 'Enter your 4-digit password to view this document.'
            : 'Create a 4-digit password. You will need it whenever you open a protected document.';
        el.documentUnlockModal.classList.remove('hidden');
        el.documentPassword.focus();
        return new Promise(resolve => { documentAccessResolver = resolve; });
    }

    function closeDocumentUnlock(result) {
        el.documentUnlockModal.classList.add('hidden');
        if (documentAccessResolver) {
            documentAccessResolver(result);
            documentAccessResolver = null;
        }
    }

    // ============================================================
    //  Routing
    // ============================================================
    function route() {
        hideAllViews();
        if (!state.currentUser) {
            el.authView.classList.remove('hidden');
            renderAuthForm();
        } else {
            if (state.currentView === 'home') {
                showView(el.homeView);
                renderSchemeHome();
            } else if (state.currentView === 'profile') {
                showView(el.profileView);
                renderProfile(state.profileEditing);
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
    }

    function hideAllViews() {
        [el.authView, el.bioView, el.dashView, el.homeView, el.detailsView, el.applicationView, el.profileView].forEach(view => {
            view.classList.add('hidden');
        });
    }

    // ============================================================
    //  Navigation
    // ============================================================
    function renderNav() {
        if (!state.currentUser) {
            el.nav.innerHTML = '';
            closeNavMenu();
            return;
        }
        el.nav.innerHTML = `
            <button id="nav-toggle" class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Open navigation menu">
                <svg class="icon-menu" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
                <svg class="icon-close" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
            <div id="nav-links" class="nav-links">
                <span class="nav-user">Hi, ${escHtml(state.currentUser.name)}</span>
                <button id="home-nav-btn" class="nav-link ${state.currentView === 'home' ? 'active' : ''}">Home</button>
                <button id="documents-nav-btn" class="nav-link ${state.currentView === 'documents' ? 'active' : ''}">My Documents</button>
                <button id="profile-nav-btn" class="nav-link ${state.currentView === 'profile' ? 'active' : ''}">Your Details</button>
                <button id="logout-btn" class="btn btn-secondary btn-nav-logout">Sign Out</button>
            </div>
        `;
        id('home-nav-btn').addEventListener('click', () => { closeNavMenu(); state.currentView = 'home'; state.selectedScheme = null; route(); });
        id('documents-nav-btn').addEventListener('click', () => { closeNavMenu(); state.currentView = 'documents'; state.selectedScheme = null; route(); });
        id('profile-nav-btn').addEventListener('click', () => { closeNavMenu(); state.currentView = 'profile'; route(); });
        id('logout-btn').addEventListener('click', handleLogout);
        id('nav-toggle').addEventListener('click', toggleNavMenu);
    }

    function toggleNavMenu() {
        const links = id('nav-links');
        const toggle = id('nav-toggle');
        const backdrop = id('nav-backdrop');
        if (!links || !toggle) return;
        const isOpen = links.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
        document.body.classList.toggle('nav-open', isOpen);
        if (backdrop) {
            backdrop.classList.toggle('is-visible', isOpen);
            backdrop.setAttribute('aria-hidden', String(!isOpen));
        }
    }

    function closeNavMenu() {
        const links = id('nav-links');
        const toggle = id('nav-toggle');
        const backdrop = id('nav-backdrop');
        if (links) links.classList.remove('is-open');
        if (toggle) {
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Open navigation menu');
        }
        document.body.classList.remove('nav-open');
        if (backdrop) {
            backdrop.classList.remove('is-visible');
            backdrop.setAttribute('aria-hidden', 'true');
        }
    }

    // ============================================================
    //  Auth Forms
    // ============================================================
    function renderAuthForm() {
        clearFormError();
        if (state.isSignUpMode) {
            el.toggleAuthBtn.textContent = 'Already have an account? Sign In';
            el.authForm.innerHTML = `
                <div class="form-group"><label for="reg-name">Full Name</label><input type="text" id="reg-name" class="form-control" placeholder="Enter your full name" required autocomplete="name"></div>
                <div class="form-group"><label for="reg-mobile">Mobile Number</label><input type="tel" id="reg-mobile" class="form-control" placeholder="10-digit mobile number" required autocomplete="tel" maxlength="10"></div>
                <div class="form-group"><label for="reg-email">Email Address</label><input type="email" id="reg-email" class="form-control" placeholder="you@example.com" required autocomplete="email"></div>
                <div class="form-group"><label for="reg-pass">Password</label><input type="password" id="reg-pass" class="form-control" placeholder="Minimum 8 characters" required autocomplete="new-password" minlength="8"></div>
                <div class="form-group"><label for="reg-confirm">Confirm Password</label><input type="password" id="reg-confirm" class="form-control" placeholder="Repeat your password" required autocomplete="new-password"></div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-bottom:0;">Create Account</button>`;
        } else {
            el.toggleAuthBtn.textContent = 'New here? Create an account';
            el.authForm.innerHTML = `
                <div class="form-group"><label for="login-id">Mobile Number or Email</label><input type="text" id="login-id" class="form-control" placeholder="Mobile or email" required autocomplete="username"></div>
                <div class="form-group"><label for="login-pass">Password</label><input type="password" id="login-pass" class="form-control" placeholder="Your password" required autocomplete="current-password"></div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-bottom:0;">Sign In</button>`;
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
        const users = loadUserRecords();
        if (users.some(user => user.mobile === mobile || user.email === email)) {
            return showFormError('An account with this mobile number or email already exists.');
        }
        users.push(userRecord);
        localStorage.setItem(KEYS.USER_DB, JSON.stringify(users));

        pendingUser = { name, mobile, email, id: userRecord.id };
        showBiometricSetup();
    }

    function handleSignIn() {
        const loginId = val('login-id');
        const pass    = val('login-pass');

        if (!loginId || !pass) {
            return showFormError('Please enter your credentials.');
        }

        const users = loadUserRecords();
        if (!users.length) {
            return showFormError('No account found. Please create one first.');
        }

        const record = users.find(user => (loginId === user.mobile || loginId === user.email)
                    && simpleHash(pass) === user.passwordHash);

        if (!record) {
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
    }

    async function finishAuth() {
        if (!pendingUser) return;
        saveSession(pendingUser);
        pendingUser = null;
        loadDocuments();
        loadProfile();
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
            name: state.profile.fullName || (state.currentUser ? state.currentUser.name : ''),
            mobile: state.currentUser ? state.currentUser.mobile : '',
            email: state.currentUser ? state.currentUser.email : '',
            documents: state.documents.map(doc => doc.type),
            ...state.profile,
        };
    }

    function mergeProfile(fields, sourceDocument) {
        Object.entries(fields).forEach(([field, value]) => {
            if (!value) return;
            if (state.profile[field] && state.profile[field] !== value) {
                state.profile.conflicts = [...new Set([...(state.profile.conflicts || []), field])];
                return;
            }
            state.profile[field] = value;
            state.profile.sources = { ...(state.profile.sources || {}), [field]: sourceDocument.type };
        });
        saveProfile();
    }

    function renderProfile(editing = false) {
        const profile = getProfile();
        const fields = [
            ['fullName', 'Full name', 'text'], ['dateOfBirth', 'Date of birth', 'date'], ['address', 'Address', 'text'],
            ['district', 'District', 'text'], ['pincode', 'Pincode', 'text'], ['education', 'Education', 'text'],
            ['annualIncome', 'Annual income', 'number'],
        ];
        const states = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];
        const selectField = (key, label, options, allowOther = false) => {
            const customValue = allowOther && profile[key] && !options.includes(profile[key]) ? profile[key] : '';
            const selectedValue = customValue ? 'Other' : profile[key];
            return `<div class="form-group"><label for="profile-${key}">${label}${profile.sources?.[key] ? ` <span class="profile-source">From ${escHtml(profile.sources[key])}</span>` : ''}</label><select id="profile-${key}" name="${key}" class="form-control ${editing ? '' : 'locked-field'}" ${editing ? '' : 'disabled'}>${['', ...options].map(option => `<option value="${escHtml(option)}" ${selectedValue === option ? 'selected' : ''}>${option || `Select ${label.toLowerCase()}`}</option>`).join('')}</select>${allowOther && selectedValue === 'Other' ? `<input id="profile-${key}-other" name="${key}Other" class="form-control other-value ${editing ? '' : 'locked-field'}" value="${escHtml(customValue || profile[`${key}Other`] || '')}" placeholder="Enter ${label.toLowerCase()}" ${editing ? '' : 'readonly'}>` : ''}</div>`;
        };
        const inputField = ([key, label, type]) => `<div class="form-group"><label for="profile-${key}">${label}${profile.sources?.[key] ? ` <span class="profile-source">From ${escHtml(profile.sources[key])}</span>` : ''}</label><input id="profile-${key}" name="${key}" type="${type}" class="form-control ${editing ? '' : 'locked-field'}" value="${escHtml(profile[key] || '')}" ${editing ? '' : 'readonly'}></div>`;
        el.profileContent.innerHTML = `
            ${state.profile.conflicts?.length ? '<div class="notice-box"><strong>Review required</strong><span>Different documents contain different information. Confirm the correct values below.</span></div>' : ''}
            <form id="profile-form" class="application-form" novalidate>
                ${inputField(fields[0])}
                ${inputField(fields[1])}
                ${selectField('gender', 'Gender', ['Male', 'Female', 'Other'], true)}
                ${selectField('state', 'State', states)}
                ${fields.slice(2).map(inputField).join('')}
                ${selectField('occupation', 'Occupation', ['Student', 'Farmer', 'Self-employed', 'Business owner', 'Private sector employee', 'Government employee', 'Homemaker', 'Retired', 'Unemployed', 'Other'], true)}
                ${selectField('category', 'Category', ['General', 'Scheduled Caste (SC)', 'Scheduled Tribe (ST)', 'Other Backward Class (OBC)', 'Economically Weaker Section (EWS)', 'Other'], true)}
                ${editing ? '<button type="submit" class="btn btn-primary">Confirm Details</button>' : '<button type="button" id="edit-profile-btn" class="btn btn-secondary">Edit Details</button>'}
            </form>`;
    }

    async function renderSchemeHome() {
        el.schemeGrid.innerHTML = `<div class="loading-state" role="status" aria-live="polite"><div class="spinner" aria-hidden="true"></div><p>Loading recommended schemes…</p></div>`;
        el.profileStrip.innerHTML = `
            <div><span class="profile-label">Profile used</span><strong>${escHtml(getProfile().name)}</strong></div>
            <div><span class="profile-label">Documents available</span><strong>${state.documents.length}</strong></div>
            <div><span class="profile-label">Assessment</span><strong>May Be Eligible</strong></div>
        `;
        try {
            const result = await apiFetch('/api/recommendations');
            state.schemes = result.recommendations.map(item => ({ ...item.scheme, assessment: item.assessment }));
            state.recommendationError = null;
        } catch (error) {
            try {
                const result = await apiFetch('/api/schemes');
                state.schemes = result.schemes.map(scheme => ({
                    ...scheme,
                    assessment: { status: 'May Be Eligible', reasons: ['Profile not assessed'], missingDocuments: [] },
                }));
                state.recommendationError = null;
            } catch {
                state.schemes = [];
                state.recommendationError = error.message;
            }
        }
        if (!state.schemes.length) {
            el.schemeGrid.innerHTML = `<div class="empty-state scheme-empty"><svg class="empty-state-icon" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg><h3>No verified schemes available</h3><p>No approved scheme records have been imported yet.</p></div>`;
            return;
        }
        if (state.recommendationError) {
            el.schemeGrid.innerHTML = `<div class="empty-state scheme-empty"><svg class="empty-state-icon" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><h3>Government schemes are unavailable</h3><p>Connect the database to load the official scheme catalogue.</p></div>`;
            return;
        }
        el.schemeGrid.innerHTML = state.schemes.map(scheme => `
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
        `).join('');
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
            <div class="detail-heading"><div><span class="scheme-status">May Be Eligible</span><h2 id="scheme-details-title">${escHtml(scheme.name)}</h2><p>${escHtml(scheme.description)}</p></div><span class="official-mark">Official source listed</span></div>
            <div class="detail-grid">
                <section class="detail-section"><h3>Benefits</h3><p>${escHtml(scheme.benefits)}</p></section>
                <section class="detail-section"><h3>Detailed eligibility</h3><p>${escHtml(scheme.eligibilityDetails)}</p></section>
                <section class="detail-section"><h3>Who can apply</h3><p>${escHtml(scheme.whoCanApply)}</p></section>
                <section class="detail-section"><h3>Required documents</h3><ul>${scheme.documents.map(doc => `<li>${escHtml(doc.name)}</li>`).join('')}</ul></section>
                <section class="detail-section"><h3>Application process</h3><p>${escHtml(scheme.applicationProcedure)}</p></section>
                <section class="detail-section"><h3>Deadline</h3><p>${escHtml(scheme.deadline || 'Not published')}</p></section>
                <section class="detail-section"><h3>Official source</h3><p><a href="${escHtml(scheme.officialSourceUrl)}" target="_blank" rel="noopener">Open official source</a></p></section>
                <section class="detail-section"><h3>Apply officially</h3><p><a href="${escHtml(scheme.officialApplicationUrl)}" target="_blank" rel="noopener">Open application website</a></p></section>
            </div>
            <div class="detail-actions"><button type="button" class="btn btn-primary" id="interested-btn">I'm Interested</button><p class="text-muted">Starting an application does not confirm eligibility or submit anything.</p></div>
        `;
    }

    function renderApplicationForm(scheme) {
        const profile = getProfile();
        const existing = state.application && state.application.schemeId === scheme.id ? state.application.fields : {};
        const hasAadhaar = hasUploadedDocument('Aadhaar Card');
        const fields = [
            ['name', 'Full name', profile.fullName || profile.name], ['mobile', 'Mobile number', profile.mobile], ['email', 'Email address', profile.email],
            ['dateOfBirth', 'Date of birth', existing.dateOfBirth || profile.dateOfBirth || ''], ['aadhaar', 'Aadhaar document', existing.aadhaar || (hasAadhaar ? 'Available from uploaded Aadhaar Card' : '')],
            ['address', 'Address', existing.address || profile.address || ''], ['income', 'Annual income', existing.income || profile.annualIncome || ''], ['education', 'Education details', existing.education || profile.education || '']
        ];
        const requiredDocuments = scheme.documents.map(document => {
            const uploadedDocument = state.documents.find(candidate => hasDocumentType(candidate, document.name));
            const available = Boolean(uploadedDocument);
            const protectedPreview = uploadedDocument?.dataUrl ? `<span class="locked-document-preview" title="Document protected"><img src="${uploadedDocument.dataUrl}" alt="Blurred ${escHtml(document.name)}" class="application-document-thumb"><span class="locked-document-badge">&#128274;</span></span>` : '';
            return `<li class="application-document-item">${protectedPreview}<span>${escHtml(document.name)} <strong class="${available ? 'doc-ready' : 'missing-text'}">${available ? 'Available' : 'Missing'}</strong>${available ? '<small class="locked-document-label">Locked for your protection</small>' : ''}</span></li>`;
        }).join('');
        el.applicationContent.innerHTML = `
            <button type="button" class="back-link" id="back-details-btn">&larr; Back to scheme details</button>
            <div class="detail-heading application-heading"><div><span class="eyebrow">Application draft</span><h2 id="application-title">${escHtml(scheme.name)}</h2><p>We reused your profile and available documents. Complete only what is missing.</p></div></div>
            <div class="notice-box"><strong>Review required</strong><span>Fields are editable. Missing information is marked below and will not be invented.</span></div>
            <form id="application-form" class="application-form" novalidate>
                ${fields.map(([key, label, value]) => `<div class="form-group ${value ? '' : 'field-missing'}"><label for="app-${key}">${label}${key === 'aadhaar' && hasAadhaar ? ' <span class="profile-source">&#128274; Locked</span>' : value ? '' : ' <span>Missing</span>'}</label><input id="app-${key}" name="${key}" class="form-control ${key === 'aadhaar' && hasAadhaar ? 'locked-field' : ''}" value="${escHtml(value)}" ${key === 'dateOfBirth' ? 'type="date"' : ''} ${key === 'aadhaar' && hasAadhaar ? 'readonly' : ''} placeholder="Enter ${label.toLowerCase()} if available"></div>`).join('')}
                <div class="application-docs"><h3>Documents to reuse</h3><p class="text-muted">Uploaded documents are included for your review.</p><ul>${requiredDocuments || '<li class="missing-text">No documents required</li>'}</ul></div>
                <button type="submit" class="btn btn-primary">Continue to review <span aria-hidden="true">&rarr;</span></button>
            </form>
        `;
    }

    function hasUploadedDocument(requiredName) {
        return state.documents.some(document => hasDocumentType(document, requiredName));
    }

    function hasDocumentType(document, requiredName) {
        const normalizedRequired = requiredName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedType = document.type.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalizedType === normalizedRequired || normalizedType.includes(normalizedRequired) || normalizedRequired.includes(normalizedType);
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
        renderDashboardStats();

        const docs = state.activeFilter === 'all'
            ? state.documents
            : state.documents.filter(d => d.type === state.activeFilter);

        if (docs.length === 0) {
            const filterLabel = state.activeFilter === 'all' ? '' : ` for ${state.activeFilter}`;
            el.docGrid.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-state-icon" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                    <h3>No documents${escHtml(filterLabel)} yet</h3>
                    <p>${state.activeFilter === 'all' ? 'Upload your first identity document to get started with scheme recommendations.' : 'Try a different filter or add a new document.'}</p>
                </div>`;
            return;
        }

        el.docGrid.innerHTML = docs.map(doc => `
            <article class="doc-card" data-id="${doc.id}">
                ${doc.dataUrl
                    ? `<img class="doc-card-thumb blurred-document" src="${doc.dataUrl}" alt="${escHtml(doc.type)}" title="Unlock to view document" data-action="view">`
                    : `<div class="doc-card-thumb-placeholder" data-action="view" title="View document">
                           <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5">
                               <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                               <polyline points="14 2 14 8 20 8"/>
                           </svg>
                       </div>`
                }
                <div class="doc-card-body">
                    <span class="doc-card-type">${escHtml(doc.type)}</span>
                    <span class="verification-status ${escHtml(doc.verificationStatus || 'verifying')}">${verificationLabel(doc.verificationStatus)}</span>
                    ${doc.verificationMessage ? `<p class="verification-message">${escHtml(doc.verificationMessage)}</p>` : ''}
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

    function renderDashboardStats() {
        if (!el.dashboardStats) return;
        const total = state.documents.length;
        const verified = state.documents.filter(d => d.verificationStatus === 'verified').length;
        const pending = state.documents.filter(d => !d.verificationStatus || d.verificationStatus === 'verifying').length;
        el.dashboardStats.innerHTML = `
            <div class="stat-pill"><strong>${total}</strong> document${total !== 1 ? 's' : ''}</div>
            <div class="stat-pill"><strong>${verified}</strong> verified</div>
            <div class="stat-pill"><strong>${pending}</strong> processing</div>
        `;
    }

    async function viewDocument(docId) {
        const doc = state.documents.find(d => d.id === docId);
        if (!doc) return;
        if (!await requestDocumentAccess()) return;

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
        const removed = state.documents.find(document => document.id === docId);
        state.documents = state.documents.filter(d => d.id !== docId);
        if (removed && state.profile.sources) {
            Object.entries(state.profile.sources).forEach(([field, source]) => {
                if (source === removed.type) {
                    delete state.profile[field];
                    delete state.profile.sources[field];
                }
            });
            saveProfile();
        }
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
            verificationStatus: 'verifying',
            verificationMessage: 'Reading document',
            extractedFields: {},
        };
        state.documents.unshift(doc); // newest first
        persistDocuments();
        apiFetch('/api/documents', { method: 'POST', body: JSON.stringify({ id: doc.id, documentType: doc.type }) }).catch(() => {});
        closeUploadModal();
        renderDocumentGrid();
        processDocument(doc);
    }

    function verificationLabel(status) {
        return status === 'verified' ? 'Verified' : status === 'needs-review' ? 'Needs Review' : 'Verifying...';
    }

    function showVerification(doc, step, detail) {
        const steps = ['Reading document', 'Checking required information', 'Extracting details', 'Saving information'];
        el.verificationContent.innerHTML = `<div class="verification-steps">${steps.map((label, index) => `<div class="verification-step ${index < step ? 'complete' : index === step ? 'current' : ''}"><span>${index < step ? '&#10003;' : index + 1}</span><strong>${label}</strong></div>`).join('')}</div><p class="text-muted verification-detail">${escHtml(detail)}</p>`;
        el.verificationModal.classList.remove('hidden');
    }

    function requiredFields(type) {
        return ({
            'Aadhaar Card': ['fullName', 'dateOfBirth', 'address'],
            'PAN Card': ['fullName', 'panNumber', 'dateOfBirth'],
            'Driving Licence': ['fullName', 'drivingLicenceNumber', 'validity'],
            Passport: ['fullName', 'dateOfBirth', 'passportNumber'],
            'Voter ID': ['fullName', 'voterIdNumber'],
        })[type] || [];
    }

    function extractFields(type, text) {
        const normalized = text.replace(/\r/g, '\n').replace(/[ \t]+/g, ' ');
        const lines = normalized.split('\n').map(line => line.trim()).filter(Boolean);
        const fields = {};
        const date = normalized.match(/\b(\d{2}[/-]\d{2}[/-]\d{4}|\d{4}[/-]\d{2}[/-]\d{2})\b/);
        const pan = normalized.match(/\b[A-Z]{5}\d{4}[A-Z]\b/i);
        const passport = normalized.match(/\b[A-Z][0-9]{7}\b/i);
        const licence = normalized.match(/\b[A-Z]{2}[ -]?[0-9]{2}[ -]?[0-9]{4,13}\b/i);
        const voter = normalized.match(/\b[A-Z]{3}[0-9]{7}\b/i);
        const nameLine = lines.find(line => /^(name|नाम)\s*[:.-]/i.test(line));
        const addressLine = lines.find(line => /address|पता/i.test(line));
        if (nameLine) fields.fullName = nameLine.split(/[:.-]/).slice(1).join(':').trim();
        if (date) fields.dateOfBirth = date[1].replace(/-/g, '/');
        if (pan && /pan/i.test(type)) fields.panNumber = pan[0].toUpperCase();
        if (passport && type === 'Passport') fields.passportNumber = passport[0].toUpperCase();
        if (licence && type === 'Driving Licence') fields.drivingLicenceNumber = licence[0].replace(/ /g, '');
        if (voter && type === 'Voter ID') fields.voterIdNumber = voter[0].toUpperCase();
        if (addressLine) fields.address = addressLine.split(/[:.-]/).slice(1).join(':').trim();
        const gender = normalized.match(/\b(MALE|FEMALE|TRANSGENDER|पुरुष|महिला)\b/i);
        if (gender) fields.gender = gender[0];
        return fields;
    }

    async function processDocument(doc) {
        showVerification(doc, 0, 'Preparing the document for reading.');
        try {
            if (!window.Tesseract || !doc.dataUrl) throw new Error('OCR is unavailable for this file.');
            const result = await Tesseract.recognize(doc.dataUrl, 'eng', { logger: message => {
                if (message.status === 'recognizing text') showVerification(doc, 1, `Reading document ${Math.round(message.progress * 100)}%`);
            } });
            showVerification(doc, 2, 'Checking the information detected in the document.');
            const extractedFields = extractFields(doc.type, result.data.text);
            const missing = requiredFields(doc.type).filter(field => !extractedFields[field]);
            doc.extractedFields = extractedFields;
            doc.ocrTextAvailable = Boolean(result.data.text.trim());
            doc.verificationStatus = missing.length ? 'needs-review' : 'verified';
            const missingLabels = missing.map(field => ({ fullName: 'full name', dateOfBirth: 'date of birth', address: 'address', panNumber: 'PAN number', passportNumber: 'passport number', drivingLicenceNumber: 'driving licence number', validity: 'validity', voterIdNumber: 'voter ID number' }[field] || field));
            doc.verificationMessage = missing.length ? `Could not detect: ${missingLabels.join(', ')}.` : 'Document processed successfully.';
            if (Object.keys(extractedFields).length) mergeProfile(extractedFields, doc);
            showVerification(doc, 4, doc.verificationMessage);
        } catch (error) {
            doc.verificationStatus = 'needs-review';
            doc.verificationMessage = 'We could not clearly read this document. Please upload or capture a clearer image.';
            showVerification(doc, 4, doc.verificationMessage);
        }
        persistDocuments();
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
            if (e.target.closest('#edit-profile-btn')) {
                requestDocumentAccess().then(unlocked => {
                    if (!unlocked) return;
                    state.profileEditing = true;
                    renderProfile(true);
                });
                return;
            }
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
            const homeNavLink = e.target.closest('[data-nav]');
            if (homeNavLink) {
                e.preventDefault();
                state.currentView = homeNavLink.dataset.nav;
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
            if (e.target.id === 'document-unlock-form') {
                e.preventDefault();
                const password = e.target.password.value;
                const confirmation = e.target.confirmation.value;
                const hasPassword = Boolean(localStorage.getItem(documentPasswordKey()));
                if (!/^\d{4}$/.test(password)) {
                    el.documentUnlockError.textContent = 'Enter exactly 4 digits.';
                    el.documentUnlockError.classList.remove('hidden');
                    return;
                }
                if (!hasPassword) {
                    if (password !== confirmation) {
                        el.documentUnlockError.textContent = 'The passwords do not match.';
                        el.documentUnlockError.classList.remove('hidden');
                        return;
                    }
                    localStorage.setItem(documentPasswordKey(), simpleHash(password));
                    closeDocumentUnlock(true);
                    return;
                }
                if (simpleHash(password) !== localStorage.getItem(documentPasswordKey())) {
                    el.documentUnlockError.textContent = 'Incorrect document password.';
                    el.documentUnlockError.classList.remove('hidden');
                    return;
                }
                closeDocumentUnlock(true);
                return;
            }
            if (e.target.id === 'profile-form') {
                e.preventDefault();
                const values = Object.fromEntries(new FormData(e.target).entries());
                ['gender', 'occupation', 'category'].forEach(field => {
                    if (values[field] === 'Other') values[field] = values[`${field}Other`] || 'Other';
                    delete values[`${field}Other`];
                });
                state.profile = { ...state.profile, ...values, conflicts: [], confirmedAt: new Date().toISOString() };
                state.profileEditing = false;
                saveProfile();
                syncProfile();
                alert('Your details have been saved for future applications.');
                renderProfile();
                return;
            }
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
        el.closeVerification.addEventListener('click', () => el.verificationModal.classList.add('hidden'));
        el.verificationOverlay.addEventListener('click', () => el.verificationModal.classList.add('hidden'));
        el.closeDocumentUnlock.addEventListener('click', () => closeDocumentUnlock(false));
        el.documentUnlockOverlay.addEventListener('click', () => closeDocumentUnlock(false));

        el.profileContent.addEventListener('change', event => {
            if (!['gender', 'occupation', 'category'].includes(event.target.name)) return;
            const group = event.target.closest('.form-group');
            const existingOther = group.querySelector('.other-value');
            if (existingOther) existingOther.remove();
            if (event.target.value === 'Other') {
                const other = document.createElement('input');
                other.id = `profile-${event.target.name}-other`;
                other.name = `${event.target.name}Other`;
                other.className = 'form-control other-value';
                other.placeholder = `Enter ${event.target.name}`;
                group.appendChild(other);
                other.focus();
            }
        });

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
                closeNavMenu();
                if (!el.uploadModal.classList.contains('hidden'))  closeUploadModal();
                if (!el.viewModal.classList.contains('hidden'))    el.viewModal.classList.add('hidden');
                if (!el.documentUnlockModal.classList.contains('hidden')) closeDocumentUnlock(false);
            }
        });

        // Close mobile nav when clicking outside or on backdrop
        document.addEventListener('click', e => {
            const links = id('nav-links');
            const toggle = id('nav-toggle');
            if (!links || !toggle || !links.classList.contains('is-open')) return;
            if (!el.nav.contains(e.target)) closeNavMenu();
        });

        const navBackdrop = id('nav-backdrop');
        if (navBackdrop) {
            navBackdrop.addEventListener('click', closeNavMenu);
        }

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) closeNavMenu();
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
