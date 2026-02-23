'use client';

import { AnimatedAIChat } from '@/components/ui/animated-ai-chat';
import { useTourSafe } from '@/components/tour';

export default function ChatPage() {
  const tour = useTourSafe();

  // Generate suggested question based on selected procedure
  const suggestedQuestion = tour?.selectedProcedureName
    ? `What are the compliance trends for ${tour.selectedProcedureName}?`
    : 'What procedures have the highest compliance rates?';

  return (
    <div className={`bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 flex flex-col overflow-hidden ${
      tour?.isActive ? 'h-[calc(100vh-176px)]' : 'h-screen'
    }`}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 flex-shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1c2b40]">Opti</h1>
            <p className="text-sm text-gray-600 mt-1">
              AI-powered operational intelligence assistant
            </p>
          </div>
        </div>
      </header>

      {/* Tour Step 2 Guidance */}
      {tour?.isActive && tour?.currentStep === 3 && (
        <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 p-4 bg-gradient-to-r from-[#1c2b40] to-[#2d3e54] rounded-lg border-2 border-[#ff0000] flex-shrink-0">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ff0000] flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
              <div className="flex-1">
                <p className="text-white font-medium">AI Copilot - Natural Language Interface</p>
                <p className="text-gray-300 text-sm">Ask questions about procedures, compliance trends, or operational performance. The AI has access to all your data.</p>
              </div>
            </div>
            {tour.selectedProcedureName && (
              <div className="mt-3 p-3 bg-white/10 rounded border border-white/20">
                <p className="text-gray-300 text-sm mb-2">Try asking:</p>
                <p className="text-[#ff0000] font-medium">"{suggestedQuestion}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <AnimatedAIChat />
      </div>
    </div>
  );
}
