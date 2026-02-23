'use client';

import { TabletFrame } from '@/components/ui/TabletFrame';
import { MobileWorkOrder } from '@/components/ui/MobileWorkOrder';

export default function MSOFieldExperiencePage() {
  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-300 animate-fadeIn">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1c2b40]">Field Experience</h1>
            <p className="text-sm text-gray-600 mt-1">
              Mobile tablet interface for field workers to manage work orders
            </p>
          </div>
        </div>
      </header>

      {/* Info Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-blue-900 mb-1">MS Owner View</h3>
              <p className="text-sm text-blue-800">
                This is the same interface field workers use on mobile tablets. Work orders created here automatically update procedure metrics and trigger CI signals when performance thresholds are exceeded.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full">
        <TabletFrame>
          <MobileWorkOrder />
        </TabletFrame>
      </main>
    </div>
  );
}
