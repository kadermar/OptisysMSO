'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, CheckCircle } from 'lucide-react';
import { useTour } from './TourProvider';
import { tourSteps, TOTAL_STEPS } from './tourSteps';

export function TourOverlay() {
  const {
    currentStep,
    selectedProcedureName,
    uploadedDocumentId,
    completedWorkOrderId,
    editedProcedureVersion,
    nextStep,
    prevStep,
    endTour,
    getCurrentStepInfo,
  } = useTour();

  const stepInfo = getCurrentStepInfo();

  if (!stepInfo) return null;

  const isLastStep = currentStep === TOTAL_STEPS;
  const isFirstStep = currentStep === 1;

  // Check if we can proceed (some steps require completion)
  const canProceed = () => {
    // Step 1 requires document upload
    if (currentStep === 1 && !uploadedDocumentId) {
      return false;
    }
    // Step 2 requires procedure selection
    if (currentStep === 2 && !selectedProcedureName) {
      return false;
    }
    // Step 5 requires work order submission
    if (currentStep === 5 && !completedWorkOrderId) {
      return false;
    }
    // Step 9 requires procedure edit save
    if (currentStep === 9 && !editedProcedureVersion) {
      return false;
    }
    return true;
  };

  // Get contextual button text for gated steps
  const getNextButtonText = () => {
    if (currentStep === 1 && !uploadedDocumentId) return 'Upload a Document';
    if (currentStep === 2 && !selectedProcedureName) return 'Select a Procedure';
    if (currentStep === 5 && !completedWorkOrderId) return 'Submit Work Order';
    if (currentStep === 9 && !editedProcedureVersion) return 'Save Changes';
    return 'Next Step';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-[#1c2b40] to-[#2d3e54] border-t-4 border-[#ff0000] shadow-2xl"
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Progress Bar */}
          <div className="flex items-center justify-center gap-2 mb-3">
            {tourSteps.map((step) => (
              <div
                key={step.id}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step.id === currentStep
                    ? 'w-8 bg-[#ff0000]'
                    : step.id < currentStep
                    ? 'w-4 bg-green-500'
                    : 'w-4 bg-gray-500'
                }`}
              />
            ))}
          </div>

          {/* Step Info - Header Row */}
          <div className="flex items-center justify-between gap-4 mb-3">
            {/* Left: Step Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#ff0000] text-white font-bold flex-shrink-0">
                {currentStep}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#ff0000] font-medium">{stepInfo.layer}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400">Step {currentStep} of {TOTAL_STEPS}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{stepInfo.title}</h3>
              </div>
            </div>

            {/* Right: Navigation */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Back Button */}
              <button
                onClick={prevStep}
                disabled={isFirstStep}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  isFirstStep
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>

              {/* Next/Complete Button */}
              {isLastStep ? (
                <button
                  onClick={endTour}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-500 transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  Complete Tour
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className={`flex items-center gap-1 px-6 py-2 rounded-lg font-medium transition-all ${
                    canProceed()
                      ? 'bg-[#ff0000] text-white hover:bg-red-600'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {getNextButtonText()}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {/* Exit Button */}
              <button
                onClick={endTour}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
                title="Exit Tour"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Story Text - Full Width */}
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-sm text-gray-300 leading-relaxed">
              {stepInfo.storyText}
            </p>
            {selectedProcedureName && (
              <p className="text-xs text-[#ff0000] mt-2 font-medium">
                Selected Procedure: {selectedProcedureName}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
