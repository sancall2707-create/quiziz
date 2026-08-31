import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  HardDrive,
  Clock,
  ShieldCheck,
  Zap,
  X,
  AlertTriangle,
  Layers,
  Sparkles,
  Award
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface OfflineSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineSyncModal: React.FC<OfflineSyncModalProps> = ({ isOpen, onClose }) => {
  const { networkStatus, offlineQueue, toggleSimulatedOffline, syncOfflineData, isOffline } = useApp();

  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return 'Belum pernah';
    const d = new Date(isoString);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + 
      ', ' + d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col z-10"
        >
          {/* Header */}
          <div className={`p-5 flex items-center justify-between border-b ${
            isOffline 
              ? 'bg-amber-500/10 border-amber-200/60 text-amber-900' 
              : 'bg-emerald-500/10 border-emerald-200/60 text-emerald-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-sm ${
                isOffline 
                  ? 'bg-amber-500 text-white shadow-amber-500/20' 
                  : 'bg-emerald-600 text-white shadow-emerald-500/20'
              }`}>
                {isOffline ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {isOffline ? 'Status Koneksi: Mode Offline' : 'Status Koneksi: Online & Tersinkron'}
                </h3>
                <p className="text-xs opacity-80 font-medium">
                  {isOffline
                    ? 'Progres koding & petualangan disimpan aman di perangkat'
                    : 'Semua kemajuan tersinkron otomatis ke server'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/5 text-slate-500 transition-colors"
              aria-label="Tutup modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-5 text-sm">
            {/* Quick Status Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  Service Worker
                </div>
                <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {networkStatus.serviceWorkerActive ? 'Aktif (PWA Ready)' : 'Aktif (Cache v1)'}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  Antrean Offline
                </div>
                <div className="font-bold text-slate-800 text-sm">
                  {networkStatus.pendingSyncCount > 0 ? (
                    <span className="text-amber-600 font-extrabold">{networkStatus.pendingSyncCount} Item Tertunda</span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">Semua Tersinkron</span>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 col-span-2 sm:col-span-1">
                <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
                  Memori Lokal
                </div>
                <div className="font-bold text-slate-800 text-sm">
                  {networkStatus.storageEstimate
                    ? `${formatBytes(networkStatus.storageEstimate.usedBytes)}`
                    : 'Tersedia'}
                </div>
              </div>
            </div>

            {/* Offline Simulation Switch */}
            <div className="bg-gradient-to-r from-blue-50/60 to-indigo-50/60 p-4 rounded-xl border border-blue-100 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  Simulasi Mode Offline (Uji Coba)
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Uji coba bermain misi, Studio Coding, dan kuis tanpa koneksi internet untuk melihat bagaimana data disimpan secara lokal.
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleSimulatedOffline()}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  networkStatus.isSimulatedOffline ? 'bg-amber-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    networkStatus.isSimulatedOffline ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Pending Queue List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  Daftar Progres Tersimpan Sementara ({offlineQueue.length})
                </h4>
                {offlineQueue.length > 0 && (
                  <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Menunggu koneksi stabil
                  </span>
                )}
              </div>

              {offlineQueue.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-500">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                  <p className="font-semibold text-slate-700">Tidak ada data tertunda</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Seluruh misi yang telah kamu selesaikan sudah tersinkron rapi.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {offlineQueue.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                          {item.type === 'mission_complete' ? (
                            <Award className="w-4 h-4" />
                          ) : item.type === 'coding_project' ? (
                            <Sparkles className="w-4 h-4" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{item.title}</div>
                          <div className="text-slate-500 text-[11px]">{item.subtitle}</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          Disimpan Lokal
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sync Timestamp and Explanation */}
            <div className="text-xs text-slate-500 flex items-center justify-between border-t pt-3 border-slate-100">
              <div>
                Sinkronisasi terakhir: <span className="font-semibold text-slate-700">{formatTime(networkStatus.lastSyncedAt)}</span>
              </div>
              <div className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Dukungan PWA Service Worker Aktif
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Tutup
            </button>

            <button
              disabled={networkStatus.isSyncing}
              onClick={() => syncOfflineData()}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all ${
                networkStatus.isSyncing
                  ? 'bg-blue-300 text-white cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-98 text-white shadow-blue-500/20'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${networkStatus.isSyncing ? 'animate-spin' : ''}`} />
              {networkStatus.isSyncing ? 'Menyinkronkan Data...' : 'Sinkronkan Sekarang'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
