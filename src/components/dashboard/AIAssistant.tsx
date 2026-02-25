'use client';

import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  dashboardData: {
    summary: any;
    procedures: any[];
    correlation: any[];
    facilities: any[];
    workOrders: any[];
    workers: any[];
    ciSignals?: any[];
  };
}

export function AIAssistant({ dashboardData }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your OptiSys AI Assistant. I can help you understand patterns in your management system data. Try asking me:\n\n• Why did procedure X fail?\n• What's the correlation between compliance and incidents?\n• Which workers need training?\n• How can we improve safety performance?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const suggestedQuestions = [
    "Why do LOTO procedures have the best compliance?",
    "Which facilities need the most improvement?",
    "What's causing high rework rates?",
    "How does worker experience affect quality?",
  ];

  const handleSendMessage = async (question?: string) => {
    const messageText = question || inputValue.trim();
    if (!messageText || isLoading) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call AI Assistant API
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' },
        body: JSON.stringify({
          question: messageText,
          dashboardData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your question. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold dark:text-white">AI Assistant</h2>
        <p className="text-gray-600 dark:text-gray-400">Ask questions about your data and get insights</p>
      </div>

      <div className="bg-white dark:bg-gray-700 rounded-lg border-2 border-blue-200 dark:border-blue-700">
        {/* Chat Messages */}
        <div className="h-64 sm:h-80 md:h-96 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">
                    {message.role === 'user' ? '👤' : '🤖'}
                  </span>
                  <div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-600 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <div className="flex gap-1">
                    <span className="animate-bounce dark:text-white">●</span>
                    <span className="animate-bounce delay-100 dark:text-white">●</span>
                    <span className="animate-bounce delay-200 dark:text-white">●</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4">
            <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Suggested questions:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(question)}
                  className="text-left text-xs sm:text-sm p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-700 transition-colors dark:text-gray-300"
                  disabled={isLoading}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t dark:border-gray-600 p-3 sm:p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 text-sm">
        <p className="font-semibold mb-2 dark:text-white">💡 How it works:</p>
        <p className="text-gray-700 dark:text-gray-300">
          The AI Assistant analyzes your dashboard data in real-time to provide insights about procedures,
          compliance patterns, worker performance, and safety metrics. Ask natural language questions to
          uncover hidden trends and get actionable recommendations.
        </p>
      </div>
    </div>
  );
}
