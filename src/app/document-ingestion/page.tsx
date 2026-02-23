'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTourSafe } from '@/components/tour/TourProvider';
import DocumentUploadZone from '@/components/documents/DocumentUploadZone';

export default function DocumentIngestionPage() {
  const tour = useTourSafe();
  const [uploadedDocument, setUploadedDocument] = useState<any>(null);

  const handleUploadComplete = (document: any) => {
    setUploadedDocument(document);

    // Notify tour if active
    if (tour?.isActive && tour.currentStep === 1) {
      tour.setUploadedDocument?.(document.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </motion.button>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff0000] to-[#cc0000] flex items-center justify-center shadow-lg">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-[#1c2b40]">Document Ingestion</h1>
                    <p className="text-sm text-gray-500">Upload governance documents</p>
                  </div>
                </div>
              </div>
            </div>

            {uploadedDocument && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold text-sm flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Document processed successfully
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tour Guidance */}
        {tour?.isActive && tour.currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-300"
          >
            <h3 className="text-sm font-bold text-blue-900 mb-2">📚 Step 1: Document Ingestion</h3>
            <p className="text-sm text-blue-800">
              Welcome to OptiSys! Before procedures can guide work, they must enter the system.
              Upload a sample document to see how it becomes part of the knowledge base.
            </p>
          </motion.div>
        )}

        {/* Upload Zone */}
        <DocumentUploadZone onUploadComplete={handleUploadComplete} />

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-[#1c2b40] mb-2">Supported Formats</h3>
            <p className="text-sm text-gray-600">
              Upload .docx, .pdf, or .txt files. Our AI extracts procedures, steps, and metadata automatically.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-[#1c2b40] mb-2">Auto-Tagging</h3>
            <p className="text-sm text-gray-600">
              Documents are automatically categorized and tagged with asset, domain, and risk level.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-bold text-[#1c2b40] mb-2">Overlap Detection</h3>
            <p className="text-sm text-gray-600">
              Conflicts with existing procedures are identified and can be merged with AI assistance.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
