'use client';

import { AnimatedAIChat } from '@/components/ui/animated-ai-chat';
import { MessageSquare, Shield, TrendingDown, FileText, Sparkles } from 'lucide-react';

export default function MSOChatPage() {
  // MSO-specific suggested prompts
  const msoSuggestions = [
    {
      icon: <TrendingDown className="w-4 h-4" />,
      label: "Which procedures have open CI signals?",
      description: "Review continuous improvement opportunities",
      prefix: "Which procedures have open CI signals?"
    },
    {
      icon: <Shield className="w-4 h-4" />,
      label: "What are the latest regulatory changes?",
      description: "Check compliance requirements",
      prefix: "What are the latest regulatory changes affecting my procedures?"
    },
    {
      icon: <FileText className="w-4 h-4" />,
      label: "Show compliance trends for procedures",
      description: "Analyze procedure compliance",
      prefix: "Show me compliance trends for maintenance procedures"
    },
    {
      icon: <Sparkles className="w-4 h-4" />,
      label: "Which procedures need regulation updates?",
      description: "Identify update requirements",
      prefix: "Which procedures need updating based on recent regulations?"
    },
  ];

  return (
    <div className="bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff0000] to-[#cc0000] flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1c2b40]">Opti - MS Owner Assistant</h1>
              <p className="text-sm text-gray-600 mt-1">
                AI-powered governance and compliance intelligence
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Interface with MSO-specific suggestions */}
      <div className="flex-1 overflow-hidden">
        <AnimatedAIChat customSuggestions={msoSuggestions} />
      </div>
    </div>
  );
}
