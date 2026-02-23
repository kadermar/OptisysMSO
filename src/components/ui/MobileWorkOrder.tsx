'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Check,
  AlertCircle,
  Upload,
  X,
  CheckCircle,
  FileText,
  User,
  Building2,
  ClipboardList,
  Camera,
  MessageSquare,
  Shield,
  Loader2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useTourSafe } from '@/components/tour';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
};

// Progress ring component
function ProgressRing({ progress, size = 60, strokeWidth = 6 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          className="text-[#ff0000]"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-[#1c2b40]">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

// Loading skeleton
function FormSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-12 bg-gray-200 rounded-xl" />
        </div>
      ))}
      <div className="h-48 bg-gray-200 rounded-xl" />
    </div>
  );
}

export function MobileWorkOrder() {
  const tour = useTourSafe();

  // State
  const [selectedProcedure, setSelectedProcedure] = useState('');
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [procedureSteps, setProcedureSteps] = useState<any[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [hasIncident, setHasIncident] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [procedureDetails, setProcedureDetails] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Computed values
  const completionProgress = useMemo(() => {
    if (procedureSteps.length === 0) return 0;
    return (completedSteps.size / procedureSteps.length) * 100;
  }, [completedSteps.size, procedureSteps.length]);

  const isCompliant = useMemo(() => {
    return procedureSteps.length > 0 && completedSteps.size === procedureSteps.length;
  }, [completedSteps.size, procedureSteps.length]);

  const qualityScore = useMemo(() => {
    if (procedureSteps.length === 0) return 0;
    return (completedSteps.size / procedureSteps.length) * 10;
  }, [completedSteps.size, procedureSteps.length]);

  const canSubmit = useMemo(() => {
    return selectedProcedure && selectedFacility && selectedWorker;
  }, [selectedProcedure, selectedFacility, selectedWorker]);

  const selectedWorkerData = useMemo(() => {
    return workers.find(w => w.worker_id === selectedWorker);
  }, [workers, selectedWorker]);

  const selectedFacilityData = useMemo(() => {
    return facilities.find(f => f.facility_id === selectedFacility);
  }, [facilities, selectedFacility]);

  // Effects
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [proceduresRes, facilitiesRes, workersRes] = await Promise.all([
          fetch('/api/dashboard/procedures'),
          fetch('/api/dashboard/facilities'),
          fetch('/api/dashboard/workers'),
        ]);

        if (proceduresRes.ok) setProcedures(await proceduresRes.json());
        if (facilitiesRes.ok) setFacilities(await facilitiesRes.json());
        if (workersRes.ok) {
          const workersData = await workersRes.json();
          setWorkers(workersData);
          if (workersData.length > 0) {
            const randomIndex = Math.floor(Math.random() * workersData.length);
            const worker = workersData[randomIndex];
            setSelectedWorker(worker.worker_id);
            setSelectedFacility(worker.facility_id);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (tour?.isActive && tour?.currentStep === 5 && tour?.selectedProcedureId && procedures.length > 0) {
      if (!selectedProcedure) {
        setSelectedProcedure(tour.selectedProcedureId);
      }
    }
  }, [tour?.isActive, tour?.currentStep, tour?.selectedProcedureId, procedures, selectedProcedure]);

  useEffect(() => {
    async function fetchProcedureSteps() {
      if (!selectedProcedure) {
        setProcedureSteps([]);
        setCompletedSteps(new Set());
        return;
      }
      try {
        const response = await fetch(`/api/dashboard/procedure-steps?procedureId=${selectedProcedure}`);
        if (response.ok) {
          setProcedureSteps(await response.json());
          setCompletedSteps(new Set());
        }
      } catch (error) {
        console.error('Error fetching procedure steps:', error);
      }
    }
    fetchProcedureSteps();
  }, [selectedProcedure]);

  // Handlers
  const toggleStep = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
    }
    setCompletedSteps(newCompleted);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleViewProcedure = async () => {
    if (!selectedProcedure) return;
    try {
      const response = await fetch(`/api/procedures/${selectedProcedure}`);
      if (response.ok) {
        setProcedureDetails(await response.json());
        setShowProcedureModal(true);
      }
    } catch (error) {
      console.error('Error fetching procedure details:', error);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      let durationHours = 0;
      let downtimeHours = 0;

      const proceduresResponse = await fetch('/api/dashboard/procedures');
      if (proceduresResponse.ok) {
        const procs = await proceduresResponse.json();
        const procedureData = procs.find((p: any) => p.procedure_id === selectedProcedure);
        if (procedureData) {
          const avgDurationMinutes = (parseFloat(procedureData.avg_duration) || 0) * 60;
          const avgDowntimeMinutes = (parseFloat(procedureData.avg_downtime) || 0) * 60;
          durationHours = Math.max(1, avgDurationMinutes + (Math.random() * 20 - 10)) / 60;
          downtimeHours = Math.max(0, avgDowntimeMinutes + (Math.random() * 20 - 10)) / 60;
        }
      }

      const response = await fetch('/api/dashboard/work-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
        body: JSON.stringify({
          procedure_id: selectedProcedure,
          facility_id: selectedFacility,
          worker_id: selectedWorker,
          completedSteps: Array.from(completedSteps),
          totalSteps: procedureSteps.length,
          hasIncident,
          isCompliant,
          qualityScore,
          durationHours,
          downtimeHours,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (tour?.isActive && tour?.currentStep === 5 && tour?.setCompletedWorkOrder) {
          tour.setCompletedWorkOrder(data.wo_id);
        }
        setToast({
          message: `Work Order #${data.wo_id} submitted successfully!`,
          type: 'success',
        });
        // Reset form
        setSelectedProcedure('');
        setProcedureSteps([]);
        setCompletedSteps(new Set());
        setUploadedFiles([]);
        setHasIncident(false);
        setNotes('');
      } else {
        const error = await response.json();
        setToast({ message: `Failed: ${error.error}`, type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Failed to submit. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Early return for loading
  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        <div className="bg-gradient-to-r from-[#1c2b40] to-[#2d3e54] text-white px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff0000] flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Work Order</h1>
              <p className="text-xs text-white/70">Loading...</p>
            </div>
          </div>
        </div>
        <FormSkeleton />
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`absolute top-4 left-4 right-4 z-50 ${
              toast.type === 'success'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                : 'bg-gradient-to-r from-red-500 to-rose-600'
            } text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button onClick={() => setToast(null)} className="p-1 hover:bg-white/20 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#1c2b40] to-[#2d3e54] text-white px-6 py-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-[#ff0000] flex items-center justify-center shadow-lg"
            >
              <ClipboardList className="w-5 h-5" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold">Work Order</h1>
              <p className="text-xs text-white/70">Create new work order</p>
            </div>
          </div>
          {selectedProcedure && procedureSteps.length > 0 && (
            <ProgressRing progress={completionProgress} size={50} strokeWidth={5} />
          )}
        </div>
      </div>

      {/* Form Content */}
      <motion.div
        className="flex-1 overflow-y-auto"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <div className="p-4 space-y-4">
          {/* Assignment Cards */}
          <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-3">
            {/* Worker Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Worker</span>
              </div>
              <p className="text-sm font-semibold text-[#1c2b40] truncate">
                {selectedWorkerData?.worker_name || 'Assigning...'}
              </p>
            </div>

            {/* Facility Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Facility</span>
              </div>
              <p className="text-sm font-semibold text-[#1c2b40] truncate">
                {selectedFacilityData?.name || 'Assigning...'}
              </p>
            </div>
          </motion.div>

          {/* Procedure Selection */}
          <motion.div variants={fadeInUp} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <label className="flex items-center gap-2 text-sm font-semibold text-[#1c2b40] mb-3">
              <FileText className="w-4 h-4 text-[#ff0000]" />
              Select Procedure
            </label>
            <div className="relative">
              <select
                value={selectedProcedure}
                onChange={(e) => setSelectedProcedure(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none focus:border-[#ff0000] focus:ring-2 focus:ring-[#ff0000]/20 focus:outline-none text-[#1c2b40] font-medium text-sm transition-all"
              >
                <option value="">Choose a procedure...</option>
                {procedures.map((proc) => (
                  <option key={proc.procedure_id} value={proc.procedure_id}>
                    {proc.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            {selectedProcedure && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleViewProcedure}
                className="mt-2 text-xs font-medium text-[#ff0000] hover:text-[#cc0000] flex items-center gap-1"
              >
                View procedure details <ChevronRight className="w-3 h-3" />
              </motion.button>
            )}
          </motion.div>

          {/* Procedure Steps */}
          <motion.div variants={fadeInUp} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[#ff0000]" />
                  <span className="text-sm font-semibold text-[#1c2b40]">Checklist</span>
                </div>
                {procedureSteps.length > 0 && (
                  <span className="text-xs font-medium text-gray-500">
                    {completedSteps.size}/{procedureSteps.length} completed
                  </span>
                )}
              </div>
            </div>

            {!selectedProcedure ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <ClipboardList className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">Select a procedure to view steps</p>
              </div>
            ) : procedureSteps.length === 0 ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-500">Loading steps...</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {procedureSteps.map((step, index) => (
                  <motion.label
                    key={step.step_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      completedSteps.has(step.step_id) ? 'bg-green-50/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="pt-0.5">
                      <motion.div
                        whileTap={{ scale: 0.9 }}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          completedSteps.has(step.step_id)
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 hover:border-[#ff0000]'
                        }`}
                        onClick={() => toggleStep(step.step_id)}
                      >
                        {completedSteps.has(step.step_id) && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </motion.div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#ff0000]">Step {step.step_number}</span>
                        {step.criticality === 'critical' && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-semibold rounded">
                            Critical
                          </span>
                        )}
                        {step.verification_required && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded">
                            Verify
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mt-1 transition-all ${
                        completedSteps.has(step.step_id) ? 'text-gray-400 line-through' : 'text-gray-700'
                      }`}>
                        {step.step_name}
                      </p>
                    </div>
                  </motion.label>
                ))}
              </div>
            )}
          </motion.div>

          {/* Incident Toggle */}
          <motion.div variants={fadeInUp} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-[#ff0000]" />
              <span className="text-sm font-semibold text-[#1c2b40]">Safety Incident?</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setHasIncident(false)}
                className={`py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  !hasIncident
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Check className="w-4 h-4" />
                No Incident
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setHasIncident(true)}
                className={`py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  hasIncident
                    ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                Report Incident
              </motion.button>
            </div>
          </motion.div>

          {/* Media Upload */}
          <motion.div variants={fadeInUp} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-4 h-4 text-[#ff0000]" />
              <span className="text-sm font-semibold text-[#1c2b40]">Attachments</span>
            </div>
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#ff0000] hover:bg-red-50/30 transition-all">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Upload files</span>
              <span className="text-xs text-gray-400 mt-1">Photos, videos, documents</span>
              <input type="file" multiple onChange={handleFileUpload} className="hidden" />
            </label>
            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {uploadedFiles.map((file, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                  >
                    <FileText className="w-4 h-4 text-[#ff0000]" />
                    <span className="text-xs text-gray-700 flex-1 truncate">{file.name}</span>
                    <button onClick={() => removeFile(index)} className="p-1 hover:bg-red-100 rounded">
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Notes */}
          <motion.div variants={fadeInUp} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-[#ff0000]" />
              <span className="text-sm font-semibold text-[#1c2b40]">Notes</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add observations or comments..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#ff0000] focus:ring-2 focus:ring-[#ff0000]/20 focus:outline-none text-sm resize-none transition-all"
            />
          </motion.div>

          {/* Summary Card */}
          {selectedProcedure && procedureSteps.length > 0 && (
            <motion.div
              variants={fadeInUp}
              className="bg-gradient-to-br from-[#1c2b40] to-[#2d3e54] rounded-xl p-4 shadow-lg"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#ff0000]" />
                <span className="text-sm font-semibold text-white">Work Order Summary</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{completedSteps.size}/{procedureSteps.length}</p>
                  <p className="text-xs text-gray-400">Steps</p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${isCompliant ? 'text-green-400' : 'text-red-400'}`}>
                    {isCompliant ? 'Yes' : 'No'}
                  </p>
                  <p className="text-xs text-gray-400">Compliant</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">{qualityScore.toFixed(1)}</p>
                  <p className="text-xs text-gray-400">Quality</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.div variants={fadeInUp} className="pb-4">
            <motion.button
              whileHover={{ scale: canSubmit ? 1.02 : 1 }}
              whileTap={{ scale: canSubmit ? 0.98 : 1 }}
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg ${
                canSubmit
                  ? 'bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Submit Work Order
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Procedure Details Modal */}
      <AnimatePresence>
        {showProcedureModal && procedureDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowProcedureModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80%] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-[#1c2b40] to-[#2d3e54] text-white px-5 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">{procedureDetails.name}</h2>
                  <p className="text-xs text-white/70">{procedureDetails.procedure_id}</p>
                </div>
                <button
                  onClick={() => setShowProcedureModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Category</p>
                    <p className="text-sm font-semibold text-[#1c2b40]">{procedureDetails.category}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Safety Critical</p>
                    <p className="text-sm font-semibold text-[#1c2b40]">
                      {procedureDetails.safety_critical ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>

                {procedureDetails.steps?.map((step: any, index: number) => (
                  <motion.div
                    key={step.step_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-50 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#ff0000] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {step.step_number}
                      </div>
                      <div>
                        <p className="text-sm text-[#1c2b40]">{step.description}</p>
                        {step.safety_requirements && (
                          <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded mt-2">
                            {step.safety_requirements}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={() => setShowProcedureModal(false)}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-[#1c2b40] font-semibold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
