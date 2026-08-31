import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  Lock,
  CheckCircle2,
  Palette,
  ShieldCheck,
  Star,
  Coins
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BADGES_DATA } from '../../data/mockData';
import { KobiCharacter } from '../common/KobiCharacter';
import { audioService } from '../../utils/audio';

export const CollectionPage: React.FC = () => {
  const { currentUser, triggerKobiSpeech } = useApp();
  const [activeTab, setActiveTab] = useState<'badges' | 'wardrobe' | 'certificates'>('badges');

  const [selectedSkin, setSelectedSkin] = useState<string>(currentUser.kobiCustomization.skin || 'blue-classic');
  const [selectedHat, setSelectedHat] = useState<string>(currentUser.kobiCustomization.hat || 'none');

  const hats = [
    { id: 'none', label: 'Tanpa Topi', icon: '🤖', price: 0, unlocked: true },
    { id: 'cap-techno', label: 'Topi Coder', icon: '🧢', price: 50, unlocked: true },
    { id: 'flower-crown', label: 'Mahkota Bunga', icon: '🌸', price: 100, unlocked: currentUser.coins >= 100 },
    { id: 'wizard-hat', label: 'Topi Penyihir', icon: '🧙‍♂️', price: 250, unlocked: currentUser.coins >= 250 },
    { id: 'crown-gold', label: 'Mahkota Juara Emas', icon: '👑', price: 500, unlocked: currentUser.coins >= 500 }
  ];

  const handleEquipHat = (hatId: string) => {
    setSelectedHat(hatId);
    audioService.playCoinSound();
    triggerKobiSpeech('Gaya Kobi diperbarui! Keren sekali!', 'happy', true);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#e1e2ec] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-2xl sm:text-3xl text-gray-900">
              Koleksi & Ruang Hadiah
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 font-semibold mt-0.5">
            Lencana pencapaian, sertifikat resmi, dan lemari pakaian Kobi
          </p>
        </div>

        {/* Tab switcher */}
        <div className="bg-[#f2f3fd] p-1.5 rounded-full border border-[#adc6ff] flex items-center self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all ${
              activeTab === 'badges' ? 'bg-[#0058be] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🏅 Lencana ({currentUser.badges.length})
          </button>
          <button
            onClick={() => setActiveTab('wardrobe')}
            className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all ${
              activeTab === 'wardrobe' ? 'bg-[#0058be] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🎨 Kostum Kobi
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all ${
              activeTab === 'certificates' ? 'bg-[#0058be] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📜 Sertifikat
          </button>
        </div>
      </div>

      {/* 1. BADGES SHOWCASE */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BADGES_DATA.map(badge => {
            const isUnlocked = currentUser.badges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`p-6 rounded-3xl border-2 transition-all flex flex-col justify-between tactile-card ${
                  isUnlocked
                    ? 'bg-white border-[#adc6ff] shadow-md'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
                        isUnlocked ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {badge.category === 'hardware' ? '💻' : badge.category === 'coding' ? '🚀' : badge.category === 'logic' ? '🧠' : badge.category === 'streak' ? '🔥' : '✨'}
                    </div>

                    {isUnlocked ? (
                      <span className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Terbuka
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-extrabold text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                        <Lock className="w-3.5 h-3.5" />
                        Terkunci
                      </span>
                    )}
                  </div>

                  <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-lg text-gray-900 mb-1">
                    {badge.title}
                  </h3>
                  <p className="text-xs font-bold text-[#0058be] mb-2">{badge.subtitle}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 text-[11px] text-gray-400 font-semibold flex items-center justify-between">
                  <span className="capitalize">Kategori: {badge.category}</span>
                  <span className="capitalize font-bold text-amber-600">{badge.rarity}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. WARDROBE / KOBI CUSTOMIZATION */}
      {activeTab === 'wardrobe' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Kobi Preview Avatar */}
          <div className="lg:col-span-5 bg-gradient-to-b from-blue-50 to-indigo-50/50 p-8 rounded-[2.5rem] border-2 border-[#adc6ff] shadow-md flex flex-col items-center text-center">
            <div className="relative mb-6">
              <KobiCharacter size="xl" mood="celebrating" interactive={true} />
              {selectedHat !== 'none' && (
                <div className="absolute top-0 right-1/2 translate-x-1/2 -mt-4 text-4xl animate-bounce">
                  {hats.find(h => h.id === selectedHat)?.icon}
                </div>
              )}
            </div>

            <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl text-gray-900">
              Robot Kobi Kamu
            </h3>
            <p className="text-xs text-gray-500 font-semibold mt-1 mb-4">
              Kustomisasi aksesoris dan tampilan Kobi dengan koin emas belajarmu
            </p>

            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#adc6ff] shadow-sm">
              <Coins className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-xs font-extrabold text-gray-800">Saldo Koin: {currentUser.coins}</span>
            </div>
          </div>

          {/* Wardrobe Items */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-[2.5rem] border-2 border-[#adc6ff] shadow-sm space-y-6">
            <div>
              <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-lg text-gray-900 mb-1">
                Pilihan Aksesoris Topi
              </h3>
              <p className="text-xs text-gray-500 font-semibold">Pilih topi untuk dipasang pada robot Kobi</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hats.map(h => (
                <button
                  key={h.id}
                  onClick={() => handleEquipHat(h.id)}
                  disabled={!h.unlocked}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                    selectedHat === h.id
                      ? 'bg-blue-50 border-[#0058be] shadow-sm'
                      : h.unlocked
                      ? 'bg-white border-gray-200 hover:border-[#adc6ff]'
                      : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{h.icon}</span>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{h.label}</p>
                      <p className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                        <Coins className="w-3 h-3 fill-amber-500" />
                        {h.price === 0 ? 'Gratis' : `${h.price} Koin`}
                      </p>
                    </div>
                  </div>

                  {selectedHat === h.id ? (
                    <span className="text-xs font-bold text-[#0058be] bg-[#d8e2ff] px-2.5 py-1 rounded-full">
                      Dipakai
                    </span>
                  ) : h.unlocked ? (
                    <span className="text-xs font-bold text-gray-600 hover:text-[#0058be]">
                      Pakai
                    </span>
                  ) : (
                    <Lock className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 bg-gradient-to-br from-amber-50/70 via-white to-amber-100/40 rounded-[2.5rem] border-4 border-amber-300 shadow-xl relative overflow-hidden">
            <div className="absolute top-4 right-4 text-4xl opacity-20">📜</div>
            <div className="space-y-4">
              <span className="text-[10px] font-extrabold tracking-widest text-amber-800 uppercase bg-amber-200/80 px-3 py-1 rounded-full">
                Sertifikat Kelulusan Bab 1
              </span>
              <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-2xl text-gray-900">
                Informatika Dasar: Perangkat Digital
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                Diberikan kepada <span className="font-bold text-gray-900">{currentUser.name}</span> atas keberhasilan menyelesaikan seluruh misi Pulau Perangkat Digital dengan predikat Memuaskan.
              </p>
              <div className="pt-4 border-t border-amber-200 flex items-center justify-between text-xs text-amber-900 font-bold">
                <span>Terverifikasi CodeNusa & Sokrates</span>
                <span>Agustus 2026</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
