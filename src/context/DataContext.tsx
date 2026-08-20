import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Scheme, Application, CitizenDocument } from '../types';
import { api } from '../services/api';
import { translateTexts } from '../services/translation';
import { useAuth } from './AuthContext';
import { useAppNavigation } from '../navigation/NavigationContext';

interface DataContextType {
  schemes: Scheme[];
  applications: Application[];
  documents: CitizenDocument[];
  isLoadingSchemes: boolean;
  isLoadingApplications: boolean;
  isLoadingDocuments: boolean;
  refreshSchemes: () => Promise<void>;
  refreshApplications: () => Promise<void>;
  refreshDocuments: () => Promise<void>;
  submitApplication: (schemeId: string, schemeName: string) => Promise<Application | null>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// -----------------------------------------------------------------------------
// Application step titles/status values and document types coming back from
// the server are drawn from a small fixed English vocabulary that already
// exists as UI translation keys (e.g. "Application Submitted" ===
// t('statusSubmitted')). Routing these through the UI dictionary instead of
// a fresh translation API call is instant and stays perfectly consistent
// with the rest of the app's wording.
// -----------------------------------------------------------------------------
const STATUS_TEXT_TO_KEY: Record<string, string> = {
  'In Progress': 'statusInProgress',
  'Under Review': 'statusUnderReview',
  'Approved': 'statusApproved',
  'Benefits Disbursed': 'statusDisbursed',
  'Application Submitted': 'statusSubmitted',
  'Documents Verified': 'statusVerified',
  'Completed': 'stepCompleted',
  'Pending': 'stepPending',
};

/** Translate a known status/step string via the UI dictionary when possible, else fall back to the dynamic translator. */
const translateKnownOrDynamic = async (
  text: string,
  lang: string,
  t: (key: string, params?: Record<string, string>) => string
): Promise<string> => {
  if (!text) return text;
  if (lang === 'en') return text;

  // "Since <date>" step dates: translate the label, keep the date as-is.
  const sinceMatch = text.match(/^Since (.+)$/);
  if (sinceMatch) {
    return t('sinceLabel', { date: sinceMatch[1] });
  }

  const key = STATUS_TEXT_TO_KEY[text];
  if (key) return t(key);

  const [translated] = await translateTexts([text], lang);
  return translated;
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const { activeLanguage, t } = useAppNavigation();

  // Raw (English, as returned by the API) copies - translation never mutates
  // these, so re-translating on a language switch is always working from a
  // clean English source rather than compounding translations of translations.
  const [rawSchemes, setRawSchemes] = useState<Scheme[]>([]);
  const [rawApplications, setRawApplications] = useState<Application[]>([]);
  const [rawDocuments, setRawDocuments] = useState<CitizenDocument[]>([]);

  // What screens actually consume - localized to activeLanguage.
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<CitizenDocument[]>([]);

  const [isLoadingSchemes, setIsLoadingSchemes] = useState(false);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  const refreshSchemes = useCallback(async () => {
    setIsLoadingSchemes(true);
    try {
      const res = await api.getSchemes();
      if (res.success) setRawSchemes(res.schemes);
    } catch (e) {
      console.warn('[DataContext] Failed to load schemes:', e);
    } finally {
      setIsLoadingSchemes(false);
    }
  }, []);

  const refreshApplications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingApplications(true);
    try {
      const res = await api.getApplications();
      if (res.success) setRawApplications(res.applications);
    } catch (e) {
      console.warn('[DataContext] Failed to load applications:', e);
    } finally {
      setIsLoadingApplications(false);
    }
  }, [isAuthenticated]);

  const refreshDocuments = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingDocuments(true);
    try {
      const res = await api.getDocuments();
      if (res.success) setRawDocuments(res.documents);
    } catch (e) {
      console.warn('[DataContext] Failed to load documents:', e);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [isAuthenticated]);

  const submitApplication = useCallback(async (schemeId: string, schemeName: string): Promise<Application | null> => {
    try {
      const res = await api.submitApplication(schemeId, schemeName);
      if (res.success) {
        setRawApplications(prev => [res.application, ...prev]);
        return res.application;
      }
      return null;
    } catch (e) {
      console.warn('[DataContext] Failed to submit application:', e);
      return null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Re-localize schemes whenever the raw data or the active language changes.
  // Every translatable field (name, description, benefits, category, state,
  // eligibility criteria, required documents) is batched into ONE translation
  // call so switching languages doesn't fire dozens of requests per scheme.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const localize = async () => {
      if (activeLanguage === 'en' || rawSchemes.length === 0) {
        if (!cancelled) setSchemes(rawSchemes);
        return;
      }

      const allTexts: string[] = [];
      rawSchemes.forEach((s) => {
        allTexts.push(s.name, s.description, s.benefits, s.benefitsDetail || '', s.state);
        allTexts.push(...s.eligibilityCriteria);
        allTexts.push(...s.requiredDocuments);
      });

      const translated = await translateTexts(allTexts, activeLanguage);
      if (cancelled) return;

      let cursor = 0;
      const next = rawSchemes.map((s) => {
        const name = translated[cursor++];
        const description = translated[cursor++];
        const benefits = translated[cursor++];
        const benefitsDetailRaw = translated[cursor++];
        const state = translated[cursor++];
        const eligibilityCriteria = s.eligibilityCriteria.map(() => translated[cursor++]);
        const requiredDocuments = s.requiredDocuments.map(() => translated[cursor++]);

        return {
          ...s,
          name,
          description,
          benefits,
          benefitsDetail: s.benefitsDetail ? benefitsDetailRaw : s.benefitsDetail,
          state,
          eligibilityCriteria,
          requiredDocuments,
          category: (tCategoryValue(s.category, activeLanguage, t) as Scheme['category']),
        };
      });

      if (!cancelled) setSchemes(next);
    };

    localize();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawSchemes, activeLanguage]);

  // Applications: schemeName + status + each step's title/status/date.
  useEffect(() => {
    let cancelled = false;

    const localize = async () => {
      if (activeLanguage === 'en' || rawApplications.length === 0) {
        if (!cancelled) setApplications(rawApplications);
        return;
      }

      const next = await Promise.all(
        rawApplications.map(async (app) => {
          const [schemeName, status] = await Promise.all([
            translateTexts([app.schemeName], activeLanguage).then((r) => r[0]),
            translateKnownOrDynamic(app.status, activeLanguage, t),
          ]);

          const steps = await Promise.all(
            app.steps.map(async (step) => ({
              ...step,
              title: await translateKnownOrDynamic(step.title, activeLanguage, t),
              status: step.status,
              date: step.date ? await translateKnownOrDynamic(step.date, activeLanguage, t) : step.date,
            }))
          );

          return { ...app, schemeName, status: status as Application['status'], steps };
        })
      );

      if (!cancelled) setApplications(next);
    };

    localize();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawApplications, activeLanguage]);

  // Documents: name, type, source, status.
  useEffect(() => {
    let cancelled = false;

    const localize = async () => {
      if (activeLanguage === 'en' || rawDocuments.length === 0) {
        if (!cancelled) setDocuments(rawDocuments);
        return;
      }

      const allTexts: string[] = [];
      rawDocuments.forEach((d) => allTexts.push(d.name, d.type));
      const translated = await translateTexts(allTexts, activeLanguage);
      if (cancelled) return;

      let cursor = 0;
      const next = rawDocuments.map((d) => ({
        ...d,
        name: translated[cursor++],
        type: translated[cursor++],
      }));

      if (!cancelled) setDocuments(next);
    };

    localize();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawDocuments, activeLanguage]);

  // Schemes are public - load once on mount
  useEffect(() => {
    refreshSchemes();
  }, [refreshSchemes]);

  // Applications & documents are per-citizen - load once signed in, clear on sign out
  useEffect(() => {
    if (isAuthenticated) {
      refreshApplications();
      refreshDocuments();
    } else {
      setRawApplications([]);
      setRawDocuments([]);
    }
  }, [isAuthenticated, refreshApplications, refreshDocuments]);

  return (
    <DataContext.Provider
      value={{
        schemes,
        applications,
        documents,
        isLoadingSchemes,
        isLoadingApplications,
        isLoadingDocuments,
        refreshSchemes,
        refreshApplications,
        refreshDocuments,
        submitApplication,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

// Category names are a small fixed enum already present in the UI
// dictionary under "categories.<Name>" - reuse tCategory's dictionary
// instead of a second translation call.
function tCategoryValue(category: string, lang: string, t: (key: string, params?: Record<string, string>) => string): string {
  const translated = t(`categories.${category}`);
  return translated === `categories.${category}` ? category : translated;
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};