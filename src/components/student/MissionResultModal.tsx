import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Star,
  Coins,
  Award,
  Sparkles,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  HardDrive,
  WifiOff
} from 'lucide-react';
import { KobiCharacter } from '../common/KobiCharacter';
import { Badge } from '../../types';
import { audioService } from '../../utils/audio';

interface MissionResultModalProps {
  isOpen: boolean;
  missionTitle: string;
  starsEarned: number;
  score: number;
  xpEarned: number;
  coinsEarned: number;
  newBadge?: Badge;
  isOfflineSaved?: boolean;
  onContinue: () => void;
  onReplay: () => void;
}

export const MissionResultModal: React.FC<MissionResultModalProps> = ({
  isOpen,
  missionTitle,
  starsEarned,
  score,
  xpEarned,
  coinsEarned,
  newBadge,
  isOfflineSaved,
  onContinue,
  onReplay
}) => {
  useEffect(() => {
    if (isOpen) {
      // Trigger festive confetti explosion
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      audioService.playFanfare();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] border-4 border-[#adc6ff] shadow-2xl p-6 sm:p-10 text-center overflow-hidden animate-in zoom-in-95">
        {/* Background celebration radial glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 via-white to-amber-50/50 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Master Emblem */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-yellow-950 font-['Plus_Jakarta_Sans'] font-extrabold text-xs tracking-wider shadow-md">
            <Sparkles className="w-4 h-4 fill-yellow-950" />
            MISI SELESAI DENGAN SEMPURNA!
          </div>

          <h2 className="font-['Plus_Jakarta_Sans'] font-extrabold text-2xl sm:text-3xl text-gray-900 leading-tight">
            {missionTitle}
          </h2>

          {/* 3 Animated Golden Stars */}
          <div className="flex justify-center items-center gap-3 py-2">
            {[1, 2, 3].map((starIdx) => (
              <div
                key={starIdx}
                className={`p-3 rounded-full shadow-lg transition-transform duration-500 ${
                  starIdx <= starsEarned
                    ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 scale-110 rotate-3'
                    : 'bg-gray-200'
                }`}
              >
                <Star
                  className={`w-8 h-8 ${
                    starIdx <= starsEarned ? 'text-white fill-white' : 'text-gray-400 fill-gray-400'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Kobi Mascot with speech bubble */}
          <div className="flex justify-center">
            <KobiCharacter
              size="md"
              mood="celebrating"
              showSpeech={true}
              speechText="Bagus sekali! Logika dan ketepatanmu sangat luar biasa!"
              interactive={true}
            />
          </div>

          {/* Rewards Breakdown Grid */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-white/90 rounded-2xl border-2 border-[#adc6ff] shadow-sm">
            <div className="text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase">XP Diperoleh</p>
              <p className="text-base font-extrabold text-[#0058be]">+{xpEarned}</p>
            </div>
            <div className="text-center border-x border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Bintang</p>
              <p className="text-base font-extrabold text-purple-700 flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-purple-600" />
                +{starsEarned}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Koin Emas</p>
              <p className="text-base font-extrabold text-amber-600 flex items-center justify-center gap-1">
                <Coins className="w-4 h-4 fill-amber-500" />
                +{coinsEarned}
              </p>
            </div>
          </div>

          {/* Offline Save Notice or Cloud Synced Notice */}
          {isOfflineSaved ? (
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-300 text-amber-900 text-xs flex items-center gap-2.5 text-left">
              <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <p className="font-extrabold text-[11px] uppercase tracking-wider text-amber-800">
                  💾 Disimpan Sementara di Memori Perangkat
                </p>
                <p className="text-[11px] text-amber-700">
                  Mode offline aktif. Bintang dan XP-mu tetap aman dan akan otomatis disinkronkan saat koneksi kembali!
                </p>
              </div>
            </div>
          ) : (
            <div className="px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] flex items-center justify-center gap-1.5 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Progres Tersinkronisasi Otomatis ke Cloud
            </div>
          )}

          {/* New Badge Unlocked Notice if any */}
          {newBadge && (
            <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 flex items-center gap-3 text-left">
              <span className="text-3xl">🏅</span>
              <div>
                <p className="text-[11px] font-extrabold text-amber-800 uppercase">Lencana Baru Terbuka!</p>
                <p className="text-xs font-bold text-gray-900">{newBadge.title}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={onReplay}
              className="w-full sm:w-1/3 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm rounded-full transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Ulangi
            </button>

            <button
              onClick={onContinue}
              className="w-full sm:w-2/3 py-4 bg-[#0058be] hover:bg-[#2170e4] text-white font-['Plus_Jakarta_Sans'] font-extrabold text-base rounded-full tactile-btn shadow-xl flex items-center justify-center gap-2"
            >
              Lanjutkan Petualangan
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
