'use client';

import { TabletFrame } from '@/components/ui/TabletFrame';
import { MobileWorkOrder } from '@/components/ui/MobileWorkOrder';
import { useTourSafe } from '@/components/tour';

export default function FieldExperiencePage() {
  const tour = useTourSafe();

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

      {/* Tour Step 4 Guidance - Execute Task */}
      {tour?.isActive && tour?.currentStep === 5 && (
        <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 p-4 bg-gradient-to-r from-[#1c2b40] to-[#2d3e54] rounded-lg border-2 border-[#ff0000]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ff0000] flex items-center justify-center text-white font-bold flex-shrink-0">5</div>
              <div className="flex-1">
                <p className="text-white font-medium">Field Execution - Complete a Digital Checklist</p>
                <p className="text-gray-300 text-sm">
                  Here&apos;s where operational execution happens. A field worker receives an assigned task with a digital checklist
                  linked to {tour.selectedProcedureName ? `"${tour.selectedProcedureName}"` : 'the selected procedure'}.
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div className="p-2 bg-white/10 rounded border border-white/20">
                <p className="text-[#ff0000] font-medium">1. Review Steps</p>
                <p className="text-gray-300 text-xs">The procedure is pre-filled with your selected procedure</p>
              </div>
              <div className="p-2 bg-white/10 rounded border border-white/20">
                <p className="text-[#ff0000] font-medium">2. Check Off Steps</p>
                <p className="text-gray-300 text-xs">Complete each step as you would in the field</p>
              </div>
              <div className="p-2 bg-white/10 rounded border border-white/20">
                <p className="text-[#ff0000] font-medium">3. Submit Work Order</p>
                <p className="text-gray-300 text-xs">This creates real data that flows back into the system</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="w-full">
        <TabletFrame>
          <MobileWorkOrder />
        </TabletFrame>
      </main>
    </div>
  );
}
