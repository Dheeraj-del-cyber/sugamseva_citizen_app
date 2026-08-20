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
    };

    // ============================================================
    //  Shorthand: t() — get translated string
    // ============================================================
    function t(key) { return window.I18n.t(key); }

    // ============================================================
    //  DOM References
    // ============================================================
    const el = {
        // Views
        authView:      id('auth-view'),
        bioView:       id('biometric-view'),
        dashView:      id('dashboard-view'),

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
        cameraStream:    id('camera-stream'),
        captureBtn:      id('capture-btn'),
        captureCanvas:   id('capture-canvas'),
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

        // Language
        langBtn:          id('lang-btn'),
        langDropdown:     id('lang-dropdown'),
        langCurrentLabel: id('lang-current-label'),
    };

    function id(s) { return document.getElementById(s); }

    // ============================================================
    //  Bootstrap
    // ============================================================
    document.addEventListener('DOMContentLoaded', boot);

    function boot() {
        // Init i18n first — reads saved preference, sets html[lang] + dir
        window.I18n.init(onLanguageChange);

        loadSession();
        loadDocuments();
        bindEvents();
        renderLangSelector();
        route();
    }

    // ============================================================
    //  Language change callback
    // ============================================================
    function onLanguageChange() {
        // Re-apply all data-i18n attributes
        window.I18n.applyTranslations();
        // Update current lang label in button
        renderLangCurrentLabel();
        // Re-render any dynamically-built UI with translated strings
        renderNav();
        if (state.currentUser) renderDocumentGrid();
        else renderAuthForm();
    }

    // ============================================================
    //  Language Selector
    // ============================================================
    function renderLangSelector() {
        const languages = window.I18n.getLanguages();
        const current   = window.I18n.getCurrentLanguage();

        el.langDropdown.innerHTML = languages.map(lang => `
            <li role="option"
                aria-selected="${lang.code === current}"
                data-lang="${lang.code}"
                class="lang-option${lang.code === current ? ' selected' : ''}${!lang.static ? ' needs-api' : ''}"
                title="${!lang.static ? 'Requires Bhashini API configuration' : ''}">
                <span class="lang-native">${escHtml(lang.label)}</span>
                ${!lang.static ? '<span class="lang-api-badge">API</span>' : ''}
            </li>
        `).join('');

        renderLangCurrentLabel();

        // Events
        el.langBtn.addEventListener('click', e => {
            e.stopPropagation();
            const open = el.langDropdown.classList.toggle('open');
            el.langBtn.setAttribute('aria-expanded', open);
        });

        el.langDropdown.addEventListener('click', e => {
            const item = e.target.closest('[data-lang]');
            if (!item) return;
            const code = item.dataset.lang;
            closeLangDropdown();
            window.I18n.setLanguage(code).then(() => {
                // Update selected state in list
                el.langDropdown.querySelectorAll('.lang-option').forEach(li => {
                    li.classList.toggle('selected', li.dataset.lang === window.I18n.getCurrentLanguage());
                    li.setAttribute('aria-selected', li.dataset.lang === window.I18n.getCurrentLanguage());
                });
            });
        });

        document.addEventListener('click', () => closeLangDropdown());
    }

    function renderLangCurrentLabel() {
        const current = window.I18n.getCurrentLanguage();
        el.langCurrentLabel.textContent = current.toUpperCase();
    }

    function closeLangDropdown() {
        el.langDropdown.classList.remove('open');
        el.langBtn.setAttribute('aria-expanded', 'false');
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
            el.dashView.classList.remove('hidden');
            el.dashView.style.display = 'block';
            renderDocumentGrid();
        }
        renderNav();
        // Apply i18n to static DOM elements
        window.I18n.applyTranslations();
    }

    function hideAllViews() {
        [el.authView, el.bioView, el.dashView].forEach(v => {
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
                <span class="nav-user">${escHtml(t('navHi'))}, ${escHtml(state.currentUser.name)}</span>
                <button id="logout-btn" class="btn btn-secondary" style="padding:6px 12px; font-size:0.8rem;">${escHtml(t('signOut'))}</button>
            `;
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
            el.authTitle.textContent     = t('createAccount');
            el.authSubtitle.textContent  = t('createSubtitle');
            el.toggleAuthBtn.textContent = t('haveAccount');
            el.authForm.innerHTML = `
                <div class="form-group">
                    <label for="reg-name">${t('fullName')}</label>
                    <input type="text" id="reg-name" class="form-control" placeholder="${t('fullNamePh')}" required autocomplete="name">
                </div>
                <div class="form-group">
                    <label for="reg-mobile">${t('mobileNumber')}</label>
                    <input type="tel" id="reg-mobile" class="form-control" placeholder="${t('mobilePh')}" required autocomplete="tel" maxlength="10">
                </div>
                <div class="form-group">
                    <label for="reg-email">${t('emailAddress')}</label>
                    <input type="email" id="reg-email" class="form-control" placeholder="${t('emailPh')}" required autocomplete="email">
                </div>
                <div class="form-group">
                    <label for="reg-pass">${t('newPassword')}</label>
                    <input type="password" id="reg-pass" class="form-control" placeholder="${t('newPasswordPh')}" required autocomplete="new-password" minlength="8">
                </div>
                <div class="form-group">
                    <label for="reg-confirm">${t('confirmPassword')}</label>
                    <input type="password" id="reg-confirm" class="form-control" placeholder="${t('confirmPasswordPh')}" required autocomplete="new-password">
                </div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-bottom:0;">${t('createAccountBtn')}</button>
            `;
        } else {
            el.authTitle.textContent     = t('signInTitle');
            el.authSubtitle.textContent  = t('signInSubtitle');
            el.toggleAuthBtn.textContent = t('noAccount');
            el.authForm.innerHTML = `
                <div class="form-group">
                    <label for="login-id">${t('mobileOrEmail')}</label>
                    <input type="text" id="login-id" class="form-control" placeholder="${t('mobileOrEmailPh')}" required autocomplete="username">
                </div>
                <div class="form-group">
                    <label for="login-pass">${t('password')}</label>
                    <input type="password" id="login-pass" class="form-control" placeholder="${t('passwordPh')}" required autocomplete="current-password">
                </div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-bottom:0;">${t('signInBtn')}</button>
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
            return showFormError(t('errFillAll'));
        }
        if (!/^[6-9]\d{9}$/.test(mobile)) {
            return showFormError(t('errMobile'));
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            return showFormError(t('errEmail'));
        }
        if (pass.length < 8) {
            return showFormError(t('errPassLen'));
        }
        if (pass !== confirm) {
            return showFormError(t('errPassMatch'));
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
            return showFormError(t('errNoCredentials'));
        }

        const raw = localStorage.getItem(KEYS.USER_DB);
        if (!raw) {
            return showFormError(t('errNoAccount'));
        }

        const record = JSON.parse(raw);
        const match  = (loginId === record.mobile || loginId === record.email)
                    && simpleHash(pass) === record.passwordHash;

        if (!match) {
            return showFormError(t('errWrongCreds'));
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
        // Apply i18n to the static biometric view
        window.I18n.applyTranslations();
    }

    function finishAuth() {
        if (!pendingUser) return;
        saveSession(pendingUser);
        pendingUser = null;
        route();
    }

    function handleLogout() {
        clearSession();
        state.documents = [];
        route();
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
                    <h3>${escHtml(t('emptyTitle'))}</h3>
                    <p>${escHtml(t('emptyDesc'))}</p>
                </div>`;
            return;
        }

        el.docGrid.innerHTML = docs.map(doc => `
            <article class="doc-card" data-id="${doc.id}">
                ${doc.dataUrl
                    ? `<img class="doc-card-thumb" src="${doc.dataUrl}" alt="${escHtml(doc.type)}" title="${escHtml(t('docView'))}" data-action="view">`
                    : `<div class="doc-card-thumb-placeholder" data-action="view" title="${escHtml(t('docView'))}">
                           <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5">
                               <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                               <polyline points="14 2 14 8 20 8"/>
                           </svg>
                       </div>`
                }
                <div class="doc-card-body">
                    <span class="doc-card-type">${escHtml(doc.type)}</span>
                    <p class="doc-card-date">${escHtml(t('docAdded'))} ${formatDate(doc.addedAt)}</p>
                    <div class="doc-card-actions">
                        <button class="btn btn-secondary" data-action="view">${escHtml(t('docView'))}</button>
                        <button class="btn btn-danger"    data-action="delete">${escHtml(t('docDelete'))}</button>
                    </div>
                </div>
            </article>
        `).join('');

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
        el.viewModalDate.textContent  = t('docAdded') + ' ' + formatDate(doc.addedAt);

        if (doc.dataUrl) {
            el.viewModalImg.src           = doc.dataUrl;
            el.viewModalImg.style.display = 'block';
        } else {
            el.viewModalImg.style.display = 'none';
        }

        el.viewModal.classList.remove('hidden');
    }

    function deleteDocument(docId) {
        if (!confirm(t('confirmDelete'))) return;
        state.documents = state.documents.filter(d => d.id !== docId);
        persistDocuments();
        renderDocumentGrid();
    }

    function addDocument(type, dataUrl) {
        const doc = {
            id:      Date.now().toString(),
            type,
            dataUrl,
            addedAt: new Date().toISOString(),
        };
        state.documents.unshift(doc); // newest first
        persistDocuments();
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
        state.pendingDocType      = null;
        state.camera.capturedData = null;
        // Translate static strings inside modal
        window.I18n.applyTranslations();
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
            alert(t('cameraAlert'));
        }
    }

    function stopCamera() {
        if (state.camera.stream) {
            state.camera.stream.getTracks().forEach(tr => tr.stop());
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
        el.toggleAuthBtn.addEventListener('click', () => {
            state.isSignUpMode = !state.isSignUpMode;
            renderAuthForm();
        });

        el.authForm.addEventListener('submit', e => {
            e.preventDefault();
            state.isSignUpMode ? handleSignUp() : handleSignIn();
        });

        el.enableBioBtn.addEventListener('click', () => {
            if (window.PublicKeyCredential) {
                alert(t('bioEnabled'));
            } else {
                alert(t('bioSimulated'));
            }
            finishAuth();
        });
        el.skipBioBtn.addEventListener('click', finishAuth);

        el.addDocBtn.addEventListener('click', openUploadModal);

        el.filterBar.addEventListener('click', e => {
            const chip = e.target.closest('.filter-chip');
            if (!chip) return;
            el.filterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.activeFilter = chip.dataset.filter;
            renderDocumentGrid();
        });

        el.closeModalBtn.addEventListener('click', closeUploadModal);
        el.modalOverlay.addEventListener('click', closeUploadModal);

        el.closeViewModal.addEventListener('click', () => el.viewModal.classList.add('hidden'));
        el.viewModalOverlay.addEventListener('click', () => el.viewModal.classList.add('hidden'));

        el.docTypeSelect.addEventListener('change', () => {
            const type = el.docTypeSelect.value;
            if (type) {
                state.pendingDocType = type;
                el.uploadOptions.classList.remove('hidden');
            } else {
                el.uploadOptions.classList.add('hidden');
            }
        });

        el.optGallery.addEventListener('click', () => el.fileInput.click());

        el.fileInput.addEventListener('change', () => {
            handleFileSelect(el.fileInput.files[0]);
        });

        el.optCamera.addEventListener('click', startCamera);

        el.optDigiLocker.addEventListener('click', () => showStep(el.stepDigiLocker));

        el.captureBtn.addEventListener('click', capturePhoto);
        el.cancelCameraBtn.addEventListener('click', () => {
            stopCamera();
            showStep(el.stepType);
        });

        el.retakeBtn.addEventListener('click', () => {
            if (previewSource === 'camera') {
                startCamera();
            } else {
                el.fileInput.click();
            }
        });

        el.saveDocBtn.addEventListener('click', () => {
            if (!state.pendingDocType) {
                alert(t('errNoType'));
                return;
            }
            addDocument(state.pendingDocType, state.camera.capturedData);
        });

        el.digiConnectBtn.addEventListener('click', () => {
            alert(t('digiLockerAlert'));
        });
        el.digiCancelBtn.addEventListener('click', () => showStep(el.stepType));

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                if (!el.uploadModal.classList.contains('hidden'))  closeUploadModal();
                if (!el.viewModal.classList.contains('hidden'))    el.viewModal.classList.add('hidden');
                closeLangDropdown();
            }
        });
    }

    // ============================================================
    //  Helpers
    // ============================================================
    function val(elId) {
        const node = document.getElementById(elId);
        return node ? node.value.trim() : '';
    }

    function escHtml(str) {
        const d = document.createElement('div');
        d.appendChild(document.createTextNode(str));
        return d.innerHTML;
    }

    function formatDate(iso) {
        const d = new Date(iso);
        const lang = window.I18n.getCurrentLanguage();
        return d.toLocaleDateString(lang + '-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function closeLangDropdown() {
        if (el.langDropdown) {
            el.langDropdown.classList.remove('open');
            if (el.langBtn) el.langBtn.setAttribute('aria-expanded', 'false');
        }
    }

})();
