'use client';

import { motion } from 'framer-motion';
import { BookOpen, FileText, Shield, TrendingDown, Sparkles } from 'lucide-react';

export default function MSODocsPage() {
  const docSections = [
    {
      title: 'Getting Started',
      icon: BookOpen,
      items: [
        { title: 'MSO Portal Overview', desc: 'Introduction to the Management System Owner portal' },
        { title: 'Quick Start Guide', desc: 'Get up and running in 5 minutes' },
        { title: 'Navigation & Features', desc: 'Understanding the interface and workflows' }
      ]
    },
    {
      title: 'CI Signals',
      icon: TrendingDown,
      items: [
        { title: 'Understanding CI Signals', desc: 'How signals are generated from field data' },
        { title: 'Reviewing Signals', desc: 'Best practices for signal analysis' },
        { title: 'Addressing Signals', desc: 'Updating procedures based on insights' }
      ]
    },
    {
      title: 'Regulatory Compliance',
      icon: Shield,
      items: [
        { title: 'Regulation Monitoring', desc: 'How new regulations are detected' },
        { title: 'AI-Proposed Changes', desc: 'Understanding AI compliance recommendations' },
        { title: 'Approval Workflow', desc: 'Review and approve procedure updates' }
      ]
    },
    {
      title: 'AI Features',
      icon: Sparkles,
      items: [
        { title: 'AI Recommendations', desc: 'How AI analyzes procedures and generates insights' },
        { title: 'Confidence Scores', desc: 'Understanding AI confidence levels' },
        { title: 'Customizing AI', desc: 'Training AI on your specific requirements' }
      ]
    }
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1c2b40] mb-2">Documentation</h1>
        <p className="text-gray-600">Learn how to use the MS Owner portal effectively</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {docSections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff0000] to-[#cc0000] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-[#1c2b40]">{section.title}</h2>
              </div>

              <div className="space-y-3">
                {section.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5 group-hover:text-[#ff0000] transition-colors" />
                      <div>
                        <h3 className="text-sm font-semibold text-[#1c2b40] group-hover:text-[#ff0000] transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Reference Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200"
      >
        <h3 className="text-lg font-bold text-[#1c2b40] mb-4">Quick Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-semibold text-blue-900 mb-2">Key Workflows</p>
            <ul className="space-y-1 text-blue-800">
              <li>• Review CI Signal → Edit Procedure → Publish Version</li>
              <li>• Review Regulation → Approve Changes → Update Procedures</li>
              <li>• Monitor Dashboard → Take Action → Measure Impact</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-blue-900 mb-2">Keyboard Shortcuts</p>
            <ul className="space-y-1 text-blue-800">
              <li>• <kbd className="px-2 py-0.5 bg-white rounded">D</kbd> Dashboard</li>
              <li>• <kbd className="px-2 py-0.5 bg-white rounded">P</kbd> Procedures</li>
              <li>• <kbd className="px-2 py-0.5 bg-white rounded">S</kbd> CI Signals</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-blue-900 mb-2">Support</p>
            <ul className="space-y-1 text-blue-800">
              <li>• Email: mso-support@optisys.com</li>
              <li>• Phone: 1-800-OPTISYS</li>
              <li>• Status: status.optisys.com</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
