import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Scheme, Application, CitizenDocument } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

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

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();

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
      if (res.success) setSchemes(res.schemes);
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
      if (res.success) setApplications(res.applications);
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
      if (res.success) setDocuments(res.documents);
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
        setApplications(prev => [res.application, ...prev]);
        return res.application;
      }
      return null;
    } catch (e) {
      console.warn('[DataContext] Failed to submit application:', e);
      return null;
    }
  }, []);

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
      setApplications([]);
      setDocuments([]);
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

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};