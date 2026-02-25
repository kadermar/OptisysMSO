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

      {/* Main Content */}
      <main className="w-full">
        <TabletFrame>
          <MobileWorkOrder />
        </TabletFrame>
      </main>
    </div>
  );
}
