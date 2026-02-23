'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Loader2,
  Check,
  Sparkles,
  BarChart3,
  AlertTriangle,
  X
} from 'lucide-react';
import OverlapDetectionModal from './OverlapDetectionModal';

interface DocumentUploadZoneProps {
  onUploadComplete: (document: any) => void;
}

export default function DocumentUploadZone({ onUploadComplete }: DocumentUploadZoneProps) {
  const [uploadProgress, setUploadProgress] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showOverlapModal, setShowOverlapModal] = useState(false);
  const [processedDocument, setProcessedDocument] = useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFiles([file]);

      // Simulate upload and processing
      await simulateUpload(file);
    }
  };

  const simulateUpload = async (file: File) => {
    // Start progress
    setUploadProgress({
      filename: file.name,
      percent: 0,
      steps: 0,
      checklists: 0,
      asset: '',
      domain: '',
      kpis: []
    });

    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300));

      setUploadProgress((prev: any) => ({
        ...prev,
        percent: i,
        steps: i > 30 ? 14 : 0,
        checklists: i > 50 ? 3 : 0,
        asset: i > 60 ? 'Rig A' : '',
        domain: i > 70 ? 'Mechanical' : '',
        kpis: i > 80 ? ['Mean Time to Repair', 'Safety Compliance Rate'] : []
      }));
    }

    // Processing complete
    await new Promise(resolve => setTimeout(resolve, 500));

    const document = {
      id: `DOC-${Date.now()}`,
      name: file.name,
      extractedSteps: 14,
      extractedChecklists: 3,
      asset: 'Rig A',
      domain: 'Mechanical',
      risk: 'Medium',
      kpis: ['Mean Time to Repair', 'Safety Compliance Rate'],
      hasOverlap: true, // For demo purposes
      conflictingProcedure: 'INT-031'
    };

    setProcessedDocument(document);
    setUploadProgress(null);

    // Show overlap detection modal for demo
    if (document.hasOverlap) {
      setShowOverlapModal(true);
    } else {
      onUploadComplete(document);
    }
  };

  const handleOverlapResolved = () => {
    setShowOverlapModal(false);
    if (processedDocument) {
      onUploadComplete(processedDocument);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff0000] to-[#cc0000] flex items-center justify-center shadow-lg">
          <Upload className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#1c2b40]">Upload Document</h2>
          <p className="text-sm text-gray-500">Upload procedures for AI analysis</p>
        </div>
      </div>

      {/* Drop Zone */}
      {!uploadProgress && uploadedFiles.length === 0 && (
        <motion.label
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#ff0000] hover:bg-red-50/30 transition-all group"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4 group-hover:from-red-100 group-hover:to-rose-100 transition-all"
          >
            <FileText className="w-10 h-10 text-gray-400 group-hover:text-[#ff0000] transition-colors" />
          </motion.div>
          <p className="text-lg font-semibold text-[#1c2b40] mb-2">Drop procedure documents here</p>
          <p className="text-sm text-gray-500">or click to browse</p>
          <p className="text-xs text-gray-400 mt-2">Supports: .docx, .pdf, .txt (max 10MB)</p>
          <input
            type="file"
            accept=".docx,.pdf,.txt"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </motion.label>
      )}

      {/* Upload Progress */}
      <AnimatePresence>
        {uploadProgress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200"
          >
            <div className="flex items-center gap-4 mb-4">
              <Loader2 className="w-6 h-6 text-[#ff0000] animate-spin flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#1c2b40] mb-2">
                  Processing: {uploadProgress.filename}
                </p>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress.percent}%` }}
                    className="h-full bg-gradient-to-r from-[#ff0000] to-[#cc0000]"
                  />
                </div>
              </div>
              <span className="text-sm font-bold text-[#1c2b40]">{uploadProgress.percent}%</span>
            </div>

            {/* Real-time extraction status */}
            <div className="space-y-2 text-xs">
              {uploadProgress.steps > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700">
                    Extracted: {uploadProgress.steps} steps, {uploadProgress.checklists} checklists
                  </span>
                </motion.div>
              )}
              {uploadProgress.asset && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-700">
                    Auto-tagged: Asset: {uploadProgress.asset} | Domain: {uploadProgress.domain}
                  </span>
                </motion.div>
              )}
              {uploadProgress.kpis.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span className="text-gray-700">
                    KPI Mapped: {uploadProgress.kpis.join(', ')}
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && !uploadProgress && (
        <div className="space-y-3">
          {uploadedFiles.map((file, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200"
            >
              <FileText className="w-5 h-5 text-[#ff0000]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1c2b40] truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-red-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Overlap Detection Modal */}
      {processedDocument && (
        <OverlapDetectionModal
          isOpen={showOverlapModal}
          onClose={() => setShowOverlapModal(false)}
          newDocument={processedDocument}
          existingProcedure={processedDocument.conflictingProcedure}
          onResolve={handleOverlapResolved}
        />
      )}
    </div>
  );
}
