'use client';

import { motion } from 'framer-motion';
import { TrendingDown, ChevronRight } from 'lucide-react';

interface CISignalBadgeProps {
  signal: {
    signal_id: string;
    severity: string;
  };
  onClick?: () => void;
}

export default function CISignalBadge({ signal, onClick }: CISignalBadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05, y: -2 }}
      className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold text-sm shadow-lg cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        <TrendingDown className="w-5 h-5" />
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
        />
      </div>
      <span>CI Signal {signal.signal_id}</span>
      <ChevronRight className="w-4 h-4" />
    </motion.div>
  );
}
