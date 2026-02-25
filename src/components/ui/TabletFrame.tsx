'use client';

import { ReactNode } from 'react';
import { InteractiveMenu } from './modern-mobile-menu';

interface TabletFrameProps {
  children: ReactNode;
}

export function TabletFrame({ children }: TabletFrameProps) {
  return (
    <div className="flex items-center justify-center p-8">
      {/* Tablet Device Frame */}
      <div className="relative">
        {/* Tablet Shadow */}
        <div className="absolute inset-0 bg-black/20 blur-2xl transform translate-y-4"></div>

        {/* Tablet Body */}
        <div className="relative bg-[#1c2b40] rounded-[2rem] p-3 shadow-2xl">
          {/* Screen */}
          <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-inner" style={{ width: '576px', height: '768px' }}>
            {/* Status Bar */}
            <div className="bg-[#f8f9fa] border-b border-gray-200 px-6 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-[#1c2b40]">9:41</span>
              </div>
              <div className="flex items-center space-x-3">
                {/* Signal */}
                <svg className="w-4 h-4 text-[#1c2b40]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 22h4V10H2v12zm6 0h4V2H8v20zm6 0h4v-8h-4v8zm6 0h4v-4h-4v4z"/>
                </svg>
                {/* WiFi */}
                <svg className="w-4 h-4 text-[#1c2b40]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                </svg>
                {/* Battery */}
                <div className="flex items-center">
                  <svg className="w-6 h-4 text-[#1c2b40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="1" y="6" width="18" height="12" rx="2" ry="2" strokeWidth="2"/>
                    <rect x="3" y="8" width="14" height="8" fill="currentColor"/>
                    <path d="M19 10v4" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* App Content */}
            <div className="flex flex-col h-[calc(100%-40px)]">
              <div className="flex-1 overflow-y-auto bg-gray-50">
                {children}
              </div>
              {/* Bottom Navigation Menu */}
              <InteractiveMenu accentColor="#ff0000" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
