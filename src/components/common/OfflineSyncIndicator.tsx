import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OfflineSyncModal } from './OfflineSyncModal';

export const OfflineSyncIndicator: React.FC = () => {
  const { networkStatus, isOffline } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all border shadow-xs ${
          isOffline
            ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 hover:border-amber-400'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
        }`}
        title="Klik untuk membuka Pengaturan & Status Sinkronisasi Offline"
      >
        <span className="relative flex h-2 w-2">
          {isOffline ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </>
          ) : (
            <>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          )}
        </span>

        {isOffline ? (
          <span className="flex items-center gap-1">
            <WifiOff className="w-3 h-3 text-amber-600" />
            <span>Mode Offline</span>
            {networkStatus.pendingSyncCount > 0 && (
              <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                {networkStatus.pendingSyncCount}
              </span>
            )}
          </span>
        ) : (
          <span className="flex items-center gap-1">
            {networkStatus.isSyncing ? (
              <>
                <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin" />
                <span>Sinkronisasi...</span>
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 text-emerald-600" />
                <span className="hidden sm:inline">Online</span>
              </>
            )}
          </span>
        )}
      </button>

      <OfflineSyncModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
