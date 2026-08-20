// js/i18n.js
// Sugam Seva — Internationalisation Module
//
// Architecture:
//   - All UI strings are keyed in English (the base language).
//   - Static translations for Hindi (hi) are bundled here as a working demo.
//   - For all other Indian languages, this module delegates to bhashini.js
//     once real Bhashini API credentials are configured there.
//   - The t(key) function is the single public interface for fetching strings.
//   - applyTranslations() walks the DOM for [data-i18n] attributes.
//   - Language preference is stored in localStorage.

window.I18n = (function () {
    'use strict';

    // ============================================================
    //  Storage key
    // ============================================================
    const LANG_KEY = 'sugamSeva_lang';

    // ============================================================
    //  Supported languages
    //  - code   : BCP-47 / ISO 639-1 code used throughout the app
    //  - label  : Native-script name shown in the selector
    //  - dir    : 'ltr' or 'rtl'
    //  - static : true = bundled translations available (no API needed)
    // ============================================================
    const LANGUAGES = [
        { code: 'en', label: 'English',    dir: 'ltr', static: true  },
        { code: 'hi', label: 'हिंदी',       dir: 'ltr', static: true  },
        { code: 'bn', label: 'বাংলা',       dir: 'ltr', static: false },
        { code: 'ta', label: 'தமிழ்',       dir: 'ltr', static: false },
        { code: 'te', label: 'తెలుగు',      dir: 'ltr', static: false },
        { code: 'mr', label: 'मराठी',       dir: 'ltr', static: false },
        { code: 'gu', label: 'ગુજરાતી',     dir: 'ltr', static: false },
        { code: 'kn', label: 'ಕನ್ನಡ',       dir: 'ltr', static: false },
        { code: 'ml', label: 'മലയാളം',      dir: 'ltr', static: false },
        { code: 'pa', label: 'ਪੰਜਾਬੀ',      dir: 'ltr', static: false },
        { code: 'or', label: 'ଓଡ଼ିଆ',       dir: 'ltr', static: false },
        { code: 'ur', label: 'اردو',        dir: 'rtl', static: false },
    ];

    // ============================================================
    //  String Catalogue
    //  Every key used with t() must exist under 'en'.
    // ============================================================
    const catalogue = {

        // ── English (base) ────────────────────────────────────────
        en: {
            // App shell
            appName:            'Sugam Seva',
            footerCopy:         '© 2026 Sugam Seva · A public service initiative',
            footerNote:         'Documents are stored locally on your device for this prototype.',
            navHi:              'Hi',
            signOut:            'Sign Out',

            // Auth – Sign In
            signInTitle:        'Sign In',
            signInSubtitle:     'Access your citizen documents securely.',
            mobileOrEmail:      'Mobile Number or Email',
            mobileOrEmailPh:    'Mobile or email',
            password:           'Password',
            passwordPh:         'Your password',
            signInBtn:          'Sign In',
            noAccount:          'New here? Create an account',

            // Auth – Sign Up
            createAccount:      'Create Account',
            createSubtitle:     'Register to manage your citizen documents.',
            fullName:           'Full Name',
            fullNamePh:         'Enter your full name',
            mobileNumber:       'Mobile Number',
            mobilePh:           '10-digit mobile number',
            emailAddress:       'Email Address',
            emailPh:            'you@example.com',
            newPassword:        'Password',
            newPasswordPh:      'Minimum 8 characters',
            confirmPassword:    'Confirm Password',
            confirmPasswordPh:  'Repeat your password',
            createAccountBtn:   'Create Account',
            haveAccount:        'Already have an account? Sign In',

            // Validation errors
            errFillAll:         'Please fill in all fields.',
            errMobile:          'Please enter a valid 10-digit Indian mobile number.',
            errEmail:           'Please enter a valid email address.',
            errPassLen:         'Password must be at least 8 characters.',
            errPassMatch:       'Passwords do not match.',
            errNoCredentials:   'Please enter your credentials.',
            errNoAccount:       'No account found. Please create one first.',
            errWrongCreds:      'Incorrect credentials. Please try again.',

            // Biometric
            bioTitle:           'Secure Your Account',
            bioDesc:            'Enable device security (Passkey / Biometric) for faster and safer logins in the future. Your biometric data stays on your device and is never shared.',
            enableBio:          'Enable Device Security',
            skipBio:            'Skip for Now',
            bioEnabled:         "Device security enabled via your browser's passkey/biometric system.",
            bioSimulated:       'Biometric setup simulated. (WebAuthn not available in this browser/context.)',

            // Dashboard
            myDocuments:        'My Documents',
            dashSubtitle:       'Your verified identity documents, stored securely.',
            addDocument:        'Add Document',

            // Filters
            filterAll:          'All',
            filterAadhaar:      'Aadhaar',
            filterPan:          'PAN',
            filterPassport:     'Passport',
            filterLicence:      'Licence',
            filterVoterID:      'Voter ID',

            // Document card
            docAdded:           'Added',
            docView:            'View',
            docDelete:          'Delete',
            confirmDelete:      'Remove this document from your wallet?',

            // Empty state
            emptyTitle:         'No documents yet',
            emptyDesc:          'Click "+ Add Document" to upload your first document.',

            // Modal – Add document
            addDocTitle:        'Add Document',
            docTypeLabel:       'Document Type',
            docTypePh:          '— Select document type —',
            optionsLabel:       'How would you like to add this document?',
            optGallery:         'Gallery / File Picker',
            optCamera:          'Camera Capture',
            optDigiLocker:      'Connect DigiLocker',

            // Document types
            dtAadhaar:          'Aadhaar Card',
            dtPAN:              'PAN Card',
            dtDriving:          'Driving Licence',
            dtVoter:            'Voter ID',
            dtPassport:         'Passport',
            dtIncome:           'Income Certificate',
            dtEducation:        'Education Certificate',
            dtOther:            'Other',

            // Camera step
            cameraLabel:        'Position your document clearly within the frame.',
            capture:            'Capture',
            cancelCamera:       'Cancel',

            // Preview step
            previewLabel:       'Review your document before saving.',
            retake:             'Retake / Replace',
            saveDoc:            'Save Document',
            errNoType:          'Please select a document type first.',

            // DigiLocker step
            digiLockerTitle:    'DigiLocker',
            digiLockerDesc:     'You will be redirected to DigiLocker to authorize access to your documents. This is a government service and your credentials are handled only by DigiLocker.',
            digiLockerNotice:   'This is the connection interface. Real DigiLocker API integration requires official onboarding.',
            digiLockerConnect:  'Connect with DigiLocker',
            digiLockerCancel:   'Cancel',
            digiLockerAlert:    "DigiLocker connection interface is ready.\n\nReal integration requires official DigiLocker API onboarding with your organisation's credentials. Your data is not sent anywhere in this prototype.",
            cameraAlert:        'Camera access was denied or is unavailable. Please use the file picker instead.',
        },

        // ── Hindi ─────────────────────────────────────────────────
        hi: {
            appName:            'सुगम सेवा',
            footerCopy:         '© 2026 सुगम सेवा · एक सार्वजनिक सेवा पहल',
            footerNote:         'दस्तावेज़ इस प्रोटोटाइप में आपके डिवाइस पर स्थानीय रूप से संग्रहीत हैं।',
            navHi:              'नमस्ते',
            signOut:            'साइन आउट',

            signInTitle:        'साइन इन',
            signInSubtitle:     'अपने नागरिक दस्तावेज़ों को सुरक्षित रूप से एक्सेस करें।',
            mobileOrEmail:      'मोबाइल नंबर या ईमेल',
            mobileOrEmailPh:    'मोबाइल या ईमेल',
            password:           'पासवर्ड',
            passwordPh:         'आपका पासवर्ड',
            signInBtn:          'साइन इन करें',
            noAccount:          'नए हैं? खाता बनाएँ',

            createAccount:      'खाता बनाएँ',
            createSubtitle:     'अपने नागरिक दस्तावेज़ प्रबंधित करने के लिए पंजीकरण करें।',
            fullName:           'पूरा नाम',
            fullNamePh:         'अपना पूरा नाम दर्ज करें',
            mobileNumber:       'मोबाइल नंबर',
            mobilePh:           '10 अंकों का मोबाइल नंबर',
            emailAddress:       'ईमेल पता',
            emailPh:            'you@example.com',
            newPassword:        'पासवर्ड',
            newPasswordPh:      'न्यूनतम 8 अक्षर',
            confirmPassword:    'पासवर्ड की पुष्टि करें',
            confirmPasswordPh:  'पासवर्ड दोबारा दर्ज करें',
            createAccountBtn:   'खाता बनाएँ',
            haveAccount:        'पहले से खाता है? साइन इन करें',

            errFillAll:         'कृपया सभी फ़ील्ड भरें।',
            errMobile:          'कृपया एक मान्य 10 अंकों का भारतीय मोबाइल नंबर दर्ज करें।',
            errEmail:           'कृपया एक मान्य ईमेल पता दर्ज करें।',
            errPassLen:         'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।',
            errPassMatch:       'पासवर्ड मेल नहीं खाते।',
            errNoCredentials:   'कृपया अपनी जानकारी दर्ज करें।',
            errNoAccount:       'कोई खाता नहीं मिला। कृपया पहले एक बनाएँ।',
            errWrongCreds:      'गलत जानकारी। कृपया पुनः प्रयास करें।',

            bioTitle:           'अपना खाता सुरक्षित करें',
            bioDesc:            'तेज़ और सुरक्षित लॉगिन के लिए डिवाइस सुरक्षा (पासकी / बायोमेट्रिक) सक्षम करें। आपका बायोमेट्रिक डेटा आपके डिवाइस पर रहता है और कभी साझा नहीं किया जाता।',
            enableBio:          'डिवाइस सुरक्षा सक्षम करें',
            skipBio:            'अभी छोड़ें',
            bioEnabled:         'आपके ब्राउज़र की पासकी/बायोमेट्रिक प्रणाली के माध्यम से डिवाइस सुरक्षा सक्षम की गई।',
            bioSimulated:       'बायोमेट्रिक सेटअप अनुकरण किया गया। (इस ब्राउज़र में WebAuthn उपलब्ध नहीं है।)',

            myDocuments:        'मेरे दस्तावेज़',
            dashSubtitle:       'आपके सत्यापित पहचान दस्तावेज़, सुरक्षित रूप से संग्रहीत।',
            addDocument:        'दस्तावेज़ जोड़ें',

            filterAll:          'सभी',
            filterAadhaar:      'आधार',
            filterPan:          'पैन',
            filterPassport:     'पासपोर्ट',
            filterLicence:      'लाइसेंस',
            filterVoterID:      'मतदाता पहचान',

            docAdded:           'जोड़ा गया',
            docView:            'देखें',
            docDelete:          'हटाएँ',
            confirmDelete:      'इस दस्तावेज़ को अपने वॉलेट से हटाएँ?',

            emptyTitle:         'अभी कोई दस्तावेज़ नहीं',
            emptyDesc:          'अपना पहला दस्तावेज़ अपलोड करने के लिए "+ दस्तावेज़ जोड़ें" पर क्लिक करें।',

            addDocTitle:        'दस्तावेज़ जोड़ें',
            docTypeLabel:       'दस्तावेज़ का प्रकार',
            docTypePh:          '— दस्तावेज़ प्रकार चुनें —',
            optionsLabel:       'आप इस दस्तावेज़ को कैसे जोड़ना चाहते हैं?',
            optGallery:         'गैलरी / फ़ाइल चुनें',
            optCamera:          'कैमरा कैप्चर',
            optDigiLocker:      'डिजिलॉकर से जोड़ें',

            dtAadhaar:          'आधार कार्ड',
            dtPAN:              'पैन कार्ड',
            dtDriving:          'ड्राइविंग लाइसेंस',
            dtVoter:            'मतदाता पहचान पत्र',
            dtPassport:         'पासपोर्ट',
            dtIncome:           'आय प्रमाण पत्र',
            dtEducation:        'शैक्षणिक प्रमाण पत्र',
            dtOther:            'अन्य',

            cameraLabel:        'दस्तावेज़ को फ्रेम में स्पष्ट रूप से रखें।',
            capture:            'कैप्चर करें',
            cancelCamera:       'रद्द करें',

            previewLabel:       'सहेजने से पहले अपने दस्तावेज़ की समीक्षा करें।',
            retake:             'दोबारा लें / बदलें',
            saveDoc:            'दस्तावेज़ सहेजें',
            errNoType:          'कृपया पहले दस्तावेज़ का प्रकार चुनें।',

            digiLockerTitle:    'डिजिलॉकर',
            digiLockerDesc:     'आपको अपने दस्तावेज़ों तक पहुँच अधिकृत करने के लिए डिजिलॉकर पर पुनर्निर्देशित किया जाएगा। यह एक सरकारी सेवा है।',
            digiLockerNotice:   'यह कनेक्शन इंटरफ़ेस है। वास्तविक डिजिलॉकर API एकीकरण के लिए आधिकारिक ऑनबोर्डिंग आवश्यक है।',
            digiLockerConnect:  'डिजिलॉकर से जोड़ें',
            digiLockerCancel:   'रद्द करें',
            digiLockerAlert:    'डिजिलॉकर कनेक्शन इंटरफ़ेस तैयार है।\n\nवास्तविक एकीकरण के लिए आधिकारिक API ऑनबोर्डिंग आवश्यक है।',
            cameraAlert:        'कैमरा एक्सेस अस्वीकृत या अनुपलब्ध है। कृपया फ़ाइल पिकर का उपयोग करें।',
        },
    };

    // ============================================================
    //  State
    // ============================================================
    let _currentLang = 'en';
    let _onChangeCb  = null; // callback fired after language is applied

    // ============================================================
    //  Public: init
    // ============================================================
    function init(onChangeCb) {
        _onChangeCb = onChangeCb || null;
        const saved = localStorage.getItem(LANG_KEY);
        const lang  = LANGUAGES.find(l => l.code === saved) ? saved : 'en';
        _currentLang = lang;
        _applyDir(lang);
    }

    // ============================================================
    //  Public: t(key)
    //  Returns the translated string for the current language.
    //  Falls back to English if the key is missing in the active locale.
    // ============================================================
    function t(key) {
        const locale = catalogue[_currentLang];
        if (locale && locale[key] !== undefined) return locale[key];
        // Fallback
        const en = catalogue['en'];
        return en[key] !== undefined ? en[key] : key;
    }

    // ============================================================
    //  Public: setLanguage(code)
    //  For languages with static translations: instant swap.
    //  For languages needing Bhashini: defers to bhashini.js adapter.
    // ============================================================
    async function setLanguage(code) {
        const lang = LANGUAGES.find(l => l.code === code);
        if (!lang) return;

        if (lang.static) {
            // Bundled translations — instant
            _currentLang = code;
            localStorage.setItem(LANG_KEY, code);
            _applyDir(code);
            if (_onChangeCb) _onChangeCb();
        } else {
            // ── Bhashini path ────────────────────────────────────
            // window.Bhashini is the adapter in js/bhashini.js.
            // It returns null/undefined until credentials are configured.
            if (window.Bhashini && window.Bhashini.isConfigured()) {
                try {
                    const translations = await window.Bhashini.translate(
                        catalogue['en'],
                        code
                    );
                    if (translations) {
                        catalogue[code] = translations;
                        _currentLang   = code;
                        localStorage.setItem(LANG_KEY, code);
                        _applyDir(code);
                        if (_onChangeCb) _onChangeCb();
                        return;
                    }
                } catch (err) {
                    console.warn('[I18n] Bhashini translation failed, falling back to English.', err);
                }
            }
            // Bhashini not configured or failed — stay in current language
            _showBhashiniNotice(lang.label);
        }
    }

    // ============================================================
    //  Public: getCurrentLanguage()
    // ============================================================
    function getCurrentLanguage() { return _currentLang; }

    // ============================================================
    //  Public: getLanguages()
    // ============================================================
    function getLanguages() { return LANGUAGES; }

    // ============================================================
    //  Public: applyTranslations()
    //  Walks the DOM and replaces text/placeholders on [data-i18n] elements.
    // ============================================================
    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const attr = el.getAttribute('data-i18n-attr'); // e.g. 'placeholder' or 'aria-label'
            const val  = t(key);
            if (attr) {
                el.setAttribute(attr, val);
            } else {
                el.textContent = val;
            }
        });
    }

    // ============================================================
    //  Internal helpers
    // ============================================================
    function _applyDir(code) {
        const lang = LANGUAGES.find(l => l.code === code);
        document.documentElement.lang = code;
        document.documentElement.dir  = lang ? lang.dir : 'ltr';
    }

    function _showBhashiniNotice(langLabel) {
        // Non-blocking inline toast
        let toast = document.getElementById('i18n-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'i18n-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = `${langLabel} translation will be available once Bhashini API is configured. Using English.`;
        toast.className = 'i18n-toast show';
        setTimeout(() => toast.classList.remove('show'), 4000);
    }

    // ============================================================
    //  Export
    // ============================================================
    return { init, t, setLanguage, getCurrentLanguage, getLanguages, applyTranslations };

})();
