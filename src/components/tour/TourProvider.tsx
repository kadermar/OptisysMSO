'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { tourSteps, TOTAL_STEPS } from './tourSteps';
import { TourOverlay } from './TourOverlay';

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  selectedProcedureId: string | null;
  selectedProcedureName: string | null;
  completedWorkOrderId: string | null;
  uploadedDocumentId: string | null;
  editedProcedureVersion: string | null;
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  setSelectedProcedure: (id: string, name: string) => void;
  setCompletedWorkOrder: (id: string) => void;
  setUploadedDocument: (id: string) => void;
  setEditedProcedure: (id: string, version: string) => void;
  getCurrentStepInfo: () => typeof tourSteps[0] | null;
}

const TourContext = createContext<TourContextType | null>(null);

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}

// Safe hook that returns null if not in provider
export function useTourSafe() {
  return useContext(TourContext);
}

interface TourProviderProps {
  children: React.ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProcedureId, setSelectedProcedureId] = useState<string | null>(null);
  const [selectedProcedureName, setSelectedProcedureName] = useState<string | null>(null);
  const [completedWorkOrderId, setCompletedWorkOrderId] = useState<string | null>(null);
  const [uploadedDocumentId, setUploadedDocumentId] = useState<string | null>(null);
  const [editedProcedureVersion, setEditedProcedureVersion] = useState<string | null>(null);

  // Load tour state from localStorage on mount
  // Don't activate tour on MSO routes
  useEffect(() => {
    const isMSORoute = pathname?.startsWith('/mso');
    if (isMSORoute) {
      return; // Don't activate tour on MSO routes
    }

    const savedState = localStorage.getItem('optisys-tour-state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.isActive) {
          setIsActive(state.isActive);
          setCurrentStep(state.currentStep || 1);
          setSelectedProcedureId(state.selectedProcedureId || null);
          setSelectedProcedureName(state.selectedProcedureName || null);
          setCompletedWorkOrderId(state.completedWorkOrderId || null);
          setUploadedDocumentId(state.uploadedDocumentId || null);
          setEditedProcedureVersion(state.editedProcedureVersion || null);
        }
      } catch (e) {
        console.error('Error loading tour state:', e);
      }
    }
  }, [pathname]);

  // Save tour state to localStorage when it changes
  useEffect(() => {
    if (isActive) {
      localStorage.setItem('optisys-tour-state', JSON.stringify({
        isActive,
        currentStep,
        selectedProcedureId,
        selectedProcedureName,
        completedWorkOrderId,
        uploadedDocumentId,
        editedProcedureVersion,
      }));
    } else {
      localStorage.removeItem('optisys-tour-state');
    }
  }, [isActive, currentStep, selectedProcedureId, selectedProcedureName, completedWorkOrderId, uploadedDocumentId, editedProcedureVersion]);

  const getCurrentStepInfo = useCallback(() => {
    return tourSteps.find(step => step.id === currentStep) || null;
  }, [currentStep]);

  const navigateToStep = useCallback((step: number) => {
    const stepInfo = tourSteps.find(s => s.id === step);
    if (stepInfo) {
      let targetPath = stepInfo.page;

      // Step 4: Procedure Analysis
      if (selectedProcedureId && step === 4) {
        targetPath = `/procedures?selected=${selectedProcedureId}`;
      }

      // Step 6: Data Hub - work orders tab
      if (step === 6) {
        targetPath = '/knowledge-base?tab=workorders';
      }

      // Step 8: CI Signal Detection - highlight signal on dashboard
      if (selectedProcedureId && step === 8) {
        targetPath = `/?highlight_ci_signal=${selectedProcedureId}`;
      }

      // Step 9: Procedure Editing - edit mode
      if (selectedProcedureId && step === 9) {
        targetPath = `/procedures?selected=${selectedProcedureId}&mode=edit`;
      }

      // Step 10: Version History - show version history
      if (selectedProcedureId && step === 10) {
        targetPath = `/procedures?selected=${selectedProcedureId}&show_version_history=true`;
      }

      // Step 11: Before/After Comparison - compare versions
      if (selectedProcedureId && editedProcedureVersion && step === 11) {
        targetPath = `/procedures?selected=${selectedProcedureId}&compare_versions=1.0,${editedProcedureVersion}`;
      }

      if (pathname !== targetPath.split('?')[0]) {
        router.push(targetPath);
      }
    }
  }, [pathname, router, selectedProcedureId, editedProcedureVersion]);

  const startTour = useCallback(() => {
    setIsActive(true);
    setCurrentStep(1);
    setSelectedProcedureId(null);
    setSelectedProcedureName(null);
    setCompletedWorkOrderId(null);
    setUploadedDocumentId(null);
    setEditedProcedureVersion(null);
    router.push('/document-ingestion');
  }, [router]);

  const endTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(1);
    localStorage.removeItem('optisys-tour-state');
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      navigateToStep(newStep);
    } else {
      endTour();
    }
  }, [currentStep, navigateToStep, endTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      navigateToStep(newStep);
    }
  }, [currentStep, navigateToStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setCurrentStep(step);
      navigateToStep(step);
    }
  }, [navigateToStep]);

  const setSelectedProcedure = useCallback((id: string, name: string) => {
    setSelectedProcedureId(id);
    setSelectedProcedureName(name);
  }, []);

  const setCompletedWorkOrder = useCallback((id: string) => {
    setCompletedWorkOrderId(id);
  }, []);

  const setUploadedDocument = useCallback((id: string) => {
    setUploadedDocumentId(id);
  }, []);

  const setEditedProcedure = useCallback((id: string, version: string) => {
    setSelectedProcedureId(id);
    setEditedProcedureVersion(version);
  }, []);

  const value: TourContextType = {
    isActive,
    currentStep,
    selectedProcedureId,
    selectedProcedureName,
    completedWorkOrderId,
    uploadedDocumentId,
    editedProcedureVersion,
    startTour,
    endTour,
    nextStep,
    prevStep,
    goToStep,
    setSelectedProcedure,
    setCompletedWorkOrder,
    setUploadedDocument,
    setEditedProcedure,
    getCurrentStepInfo,
  };

  // Don't show tour overlay on MSO routes
  const isMSORoute = pathname?.startsWith('/mso');

  return (
    <TourContext.Provider value={value}>
      {children}
      {isActive && !isMSORoute && <TourOverlay />}
    </TourContext.Provider>
  );
}
