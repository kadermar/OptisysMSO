'use client';

import { useState } from 'react';
import { Search, Bell, User, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function MSOTopNav() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifications = [
    {
      id: 1,
      title: 'New CI Signal Detected',
      message: 'Procedure INT-031 has a new continuous improvement signal',
      time: '5 minutes ago',
      unread: true,
    },
    {
      id: 2,
      title: 'Regulation Update',
      message: 'OSHA Standard 1910.147 requires procedure updates',
      time: '1 hour ago',
      unread: true,
    },
    {
      id: 3,
      title: 'Procedure Version Published',
      message: 'Procedure MNT-202 v2.1 is now active',
      time: '3 hours ago',
      unread: false,
    },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search procedures, signals, regulations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff0000] focus:ring-2 focus:ring-red-100 transition-all"
              />
            </div>
          </div>

          {/* Right Side: Notifications and Profile */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowNotifications(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-40"
                    >
                      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-[#1c2b40]">Notifications</h3>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                              notif.unread ? 'bg-blue-50/50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                notif.unread ? 'bg-[#ff0000]' : 'bg-gray-300'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-[#1c2b40] mb-1">
                                  {notif.title}
                                </p>
                                <p className="text-sm text-gray-600 mb-2">
                                  {notif.message}
                                </p>
                                <p className="text-xs text-gray-500">{notif.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 bg-gray-50 border-t border-gray-200">
                        <button className="w-full text-center text-sm font-semibold text-[#ff0000] hover:text-[#cc0000] transition-colors">
                          View All Notifications
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 p-2 pl-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff0000] to-[#cc0000] flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-semibold text-[#1c2b40]">J. Berg</p>
                    <p className="text-xs text-gray-500">MS Owner</p>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {showProfileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-40"
                    >
                      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff0000] to-[#cc0000] flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-[#1c2b40]">J. Berg</p>
                            <p className="text-sm text-gray-600">MS Owner</p>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors">
                          <span className="font-medium text-gray-700">My Profile</span>
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors">
                          <span className="font-medium text-gray-700">Account Settings</span>
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors">
                          <span className="font-medium text-gray-700">Preferences</span>
                        </button>
                        <div className="border-t border-gray-200 my-2" />
                        <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors">
                          <span className="font-medium text-gray-700">Help & Support</span>
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 transition-colors">
                          <span className="font-medium text-[#ff0000]">Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
