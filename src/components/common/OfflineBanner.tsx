import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Layers, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OfflineSyncModal } from './OfflineSyncModal';

export const OfflineBanner: React.FC = () => {
  const { isOffline, networkStatus } = useApp();
  const [showModal, setShowModal] = useState(false);

  if (!isOffline) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white px-4 py-2 text-xs shadow-md"
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-white/20">
                <WifiOff className="w-3.5 h-3.5" />
              </span>
              <span className="font-bold">Mode Offline Aktif (Service Worker Ready):</span>
              <span className="opacity-95 hidden sm:inline">
                Aplikasi tetap berjalan lancar tanpa koneksi internet. Progres misimu disimpan aman di memori lokal.
              </span>
            </div>

            <div className="flex items-center gap-2">
              {networkStatus.pendingSyncCount > 0 && (
                <span className="bg-white/20 text-white font-bold px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  {networkStatus.pendingSyncCount} Progres Tersimpan Lokal
                </span>
              )}
              <button
                onClick={() => setShowModal(true)}
                className="bg-white text-amber-900 font-bold px-2.5 py-1 rounded-lg hover:bg-amber-50 active:scale-95 transition-all text-[11px] flex items-center gap-1 shadow-xs"
              >
                <span>Kelola Sinkronisasi</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <OfflineSyncModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};
