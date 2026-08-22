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
        chatMessages: [],
    };

    const API_BASE = window.SUGAM_SEVA_API_BASE || '';

    // ============================================================
    //  Document Guide Data
    // ============================================================
    const DOCUMENT_GUIDE = {
        'Aadhaar Card': {
            title: 'Aadhaar Card',
            description: 'A 12-digit unique identity number issued by UIDAI (Unique Identification Authority of India). It is required for most government services and schemes.',
            where: 'Apply at your nearest Aadhaar Enrolment Centre or update details online through the UIDAI portal.',
            url: 'https://uidai.gov.in/',
            label: 'UIDAI — Official Government Website',
            stateSpecific: false,
        },
        'PAN Card': {
            title: 'PAN Card',
            description: 'Permanent Account Number issued by the Income Tax Department. Used for financial transactions and tax filing.',
            where: 'Apply online through NSDL (Protean) or UTIITSL. Processing takes about 15–20 days.',
            url: 'https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html',
            label: 'Protean (NSDL) — Official Government Website',
            stateSpecific: false,
        },
        'Driving Licence': {
            title: 'Driving Licence',
            description: 'A valid driving licence issued by your Regional Transport Office (RTO) is required to operate motor vehicles legally.',
            where: 'Apply through the Parivahan Sewa portal. You can apply for a learner\u2019s licence first, then a permanent one.',
            url: 'https://parivahan.gov.in/parivahan/',
            label: 'Parivahan Sewa — Official Government Website',
            stateSpecific: false,
        },
        'Disability Certificate': {
            title: 'Disability Certificate (UDID)',
            description: 'A certificate issued under the UDID (Unique Disability ID) project by the Department of Empowerment of Persons with Disabilities. Required for disability-related benefits and reservations.',
            where: 'Apply through the Swavlamban / UDID portal. You can also visit your District Disability Rehabilitation Centre.',
            url: 'https://udid.gov.in/',
            label: 'UDID Swavlamban — Official Government Website',
            stateSpecific: false,
        },
        'Voter ID': {
            title: 'Voter ID Card (EPIC)',
            description: 'Electors Photo Identity Card issued by the Election Commission of India. Required to vote in elections.',
            where: 'Apply online through the Voters\u2019 Service Portal or visit your local Electoral Registration Office.',
            url: 'https://voters.eci.gov.in/',
            label: 'Election Commission of India — Official Government Website',
            stateSpecific: false,
        },
        'Passport': {
            title: 'Passport',
            description: 'An official travel document issued by the Ministry of External Affairs for international travel.',
            where: 'Apply through the Passport Seva portal. Book an appointment at your nearest Passport Seva Kendra.',
            url: 'https://www.passportindia.gov.in/',
            label: 'Passport Seva — Official Government Website',
            stateSpecific: false,
        },
        'Income Certificate': {
            title: 'Income Certificate',
            description: 'An official document certifying your annual household income. Required for many scholarship, subsidy, and welfare schemes.',
            where: 'Apply through your State Government\u2019s official portal. This is a state-level document.',
            url: null,
            label: null,
            stateSpecific: true,
            statePortals: {
                'Andhra Pradesh': { url: 'https://meeseva.gov.in/ap/home.do', label: 'MeeSeva — Andhra Pradesh' },
                'Bihar': { url: 'https://serviceonline.gov.in/bihar/', label: 'Service Online — Bihar' },
                'Chhattisgarh': { url: 'https://www.cgstate.gov.in/', label: 'CG State Portal' },
                'Delhi': { url: 'https://delhigovt.nic.in/', label: 'Delhi Government Portal' },
                'Gujarat': { url: 'https://digitalgujarat.gov.in/', label: 'Digital Gujarat' },
                'Haryana': { url: 'https://csgharana.gov.in/', label: 'HarChawb — Haryana' },
                'Karnataka': { url: 'https://sevasindhu.karnataka.gov.in/', label: 'Seva Sindhu — Karnataka' },
                'Kerala': { url: 'https://edistrict.kerala.gov.in/', label: 'e-District — Kerala' },
                'Madhya Pradesh': { url: 'https://mp.gov.in/', label: 'MP State Portal' },
                'Maharashtra': { url: 'https://aaplesarkar.mahaonline.gov.in/', label: 'Aaple Sarkar — Maharashtra' },
                'Odisha': { url: 'https://edistrict.odisha.gov.in/', label: 'e-District — Odisha' },
                'Punjab': { url: 'https://connect.punjab.gov.in/', label: 'Connect — Punjab' },
                'Rajasthan': { url: 'https://sso.rajasthan.gov.in/', label: 'SSO — Rajasthan' },
                'Tamil Nadu': { url: 'https://www.tnesevai.tn.gov.in/', label: 'TN e-Sevai' },
                'Telangana': { url: 'https://meeSeva.telangana.gov.in/', label: 'MeeSeva — Telangana' },
                'Uttar Pradesh': { url: 'https://edistrict.up.gov.in/', label: 'e-District — Uttar Pradesh' },
                'West Bengal': { url: 'https://wbpdw.gov.in/', label: 'West Bengal Portal' },
            },
        },
        'Education Certificate': {
            title: 'Education Certificate',
            description: 'Marksheets, degree certificates, or provisional certificates issued by recognised educational institutions or boards.',
            where: 'Obtain from your school, college, or university. DigiLocker may also have digitally verified copies.',
            url: 'https://www.digilocker.gov.in/',
            label: 'DigiLocker — Official Government Website',
            stateSpecific: false,
        },
        'Birth Certificate': {
            title: 'Birth Certificate',
            description: 'An official record of birth issued by the Registrar General of India or local municipal authority.',
            where: 'Apply through your State\u2019s Civil Registration System (CRS) portal or local municipal corporation.',
            url: null,
            label: null,
            stateSpecific: true,
            statePortals: {
                'Andhra Pradesh': { url: 'https://meeSeva.gov.in/ap/home.do', label: 'MeeSeva — Andhra Pradesh' },
                'Bihar': { url: 'https://serviceonline.gov.in/bihar/', label: 'Service Online — Bihar' },
                'Delhi': { url: 'https://delhigovt.nic.in/', label: 'Delhi Government Portal' },
                'Gujarat': { url: 'https://digitalgujarat.gov.in/', label: 'Digital Gujarat' },
                'Karnataka': { url: 'https://sevasindhu.karnataka.gov.in/', label: 'Seva Sindhu — Karnataka' },
                'Kerala': { url: 'https://edistrict.kerala.gov.in/', label: 'e-District — Kerala' },
                'Madhya Pradesh': { url: 'https://mp.gov.in/', label: 'MP State Portal' },
                'Maharashtra': { url: 'https://aaplesarkar.mahaonline.gov.in/', label: 'Aaple Sarkar — Maharashtra' },
                'Rajasthan': { url: 'https://sso.rajasthan.gov.in/', label: 'SSO — Rajasthan' },
                'Tamil Nadu': { url: 'https://www.tnesevai.tn.gov.in/', label: 'TN e-Sevai' },
                'Telangana': { url: 'https://meeSeva.telangana.gov.in/', label: 'MeeSeva — Telangana' },
                'Uttar Pradesh': { url: 'https://edistrict.up.gov.in/', label: 'e-District — Uttar Pradesh' },
                'West Bengal': { url: 'https://wbpdw.gov.in/', label: 'West Bengal Portal' },
            },
        },
        'Ration Card': {
            title: 'Ration Card',
            description: 'A document issued under the National Food Security Act (NFSA) for subsidised food grains. Also used as identity and address proof.',
            where: 'Apply through your State\u2019s Food and Civil Supplies department portal.',
            url: null,
            label: null,
            stateSpecific: true,
            statePortals: {
                'Andhra Pradesh': { url: 'https://epds.apfood.gov.in/', label: 'ePDS — Andhra Pradesh' },
                'Bihar': { url: 'https://epds.bihar.gov.in/', label: 'ePDS — Bihar' },
                'Delhi': { url: 'https://delhigovt.nic.in/', label: 'Delhi Government Portal' },
                'Gujarat': { url: 'https://digitalgujarat.gov.in/', label: 'Digital Gujarat' },
                'Karnataka': { url: 'https://ahara.kar.nic.in/', label: 'AHARA — Karnataka' },
                'Kerala': { url: 'https://kfood.kerala.gov.in/', label: 'Food Kerala' },
                'Madhya Pradesh': { url: 'https://mp.gov.in/', label: 'MP State Portal' },
                'Maharashtra': { url: 'https://aaplesarkar.mahaonline.gov.in/', label: 'Aaple Sarkar — Maharashtra' },
                'Rajasthan': { url: 'https://sso.rajasthan.gov.in/', label: 'SSO — Rajasthan' },
                'Tamil Nadu': { url: 'https://www.tnesevai.tn.gov.in/', label: 'TN e-Sevai' },
                'Telangana': { url: 'https://epds.telangana.gov.in/', label: 'ePDS — Telangana' },
                'Uttar Pradesh': { url: 'https://fcs.up.gov.in/', label: 'FCS — Uttar Pradesh' },
                'West Bengal': { url: 'https://wbpds.wb.gov.in/', label: 'wbpDS — West Bengal' },
            },
        },
        'EWS Certificate': {
            title: 'EWS Certificate (Economically Weaker Section)',
            description: 'A certificate confirming your family\u2019s economic status for reservation under the 10% EWS quota.',
            where: 'Apply through your State Government\u2019s official portal. Requirements vary by state.',
            url: null,
            label: null,
            stateSpecific: true,
            statePortals: {
                'Delhi': { url: 'https://edistrict.delhigovt.nic.in/', label: 'e-District — Delhi' },
                'Gujarat': { url: 'https://digitalgujarat.gov.in/', label: 'Digital Gujarat' },
                'Karnataka': { url: 'https://sevasindhu.karnataka.gov.in/', label: 'Seva Sindhu — Karnataka' },
                'Kerala': { url: 'https://edistrict.kerala.gov.in/', label: 'e-District — Kerala' },
                'Madhya Pradesh': { url: 'https://mp.gov.in/', label: 'MP State Portal' },
                'Maharashtra': { url: 'https://aaplesarkar.mahaonline.gov.in/', label: 'Aaple Sarkar — Maharashtra' },
                'Rajasthan': { url: 'https://sso.rajasthan.gov.in/', label: 'SSO — Rajasthan' },
                'Tamil Nadu': { url: 'https://www.tnesevai.tn.gov.in/', label: 'TN e-Sevai' },
                'Uttar Pradesh': { url: 'https://edistrict.up.gov.in/', label: 'e-District — Uttar Pradesh' },
                'West Bengal': { url: 'https://wbpdw.gov.in/', label: 'West Bengal Portal' },
            },
        },
    };

    function getDocGuideData(docType) {
        const guide = DOCUMENT_GUIDE[docType];
        if (!guide) return null;
        if (guide.stateSpecific && guide.statePortals) {
            const userState = state.profile.state || '';
            const portal = guide.statePortals[userState];
            if (portal) {
                return { ...guide, url: portal.url, label: portal.label };
            }
            // Fallback: show the first available portal
            const firstKey = Object.keys(guide.statePortals)[0];
            const fallback = guide.statePortals[firstKey];
            return { ...guide, url: fallback.url, label: `${fallback.label} (example — select your own state)`, fallback: true };
        }
        return guide;
    }

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
        chatForm: id('chat-form'),
        chatInput: id('chat-input'),
        chatMessages: id('chat-messages'),
        chatSendBtn: id('chat-send-btn'),
        chatFab: id('chat-fab'),
        chatbotPanel: id('chatbot-panel'),
        chatbotCloseBtn: id('chatbot-close-btn'),
        schemeDetails: id('scheme-details-content'),
        applicationContent: id('application-content'),
        profileContent: id('profile-content'),
        backHomeBtn:   id('back-home-btn'),

        // Upload Modal
        uploadModal:   id('upload-modal'),
        modalOverlay:  id('modal-overlay'),
        closeModalBtn: id('close-modal-btn'),
        docTypeSelect: id('doc-type'),
        documentPicker: id('document-picker'),
        documentPickerTrigger: id('document-picker-trigger'),
        documentPickerLabel: id('document-picker-label'),
        documentPickerMenu: id('document-picker-menu'),
        otherDocumentNameGroup: id('other-document-name-group'),
        otherDocumentName: id('other-document-name'),
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

        // Document guide
        docGuide:      id('doc-guide'),
        docGuideToggle: id('doc-guide-toggle'),
        docGuideCard:  id('doc-guide-card'),
        docGuideTitle: id('doc-guide-title'),
        docGuideDesc:  id('doc-guide-desc'),
        docGuideWhereText: id('doc-guide-where-text'),
        docGuideLink:  id('doc-guide-link'),

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

        // Anthem
        anthemToggleBtn: id('anthem-toggle-btn'),
        nationalAnthemAudio: id('national-anthem-audio'),
    };

    function id(s) { return document.getElementById(s); }

    // ============================================================
    //  Bootstrap
    // ============================================================
    document.addEventListener('DOMContentLoaded', boot);

    function boot() {
        loadSession();
        state.isSignUpMode = !state.currentUser && loadUserRecords().length === 0;
        if (state.currentUser) state.currentView = 'home';
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
            dateOfBirth: apiDate(state.profile.dateOfBirth),
            state: state.profile.state || null,
            district: state.profile.district || null,
            income: state.profile.annualIncome || null,
            education: state.profile.education || null,
            occupation: state.profile.occupation || null,
        }) }).catch(() => {});
    }

    function syncDocumentMetadata() {
        return Promise.all(state.documents.map(document => apiFetch('/api/documents', { method: 'POST', body: JSON.stringify({ id: document.id, documentType: document.type, verificationStatus: document.verificationStatus === 'verified' ? 'verified' : 'unverified' }) }).catch(() => {})));
    }

    function apiDate(value) {
        if (!value) return null;
        const match = String(value).match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
        return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
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
            <div id="nav-links" class="nav-links" style="flex: 1; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button id="home-nav-btn" class="nav-link ${state.currentView === 'home' ? 'active' : ''}">Home</button>
                    <button id="documents-nav-btn" class="nav-link ${state.currentView === 'documents' ? 'active' : ''}">My Documents</button>
                    <div class="nav-language-dropdown" role="group" aria-label="Language selection">
                        <select id="language-select" class="sr-only" tabindex="-1" aria-hidden="true">
                            <option value="en" ${state.language === 'en' ? 'selected' : ''}>English</option>
                            <option value="hi" ${state.language === 'hi' ? 'selected' : ''}>Hindi</option>
                            <option value="kn" ${state.language === 'kn' ? 'selected' : ''}>Kannada</option>
                        </select>
                        <button type="button" id="lang-trigger" class="nav-link nav-lang-trigger" aria-haspopup="listbox" aria-expanded="false" aria-label="Choose language">
                            <svg class="nav-lang-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                            <span id="lang-trigger-label">${state.language === 'hi' ? 'हिन्दी' : state.language === 'kn' ? 'ಕನ್ನಡ' : 'English'}</span>
                            <svg class="nav-lang-chevron" viewBox="0 0 12 8" width="10" height="8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 1.5l5 5 5-5"/></svg>
                        </button>
                        <ul id="lang-menu" class="nav-lang-menu" role="listbox" aria-label="Choose language" hidden>
                            <li role="option" data-lang="en" class="nav-lang-option ${state.language === 'en' ? 'active' : ''}" aria-selected="${state.language === 'en' ? 'true' : 'false'}">English</li>
                            <li role="option" data-lang="hi" class="nav-lang-option ${state.language === 'hi' ? 'active' : ''}" aria-selected="${state.language === 'hi' ? 'true' : 'false'}">हिन्दी</li>
                            <li role="option" data-lang="kn" class="nav-lang-option ${state.language === 'kn' ? 'active' : ''}" aria-selected="${state.language === 'kn' ? 'true' : 'false'}">ಕನ್ನಡ</li>
                        </ul>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <button id="profile-nav-btn" class="nav-link nav-profile-btn ${state.currentView === 'profile' ? 'active' : ''}" aria-label="My Profile">
                        ${state.profile && state.profile.photo ? 
                            `<img src="${escHtml(state.profile.photo)}" alt="Profile" class="nav-profile-img">` : 
                            `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`
                        }
                    </button>
                </div>
            </div>
        `;
        id('home-nav-btn').addEventListener('click', () => { closeNavMenu(); state.currentView = 'home'; state.selectedScheme = null; route(); });
        id('documents-nav-btn').addEventListener('click', () => { closeNavMenu(); state.currentView = 'documents'; state.selectedScheme = null; route(); });
        id('profile-nav-btn').addEventListener('click', () => { closeNavMenu(); state.currentView = 'profile'; route(); });
        id('nav-toggle').addEventListener('click', toggleNavMenu);
        el.languageSelect = id('language-select');
        const langTrigger = id('lang-trigger');
        const langMenu = id('lang-menu');
        const langLabel = id('lang-trigger-label');
        const langNames = { en: 'English', hi: 'हिन्दी', kn: 'ಕನ್ನಡ' };

        function closeLangMenu() {
            if (!langMenu || !langTrigger) return;
            langMenu.hidden = true;
            langTrigger.setAttribute('aria-expanded', 'false');
        }

        function selectLanguage(lang) {
            state.language = lang;
            el.languageSelect.value = lang;
            if (langLabel) langLabel.textContent = langNames[lang] || lang;
            langMenu.querySelectorAll('.nav-lang-option').forEach(opt => {
                const isActive = opt.dataset.lang === lang;
                opt.classList.toggle('active', isActive);
                opt.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });
            closeLangMenu();
            applyLanguage();
            if (state.currentView === 'home') renderSchemeHome();
        }

        langTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = !langMenu.hidden;
            langMenu.hidden = isOpen;
            langTrigger.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
        });

        langMenu.addEventListener('click', (e) => {
            const opt = e.target.closest('.nav-lang-option');
            if (opt && opt.dataset.lang) selectLanguage(opt.dataset.lang);
        });

        langMenu.addEventListener('keydown', (e) => {
            const options = [...langMenu.querySelectorAll('.nav-lang-option')];
            const idx = options.indexOf(document.activeElement);
            if (e.key === 'ArrowDown') { e.preventDefault(); options[(idx + 1) % options.length].focus(); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); options[(idx - 1 + options.length) % options.length].focus(); }
            else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (options[idx]) { selectLanguage(options[idx].dataset.lang); langTrigger.focus(); } }
            else if (e.key === 'Escape') { closeLangMenu(); langTrigger.focus(); }
        });

        document.addEventListener('click', (e) => {
            if (!langMenu.hidden && !e.target.closest('.nav-language-dropdown')) closeLangMenu();
        });
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
        const langMenu = id('lang-menu');
        const langTrigger = id('lang-trigger');
        if (langMenu) langMenu.hidden = true;
        if (langTrigger) langTrigger.setAttribute('aria-expanded', 'false');
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
                <div class="auth-heading text-center">
                    <svg class="indian-flag-icon" viewBox="0 0 64 42" width="48" height="32" style="margin: 0 auto 16px; display: block; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <rect width="64" height="14" fill="#FF9933"/>
                        <rect y="14" width="64" height="14" fill="#FFFFFF"/>
                        <rect y="28" width="64" height="14" fill="#138808"/>
                        <circle cx="32" cy="21" r="5" fill="none" stroke="#000080" stroke-width="1"/>
                        <circle cx="32" cy="21" r="1" fill="#000080"/>
                    </svg>
                    <span class="auth-kicker">Citizen account</span>
                    <h1>Start with Sugam Seva</h1>
                    <p>Create one secure place for your documents and public-service applications.</p>
                </div>
                <div class="form-group"><label for="reg-name">Full Name</label><input type="text" id="reg-name" class="form-control" placeholder="Enter your full name" required autocomplete="name"></div>
                <div class="form-group"><label for="reg-mobile">Mobile Number</label><input type="tel" id="reg-mobile" class="form-control" placeholder="10-digit mobile number" required autocomplete="tel" maxlength="10"></div>
                <div class="form-group"><label for="reg-email">Email Address</label><input type="email" id="reg-email" class="form-control" placeholder="you@example.com" required autocomplete="email"></div>
                <div class="form-group"><label for="reg-pass">Password</label><input type="password" id="reg-pass" class="form-control" placeholder="Minimum 8 characters" required autocomplete="new-password" minlength="8"></div>
                <div class="form-group"><label for="reg-confirm">Confirm Password</label><input type="password" id="reg-confirm" class="form-control" placeholder="Repeat your password" required autocomplete="new-password"></div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-bottom:0;">Create Account</button>`;
        } else {
            el.toggleAuthBtn.textContent = 'New here? Create an account';
            el.authForm.innerHTML = `
                <div class="auth-heading text-center">
                    <svg class="indian-flag-icon" viewBox="0 0 64 42" width="64" height="42" style="margin: 0 auto 20px; display: block; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                        <rect width="64" height="14" fill="#FF9933"/>
                        <rect y="14" width="64" height="14" fill="#FFFFFF"/>
                        <rect y="28" width="64" height="14" fill="#138808"/>
                        <circle cx="32" cy="21" r="6" fill="none" stroke="#000080" stroke-width="1.2"/>
                        <path d="M32 15 L32 27 M26 21 L38 21 M28 17 L36 25 M28 25 L36 17" stroke="#000080" stroke-width="0.5"/>
                    </svg>
                    <span class="auth-kicker">Secure access</span>
                    <h1>Welcome back</h1>
                    <p>Sign in to continue to your documents and recommended schemes.</p>
                </div>
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

        pendingUser = null;
        state.isSignUpMode = false;
        route();
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
        const applications = loadUserApplications();
        const photo = profile.photo || '';
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
        const recentApplications = applications.slice(0, 3);
        const applicationItems = applications.length
            ? recentApplications.map(application => {
                const scheme = findScheme(application.schemeId);
                return `<li class="profile-list-item"><span class="profile-list-icon">&#10003;</span><span><strong>${escHtml(scheme?.name || application.schemeId)}</strong><small>${escHtml(application.status === 'redirected-to-official-portal' ? 'Redirected to official portal' : application.status || 'Application started')} · ${formatDate(application.submittedAt)}</small></span></li>`;
            }).join('')
            : '<li class="profile-empty-item">No scheme applications yet.</li>';
        const documentItems = state.documents.length
            ? state.documents.slice(0, 5).map(document => `<li class="profile-list-item"><span class="profile-list-icon document-icon">&#128196;</span><span><strong>${escHtml(document.type)}</strong><small>${escHtml(verificationLabel(document.verificationStatus))} · Added ${formatDate(document.addedAt)}</small></span></li>`).join('')
            : '<li class="profile-empty-item">No documents added yet.</li>';
        el.profileContent.innerHTML = `
            <div class="profile-overview">
                <div class="profile-identity-card">
                    <div class="profile-photo-wrap">
                        ${photo ? `<img class="profile-photo" src="${escHtml(photo)}" alt="Profile photo">` : '<span class="profile-photo-placeholder" aria-hidden="true"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></span>'}
                        <label class="profile-photo-button" for="profile-photo-input" title="Add profile photo">&#43;<span class="sr-only">Add profile photo</span></label>
                        <input id="profile-photo-input" class="hidden" type="file" accept="image/*">
                    </div>
                    <div class="profile-identity-copy"><span class="eyebrow">Citizen account</span><h3>${escHtml(profile.name || 'Citizen')}</h3><p>${escHtml(profile.email || profile.mobile || 'Complete your profile details')}</p>${photo ? '<button type="button" class="text-link profile-remove-photo" data-profile-photo-remove>Remove photo</button>' : ''}</div>
                </div>
                <div class="profile-stat-grid" aria-label="Profile summary">
                    <div class="stat-item"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg><strong>${state.documents.length}</strong><span class="stat-label">Documents</span></div>
                    <div class="stat-item"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg><strong>${applications.length}</strong><span class="stat-label">Applications</span></div>
                    <div class="stat-item"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg><strong>${state.documents.filter(document => document.verificationStatus === 'verified').length}</strong><span class="stat-label">Verified</span></div>
                </div>
            </div>
            <div class="profile-sections">
                <section class="profile-panel"><div class="profile-panel-heading"><div><span class="eyebrow"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>Activity</span><h3>Applied schemes</h3></div><span class="profile-panel-count">${applications.length}</span></div><ul class="profile-list">${applicationItems}</ul>${applications.length > 3 ? '<button type="button" class="text-link profile-view-all" data-nav="home">View all schemes</button>' : ''}</section>
                <section class="profile-panel"><div class="profile-panel-heading"><div><span class="eyebrow"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline><polyline points="7.5 19.79 7.5 14.6 3 12"></polyline><polyline points="21 12 16.5 14.6 16.5 19.79"></polyline><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>Wallet</span><h3>My documents</h3></div><span class="profile-panel-count">${state.documents.length}</span></div><ul class="profile-list">${documentItems}</ul>${state.documents.length > 5 ? '<button type="button" class="text-link profile-view-all" data-nav="documents">View all documents</button>' : ''}</section>
            </div>
            ${state.profile.conflicts?.length ? '<div class="notice-box"><strong>Review required</strong><span>Different documents contain different information. Confirm the correct values below.</span></div>' : ''}
            <form id="profile-form" class="application-form profile-details-form" novalidate>
                ${inputField(fields[0])}
                ${inputField(fields[1])}
                ${selectField('gender', 'Gender', ['Male', 'Female', 'Other'], true)}
                ${selectField('state', 'State', states)}
                ${fields.slice(2).map(inputField).join('')}
                ${selectField('occupation', 'Occupation', ['Student', 'Farmer', 'Self-employed', 'Business owner', 'Private sector employee', 'Government employee', 'Homemaker', 'Retired', 'Unemployed', 'Other'], true)}
                ${selectField('category', 'Category', ['General', 'Scheduled Caste (SC)', 'Scheduled Tribe (ST)', 'Other Backward Class (OBC)', 'Economically Weaker Section (EWS)', 'Other'], true)}
                ${editing ? '<button type="submit" class="btn btn-primary btn-block">Confirm Details</button>' : '<button type="button" id="edit-profile-btn" class="btn btn-secondary btn-block">Edit Details</button>'}
                <button type="button" id="logout-btn" class="btn btn-danger btn-block" style="margin-top: 16px;">Sign Out</button>
            </form>`;

        const logoutBtn = id('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    }

    function loadUserApplications() {
        let applications;
        try { applications = JSON.parse(localStorage.getItem(KEYS.APPLICATIONS) || '[]'); } catch { applications = []; }
        if (!Array.isArray(applications) || !state.currentUser) return [];
        return applications.filter(application => !application.userId || application.userId === state.currentUser.id);
    }

    async function renderSchemeHome() {
        const renderLanguage = state.language;
        const text = languageText[renderLanguage] || languageText.en;
        el.schemeGrid.innerHTML = `<div class="loading-state" role="status" aria-live="polite"><div class="spinner" aria-hidden="true"></div><p>${text.loadingSchemes}</p></div>`;

        // Populate greeting on home page
        const homeGreeting = document.getElementById('home-greeting');
        if (homeGreeting && state.currentUser) {
            const hour = new Date().getHours();
            const greet = hour < 12 ? text.morning : hour < 17 ? text.afternoon : text.evening;
            homeGreeting.textContent = `${greet}, ${state.currentUser.name} 👋`;
        }

        el.profileStrip.innerHTML = `
            <div><span class="profile-label">${text.profileUsed}</span><strong>${escHtml(getProfile().name)}</strong></div>
            <div><span class="profile-label">${text.documentsAvailable}</span><strong>${state.documents.length}</strong></div>
            <div><span class="profile-label">${text.assessment}</span><strong>${text.youAreEligible}</strong></div>
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
                    assessment: { status: 'You Are Eligible', reasons: ['Profile not assessed'], missingDocuments: [] },
                }));
                state.recommendationError = null;
            } catch {
                state.schemes = [];
                state.recommendationError = error.message;
            }
        }
        if (renderLanguage !== state.language) return;
        if (!state.schemes.length) {
            el.schemeGrid.innerHTML = `<div class="empty-state scheme-empty"><svg class="empty-state-icon" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg><h3>${text.noSchemes}</h3><p>${text.noSchemesDescription}</p></div>`;
            return;
        }
        if (state.recommendationError) {
            el.schemeGrid.innerHTML = `<div class="empty-state scheme-empty"><svg class="empty-state-icon" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><h3>${text.unavailable}</h3><p>${text.connectDatabase}</p></div>`;
            return;
        }
        el.schemeGrid.innerHTML = state.schemes.map(scheme => {
            const firstReason = scheme.assessment.reasons.length ? scheme.assessment.reasons[0] : '';
            const isMissing = firstReason.startsWith('Missing: ');
            const missingItems = isMissing ? firstReason.substring(9).split(', ').map(d => d.trim()).filter(Boolean) : [];
            const statusLabel = scheme.assessment.status === 'You Are Eligible' ? text.youAreEligible : scheme.assessment.status;
            const matchLabel = isMissing ? '' : (firstReason || text.profileChecked);
            return `
            <article class="scheme-card">
                <div class="scheme-card-top">
                    <span class="scheme-status${isMissing ? ' scheme-status-warning' : ''}">${escHtml(statusLabel)}</span>
                    ${matchLabel ? `<span class="scheme-match">${escHtml(matchLabel)}</span>` : ''}
                </div>
                ${isMissing ? `
                <button type="button" class="scheme-missing-toggle" data-scheme-missing-id="${scheme.id}" aria-expanded="false" aria-controls="missing-details-${scheme.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>Missing ${missingItems.length} document${missingItems.length !== 1 ? 's' : ''}</span>
                    <svg class="scheme-missing-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <div class="scheme-missing-details collapsed" id="missing-details-${scheme.id}">
                    <ul>${missingItems.map(item => `<li>${escHtml(item)}</li>`).join('')}</ul>
                </div>
                ` : ''}
                <h3>${escHtml(scheme.name)}</h3>
                <p class="scheme-description">${escHtml(scheme.shortDescription)}</p>
                <button type="button" class="btn btn-primary scheme-see-more" data-scheme-details="${scheme.id}">${text.seeMore} <span aria-hidden="true">&rarr;</span></button>
            </article>
        `;
        }).join('');
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
            <div class="detail-heading"><div><span class="scheme-status">You Are Eligible</span><h2 id="scheme-details-title">${escHtml(scheme.name)}</h2><p>${escHtml(scheme.description)}</p></div><span class="official-mark">Official source listed</span></div>
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
            <button type="button" class="btn btn-primary" id="submit-application-btn">Continue to official application <span aria-hidden="true">&rarr;</span></button>
            <p class="text-muted submit-note">Your reviewed details and selected documents are saved here. The official portal will open next; review and enter the information there before submitting.</p>
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

    function addDocument(type, dataUrl, processingType = type) {
        const doc = {
            id:       Date.now().toString(),
            type,
            processingType,
            dataUrl,
            addedAt:  new Date().toISOString(),
            verificationStatus: 'verifying',
            verificationMessage: 'Reading document',
            extractedFields: {},
        };
        state.documents.unshift(doc); // newest first
        persistDocuments();
        apiFetch('/api/documents', { method: 'POST', body: JSON.stringify({ id: doc.id, documentType: doc.type, verificationStatus: doc.verificationStatus === 'verified' ? 'verified' : 'unverified' }) }).catch(() => {});
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
            const extractedFields = extractFields(doc.processingType || doc.type, result.data.text);
            const missing = requiredFields(doc.processingType || doc.type).filter(field => !extractedFields[field]);
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
        el.documentPickerLabel.textContent = 'Select document type';
        el.documentPicker.classList.remove('is-open');
        el.documentPickerTrigger.setAttribute('aria-expanded', 'false');
        el.documentPicker.querySelectorAll('[role="option"]').forEach(option => option.setAttribute('aria-selected', 'false'));
        el.uploadOptions.classList.add('hidden');
        el.otherDocumentNameGroup.classList.add('hidden');
        el.otherDocumentName.value = '';
        el.otherDocumentName.required = false;
        state.pendingDocType   = null;
        state.camera.capturedData = null;
        el.docGuide.classList.add('hidden');
        el.docGuideCard.classList.add('hidden');
        el.docGuideToggle.setAttribute('aria-expanded', 'false');
        el.docGuideToggle.querySelector('span').innerHTML = '&#9660;';
    }

    function showDocGuide(docType) {
        const data = getDocGuideData(docType);
        if (!data) {
            el.docGuide.classList.add('hidden');
            return;
        }
        el.docGuide.classList.remove('hidden');
        el.docGuideCard.classList.add('hidden');
        el.docGuideToggle.setAttribute('aria-expanded', 'false');
        el.docGuideToggle.querySelector('span').innerHTML = '&#9660;';
        el.docGuideTitle.textContent = data.title;
        el.docGuideDesc.textContent = data.description;
        el.docGuideWhereText.textContent = data.where;
        // Remove any previous fallback messages
        el.docGuideCard.querySelectorAll('.doc-guide-fallback').forEach(el => el.remove());
        if (data.url) {
            el.docGuideLink.href = data.url;
            el.docGuideLink.textContent = (data.label || 'Official Government Website') + ' \u2197';
            el.docGuideLink.classList.remove('hidden');
            if (data.fallback) {
                el.docGuideLink.insertAdjacentHTML('afterend', '<p class="doc-guide-fallback">Update your state in My Profile to get a direct link to your state\u2019s portal.</p>');
            }
        } else {
            el.docGuideLink.classList.add('hidden');
        }
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
        if (el.otherDocumentNameGroup) el.otherDocumentNameGroup.classList.add('hidden');
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
            const missingToggle = e.target.closest('.scheme-missing-toggle');
            if (missingToggle) {
                const schemeId = missingToggle.dataset.schemeMissingId;
                const details = document.getElementById('missing-details-' + schemeId);
                if (details) {
                    details.classList.toggle('collapsed');
                    const expanded = !details.classList.contains('collapsed');
                    missingToggle.setAttribute('aria-expanded', String(expanded));
                }
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
                const scheme = findScheme(state.selectedScheme);
                if (!scheme?.officialApplicationUrl) {
                    alert('The official application website is not available for this scheme.');
                    return;
                }
                const applications = JSON.parse(localStorage.getItem(KEYS.APPLICATIONS) || '[]');
                applications.unshift({
                    id: Date.now().toString(),
                    userId: state.currentUser.id,
                    schemeId: state.selectedScheme,
                    fields: state.application.fields,
                    documents: state.documents.map(document => ({ id: document.id, type: document.type })),
                    submittedAt: new Date().toISOString(),
                    status: 'redirected-to-official-portal',
                });
                localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(applications));
                window.location.assign(scheme.officialApplicationUrl);
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

        el.chatForm.addEventListener('submit', handleChatSubmit);
        el.chatInput.addEventListener('keydown', event => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                el.chatForm.requestSubmit();
            }
        });

        // Quick-reply chips: clicking fills input and submits
        const chatChips = document.getElementById('chat-chips');
        if (chatChips) {
            chatChips.addEventListener('click', event => {
                const chip = event.target.closest('[data-chat-chip]');
                if (!chip) return;
                el.chatInput.value = chip.textContent.trim();
                el.chatForm.requestSubmit();
            });
        }

        // Chat FAB toggle
        function openChatbotPanel() {
            const panel = el.chatbotPanel;
            const fab = el.chatFab;
            panel.classList.remove('hidden');
            panel.classList.add('is-opening');
            void panel.offsetWidth; // force reflow
            panel.classList.remove('is-opening');
            panel.classList.add('is-open');
            fab.classList.add('is-open');
            fab.setAttribute('aria-label', 'Close chat assistant');
            el.chatInput.focus();
        }

        function closeChatbotPanel() {
            const panel = el.chatbotPanel;
            const fab = el.chatFab;
            panel.classList.remove('is-open');
            fab.classList.remove('is-open');
            fab.setAttribute('aria-label', 'Open chat assistant');
            panel.addEventListener('transitionend', function handler() {
                panel.removeEventListener('transitionend', handler);
                if (!panel.classList.contains('is-open')) {
                    panel.classList.add('hidden');
                }
            });
        }

        el.chatFab.addEventListener('click', () => {
            if (el.chatbotPanel.classList.contains('is-open')) {
                closeChatbotPanel();
            } else {
                openChatbotPanel();
            }
        });

        // Chatbot close button
        el.chatbotCloseBtn.addEventListener('click', closeChatbotPanel);

        // National Anthem
        if (el.anthemToggleBtn && el.nationalAnthemAudio) {
            el.anthemToggleBtn.addEventListener('click', () => {
                const audio = el.nationalAnthemAudio;
                const playIcon = el.anthemToggleBtn.querySelector('.anthem-icon-play');
                const pauseIcon = el.anthemToggleBtn.querySelector('.anthem-icon-pause');
                const btnText = id('anthem-btn-text');

                if (audio.paused) {
                    audio.play();
                    playIcon.classList.add('hidden');
                    pauseIcon.classList.remove('hidden');
                    if(btnText) btnText.textContent = 'Pause Anthem';
                } else {
                    audio.pause();
                    audio.currentTime = 0; // Reset on pause for clean experience
                    playIcon.classList.remove('hidden');
                    pauseIcon.classList.add('hidden');
                    if(btnText) btnText.textContent = 'National Anthem';
                }
            });

            el.nationalAnthemAudio.addEventListener('ended', () => {
                const playIcon = el.anthemToggleBtn.querySelector('.anthem-icon-play');
                const pauseIcon = el.anthemToggleBtn.querySelector('.anthem-icon-pause');
                const btnText = id('anthem-btn-text');
                playIcon.classList.remove('hidden');
                pauseIcon.classList.add('hidden');
                if(btnText) btnText.textContent = 'National Anthem';
            });
        }

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
            if (event.target.id === 'profile-photo-input') {
                const file = event.target.files?.[0];
                if (!file || !file.type.startsWith('image/')) return;
                const reader = new FileReader();
                reader.onload = () => {
                    state.profile.photo = reader.result;
                    saveProfile();
                    renderProfile(state.profileEditing);
                };
                reader.readAsDataURL(file);
                return;
            }
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

        el.profileContent.addEventListener('click', event => {
            if (event.target.closest('[data-profile-photo-remove]')) {
                delete state.profile.photo;
                saveProfile();
                renderProfile(state.profileEditing);
            }
        });

        // Doc type select
        const selectDocumentType = selectedType => {
            el.docTypeSelect.value = selectedType;
            if (selectedType) {
                state.pendingDocType = selectedType;
                el.uploadOptions.classList.remove('hidden');
            } else {
                el.uploadOptions.classList.add('hidden');
            }
            const isOther = selectedType === 'Other';
            el.otherDocumentNameGroup.classList.toggle('hidden', !isOther);
            el.otherDocumentName.required = isOther;
            if (!isOther) el.otherDocumentName.value = '';
            showDocGuide(selectedType);
        };

        el.docTypeSelect.addEventListener('change', () => selectDocumentType(el.docTypeSelect.value));
        el.documentPickerTrigger.addEventListener('click', () => {
            const isOpen = el.documentPicker.classList.toggle('is-open');
            el.documentPickerTrigger.setAttribute('aria-expanded', String(isOpen));
        });
        el.documentPickerMenu.querySelectorAll('[role="option"]').forEach(option => {
            option.addEventListener('click', () => {
                const type = option.dataset.value;
                el.documentPickerLabel.textContent = type === 'Other' ? 'Other document' : type;
                el.documentPickerMenu.querySelectorAll('[role="option"]').forEach(item => item.setAttribute('aria-selected', String(item === option)));
                el.documentPicker.classList.remove('is-open');
                el.documentPickerTrigger.setAttribute('aria-expanded', 'false');
                selectDocumentType(type);
            });
        });
        document.addEventListener('click', e => {
            if (!el.documentPicker.contains(e.target)) {
                el.documentPicker.classList.remove('is-open');
                el.documentPickerTrigger.setAttribute('aria-expanded', 'false');
            }
        });

        el.docGuideToggle.addEventListener('click', () => {
            const card = el.docGuideCard;
            const isOpen = !card.classList.contains('hidden');
            card.classList.toggle('hidden');
            el.docGuideToggle.setAttribute('aria-expanded', String(!isOpen));
            el.docGuideToggle.querySelector('span').innerHTML = isOpen ? '&#9660;' : '&#9650;';
        });

        // Upload options
        el.optGallery.addEventListener('click', () => el.fileInput.click());

        el.fileInput.addEventListener('change', () => {
            handleFileSelect(el.fileInput.files[0]);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            el.optGallery.addEventListener(eventName, e => {
                e.preventDefault();
                el.optGallery.classList.add('is-dragover');
            });
        });
        ['dragleave', 'drop'].forEach(eventName => {
            el.optGallery.addEventListener(eventName, e => {
                e.preventDefault();
                el.optGallery.classList.remove('is-dragover');
            });
        });
        el.optGallery.addEventListener('drop', e => {
            handleFileSelect(e.dataTransfer.files[0]);
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
            const customName = el.otherDocumentName.value.trim();
            if (state.pendingDocType === 'Other' && !customName) {
                el.otherDocumentName.focus();
                alert('Enter a name for this document before saving.');
                return;
            }
            addDocument(state.pendingDocType === 'Other' ? customName : state.pendingDocType, state.camera.capturedData, state.pendingDocType === 'Other' ? 'Other Document' : state.pendingDocType);
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
                if (el.chatbotPanel.classList.contains('is-open')) {
                    closeChatbotPanel();
                }
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
    async function handleChatSubmit(event) {
        event.preventDefault();
        const message = el.chatInput.value.trim();
        if (!message || el.chatSendBtn.disabled) return;
        const history = state.chatMessages.slice(-8);
        state.chatMessages.push({ role: 'user', content: message });
        el.chatInput.value = '';
        el.chatSendBtn.disabled = true;
        el.chatSendBtn.innerHTML = '<span class="chat-send-spinner" aria-hidden="true"></span>';
        renderChatMessages(true);
        try {
            const result = await apiFetch('/api/chat', {
                method: 'POST',
                body: JSON.stringify({ message, language: state.language, history }),
            });
            state.chatMessages.push({ role: 'assistant', content: result.answer });
        } catch (error) {
            state.chatMessages.push({ role: 'assistant', content: error.message || 'The chatbot could not answer right now.', error: true });
        } finally {
            el.chatSendBtn.disabled = false;
            el.chatSendBtn.innerHTML = `${(languageText[state.language] || languageText.en).send} <span aria-hidden="true">&rarr;</span>`;
            renderChatMessages();
            el.chatInput.focus();
        }
    }

    function renderChatMessages(loading = false) {
        const welcome = (languageText[state.language] || languageText.en).chatWelcome;
        const messages = state.chatMessages.length
            ? state.chatMessages.map(message => `<div class="chat-message ${message.role}${message.error ? ' error' : ''}"><strong>${message.role === 'user' ? (languageText[state.language] || languageText.en).you : 'Sugam Seva assistant'}</strong><p>${escHtml(message.content).replace(/\n/g, '<br>')}</p></div>`).join('')
            : `<div class="chat-message assistant"><strong>Sugam Seva assistant</strong><p>${welcome}</p></div>`;
        el.chatMessages.innerHTML = messages + (loading ? '<div class="chat-message assistant chat-loading"><strong>Sugam Seva assistant</strong><p><span></span><span></span><span></span></p></div>' : '');
        el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
        // Hide suggestion chips once conversation starts
        const chips = document.getElementById('chat-chips');
        if (chips) chips.style.display = state.chatMessages.length ? 'none' : '';
    }

    function applyLanguage() {
        const text = languageText[state.language] || languageText.en;
        const setText = (selector, value) => {
            const element = el.homeView.querySelector(selector);
            if (element) element.textContent = value;
        };
        const setTextGlobal = (selector, value) => {
            const element = document.querySelector(selector);
            if (element) element.textContent = value;
        };

        setText('#home-title', text.homeTitle);
        setText('.home-lead', text.homeLead);
        setText('#home-schemes-title', text.recommendedSchemes);
        setText('#home-schemes-description', text.schemesDescription);
        setText('[data-nav="documents"] .home-action-label', text.myDocuments);
        setText('[data-nav="documents"] .home-action-desc', text.documentsDescription);
        setText('[data-nav="profile"] .home-action-label', text.myProfile);
        setText('[data-nav="profile"] .home-action-desc', text.profileDescription);
        el.languageSelect.setAttribute('aria-label', text.chooseLanguage);
        const langTriggerLabel = id('lang-trigger-label');
        if (langTriggerLabel) {
            const langNames = { en: 'English', hi: 'हिन्दी', kn: 'ಕನ್ನಡ' };
            langTriggerLabel.textContent = langNames[state.language] || 'English';
        }
        setTextGlobal('#chat-status-text', text.online);
        setTextGlobal('.chatbot-panel .chat-disclaimer', text.chatDisclaimer);
        el.chatInput.placeholder = text.chatPlaceholder;
        el.chatSendBtn.innerHTML = `${text.send} <span aria-hidden="true">&rarr;</span>`;
        renderChatMessages();
    }

    const languageText = {
        en: {
            language: 'Language', chooseLanguage: 'Choose language', homeTitle: 'Schemes for your next step',
            homeLead: 'Based on the information and documents you have shared. Every result is a possibility, not an official eligibility decision.',
            recommendedSchemes: 'Recommended schemes', schemesDescription: 'A short view of the benefits that may fit your profile.',
            myDocuments: 'My Documents', documentsDescription: 'View and manage uploaded IDs', myProfile: 'My Profile',
            profileDescription: 'Update profile for better matches', seeMore: 'See more', profileUsed: 'Profile used',
            documentsAvailable: 'Documents available', assessment: 'Assessment', youAreEligible: 'You Are Eligible', profileChecked: 'Profile checked',
            noSchemes: 'No verified schemes available', noSchemesDescription: 'No approved scheme records have been imported yet.', loadingSchemes: 'Loading recommended schemes…', unavailable: 'Government schemes are unavailable', connectDatabase: 'Connect the database to load the official scheme catalogue.', morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening',
            chatTitle: 'Ask about government schemes', chatDescription: 'Ask about benefits, eligibility, documents, deadlines, or how to apply.', chatPlaceholder: 'Ask a question about schemes...', send: 'Send', online: 'Online', chatDisclaimer: 'Answers are guidance only. The official government authority makes the final decision.', chatWelcome: 'Ask me anything about the approved government schemes.', you: 'You'
        },
        hi: {
            language: 'भाषा', chooseLanguage: 'भाषा चुनें', homeTitle: 'आपके अगले कदम के लिए योजनाएं',
            homeLead: 'आपके द्वारा साझा की गई जानकारी और दस्तावेजों के आधार पर। हर परिणाम केवल एक संभावना है, आधिकारिक पात्रता निर्णय नहीं।',
            recommendedSchemes: 'अनुशंसित योजनाएं', schemesDescription: 'आपकी प्रोफ़ाइल के अनुसार लाभों का संक्षिप्त विवरण।',
            myDocuments: 'मेरे दस्तावेज़', documentsDescription: 'अपलोड किए गए पहचान दस्तावेज़ देखें और प्रबंधित करें', myProfile: 'मेरी प्रोफ़ाइल',
            profileDescription: 'बेहतर सुझावों के लिए प्रोफ़ाइल अपडेट करें', seeMore: 'और देखें', profileUsed: 'प्रोफ़ाइल का उपयोग',
            documentsAvailable: 'उपलब्ध दस्तावेज़', assessment: 'आकलन', youAreEligible: 'आप पात्र हैं', profileChecked: 'प्रोफ़ाइल जांची गई',
            noSchemes: 'कोई सत्यापित योजना उपलब्ध नहीं', noSchemesDescription: 'अभी तक कोई स्वीकृत योजना रिकॉर्ड आयात नहीं किया गया है।', loadingSchemes: 'अनुशंसित योजनाएं लोड हो रही हैं…', unavailable: 'सरकारी योजनाएं उपलब्ध नहीं हैं', connectDatabase: 'आधिकारिक योजना सूची लोड करने के लिए डेटाबेस कनेक्ट करें।', morning: 'सुप्रभात', afternoon: 'नमस्कार', evening: 'शुभ संध्या',
            chatTitle: 'सरकारी योजनाओं के बारे में पूछें', chatDescription: 'लाभ, पात्रता, दस्तावेज़, समय सीमा या आवेदन प्रक्रिया के बारे में पूछें।', chatPlaceholder: 'योजनाओं के बारे में सवाल पूछें...', send: 'भेजें', online: 'ऑनलाइन', chatDisclaimer: 'उत्तर केवल मार्गदर्शन हैं। अंतिम निर्णय सरकारी प्राधिकरण का होगा।', chatWelcome: 'स्वीकृत सरकारी योजनाओं के बारे में कुछ भी पूछें।', you: 'आप'
        },
        kn: {
            language: 'ಭಾಷೆ', chooseLanguage: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ', homeTitle: 'ನಿಮ್ಮ ಮುಂದಿನ ಹೆಜ್ಜೆಗೆ ಯೋಜನೆಗಳು',
            homeLead: 'ನೀವು ಹಂಚಿಕೊಂಡ ಮಾಹಿತಿ ಮತ್ತು ದಾಖಲೆಗಳ ಆಧಾರದ ಮೇಲೆ. ಪ್ರತಿ ಫಲಿತಾಂಶವೂ ಒಂದು ಸಾಧ್ಯತೆ ಮಾತ್ರ, ಅಧಿಕೃತ ಅರ್ಹತಾ ನಿರ್ಧಾರವಲ್ಲ.',
            recommendedSchemes: 'ಶಿಫಾರಸು ಮಾಡಿದ ಯೋಜನೆಗಳು', schemesDescription: 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್‌ಗೆ ಹೊಂದುವ ಪ್ರಯೋಜನಗಳ ಸಂಕ್ಷಿಪ್ತ ನೋಟ.',
            myDocuments: 'ನನ್ನ ದಾಖಲೆಗಳು', documentsDescription: 'ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ಗುರುತಿನ ದಾಖಲೆಗಳನ್ನು ನೋಡಿ ಮತ್ತು ನಿರ್ವಹಿಸಿ', myProfile: 'ನನ್ನ ಪ್ರೊಫೈಲ್',
            profileDescription: 'ಉತ್ತಮ ಹೊಂದಾಣಿಕೆಗಳಿಗಾಗಿ ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಿ', seeMore: 'ಇನ್ನಷ್ಟು ನೋಡಿ', profileUsed: 'ಬಳಸಿದ ಪ್ರೊಫೈಲ್',
            documentsAvailable: 'ಲಭ್ಯವಿರುವ ದಾಖಲೆಗಳು', assessment: 'ಮೌಲ್ಯಮಾಪನ', youAreEligible: 'ನೀವು ಅರ್ಹರಾಗಿದ್ದೀರಿ', profileChecked: 'ಪ್ರೊಫೈಲ್ ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
            noSchemes: 'ಯಾವುದೇ ಪರಿಶೀಲಿಸಿದ ಯೋಜನೆಗಳು ಲಭ್ಯವಿಲ್ಲ', noSchemesDescription: 'ಯಾವುದೇ ಅನುಮೋದಿತ ಯೋಜನೆ ದಾಖಲೆಗಳನ್ನು ಇನ್ನೂ ಆಮದು ಮಾಡಲಾಗಿಲ್ಲ।', loadingSchemes: 'ಶಿಫಾರಸು ಮಾಡಿದ ಯೋಜನೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ…', unavailable: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಲಭ್ಯವಿಲ್ಲ', connectDatabase: 'ಅಧಿಕೃತ ಯೋಜನೆಗಳ ಪಟ್ಟಿಯನ್ನು ಲೋಡ್ ಮಾಡಲು ಡೇಟಾಬೇಸ್ ಸಂಪರ್ಕಿಸಿ.', morning: 'ಶುಭೋದಯ', afternoon: 'ನಮಸ್ಕಾರ', evening: 'ಶುಭ ಸಂಜೆ',
            chatTitle: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ', chatDescription: 'ಪ್ರಯೋಜನಗಳು, ಅರ್ಹತೆ, ದಾಖಲೆಗಳು, ಗಡುವುಗಳು ಅಥವಾ ಅರ್ಜಿ ಪ್ರಕ್ರಿಯೆಯ ಬಗ್ಗೆ ಕೇಳಿ.', chatPlaceholder: 'ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಪ್ರಶ್ನೆ ಕೇಳಿ...', send: 'ಕಳುಹಿಸಿ', online: 'ಆನ್‌ಲೈನ್', chatDisclaimer: 'ಉತ್ತರಗಳು ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ಮಾತ್ರ. ಅಂತಿಮ ನಿರ್ಧಾರವನ್ನು ಸರ್ಕಾರಿ ಪ್ರಾಧಿಕಾರ ಮಾಡುತ್ತದೆ.', chatWelcome: 'ಅನುಮೋದಿತ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಏನನ್ನಾದರೂ ಕೇಳಿ.', you: 'ನೀವು'
        }
    };

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
