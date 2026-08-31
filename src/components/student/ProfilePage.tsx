import React, { useState } from 'react';
import {
  User as UserIcon,
  Flame,
  Star,
  Coins,
  Award,
  Volume2,
  VolumeX,
  Sparkles,
  Eye,
  Type,
  CheckCircle2,
  Shield,
  RotateCcw,
  GraduationCap,
  Lock,
  Edit3,
  Quote
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { audioService } from '../../utils/audio';
import { UserAvatar } from '../common/UserAvatar';
import { EditProfileModal } from '../profile/EditProfileModal';

export const ProfilePage: React.FC = () => {
  const { currentUser, updateSettings, updateUserGrade, resetProgress, triggerKobiSpeech, streakInfo } = useApp();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const xpForNextLevel = 250;
  const currentXpInLevel = currentUser.xp % xpForNextLevel;
  const xpPercent = Math.round((currentXpInLevel / xpForNextLevel) * 100);

  const effectiveDisplayName = currentUser.nickname || currentUser.displayName || currentUser.name;
  const effectiveFullName = currentUser.fullName || currentUser.name;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in">
      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* Profile Header Hero */}
      <div className="p-6 sm:p-10 bg-gradient-to-r from-[#0058be] via-[#2170e4] to-[#407eff] rounded-[2.5rem] text-white shadow-xl flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="relative">
          <div className="p-1 rounded-full bg-white/30 backdrop-blur-md shadow-lg">
            <UserAvatar
              name={effectiveFullName}
              avatar={currentUser.avatarUrl || currentUser.avatar}
              avatarType={currentUser.avatarType}
              size="2xl"
              className="ring-4 ring-white shadow-md"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-amber-400 text-yellow-950 font-extrabold text-xs px-2.5 py-1 rounded-full border-2 border-white shadow-md">
            Lvl {currentUser.level}
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-2 min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-extrabold backdrop-blur-sm">
            <GraduationCap className="w-4 h-4 text-[#6ffbbe]" />
            {currentUser.role === 'student'
              ? `Siswa Kelas ${currentUser.grade} SD`
              : currentUser.role === 'teacher'
              ? 'Guru Informatika & CODESign'
              : 'Admin Kurikulum'} • {currentUser.school}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-center md:justify-start">
            <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-2xl sm:text-3xl truncate">
              {effectiveFullName}
            </h1>
            {currentUser.nickname && currentUser.nickname !== effectiveFullName && (
              <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-400/25 border border-emerald-300 text-white text-xs font-bold self-center md:self-auto">
                Panggilan: {currentUser.nickname}
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-white/80 font-semibold">
            Username: @{currentUser.username} • Terdaftar di CodeNusa
          </p>

          {/* Bio text if available */}
          {currentUser.bio && (
            <div className="pt-1">
              <p className="text-xs italic bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/20 inline-block text-white/95 max-w-xl">
                "{currentUser.bio}"
              </p>
            </div>
          )}

          {/* XP Progress Bar */}
          <div className="pt-2 max-w-md">
            <div className="flex justify-between text-xs font-bold text-white/90 mb-1">
              <span>XP Level {currentUser.level}</span>
              <span>{currentXpInLevel} / {xpForNextLevel} XP ({xpPercent}%)</span>
            </div>
            <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden p-0.5 border border-white/20">
              <div
                className="h-full bg-gradient-to-r from-[#4edea3] to-[#6ffbbe] rounded-full transition-all duration-500"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Stats & Ubah Profil Action Column */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center min-w-[85px]">
              <Star className="w-5 h-5 text-amber-300 fill-amber-300 mx-auto mb-1" />
              <p className="text-lg font-extrabold">{currentUser.stars}</p>
              <p className="text-[10px] text-white/70 font-bold uppercase">Bintang</p>
            </div>
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center min-w-[85px]">
              <Coins className="w-5 h-5 text-amber-300 fill-amber-300 mx-auto mb-1" />
              <p className="text-lg font-extrabold">{currentUser.coins}</p>
              <p className="text-[10px] text-white/70 font-bold uppercase">Koin</p>
            </div>
          </div>

          {/* Prominent Ubah Profil Button */}
          <button
            onClick={() => {
              setIsEditModalOpen(true);
              audioService.playPopSound();
            }}
            className="w-full px-4 py-2.5 bg-white text-[#0058be] hover:bg-emerald-50 hover:text-emerald-800 font-['Plus_Jakarta_Sans'] font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            id="btn-ubah-profil-main"
          >
            <Edit3 className="w-4 h-4" />
            <span>Ubah Profil</span>
          </button>
        </div>
      </div>

      {/* Grid: Activity Calendar + Accessibility Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Weekly Streak & Statistics (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 sm:p-8 bg-white rounded-3xl border-2 border-[#adc6ff] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
                <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-lg text-gray-900">
                  Semangat Belajar Mingguan
                </h3>
              </div>
              <span className="text-xs font-bold text-orange-700 bg-orange-100 px-3 py-1 rounded-full">
                🔥 {streakInfo.currentStreak} Hari Beruntun
              </span>
            </div>

            <p className="text-xs text-gray-500 font-semibold">
              Pertahankan streak belajar setiap hari untuk mendapatkan lencana khusus!
            </p>

            {/* Weekly Days circles */}
            <div className="grid grid-cols-7 gap-2 pt-2 text-center">
              {streakInfo.activeDaysThisWeek.map((day, idx) => {
                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition-all ${
                        day.active
                          ? 'bg-gradient-to-tr from-orange-400 to-amber-500 text-white shadow-md scale-105'
                          : day.isToday
                          ? 'bg-white border-2 border-orange-400 text-orange-600 ring-2 ring-orange-200'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {day.active ? '🔥' : day.isToday ? '●' : '○'}
                    </div>
                    <span className="text-[10px] font-bold text-gray-500">{day.dayName}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grade Level Display (Locked for Student, Editable for Teacher/Admin) */}
          <div className="p-6 bg-white rounded-3xl border border-[#e1e2ec] shadow-sm space-y-3">
            <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-base text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#0058be]" />
              Informasi Kelas & Kurikulum
            </h3>

            {currentUser.role === 'student' ? (
              <div className="p-4 bg-[#f2f3fd] rounded-2xl border border-[#adc6ff] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#0058be] uppercase tracking-wide">Tingkat Terdaftar</p>
                  <p className="font-['Plus_Jakarta_Sans'] font-extrabold text-lg text-gray-900">
                    Kelas {currentUser.grade} Sekolah Dasar
                  </p>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">
                    Materi dan tingkat kesulitan dikelola oleh Guru dan Pihak Sekolah.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white text-[#0058be] flex items-center justify-center shadow-sm" title="Terkunci untuk Siswa">
                  <Lock className="w-5 h-5" />
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-3">
                  Kelola dan pilih materi tingkat kelas yang aktif:
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {([1, 2, 3, 4, 5, 6] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => updateUserGrade(g)}
                      className={`py-3 rounded-2xl font-extrabold text-xs transition-all border-2 ${
                        currentUser.grade === g
                          ? 'bg-[#0058be] text-white border-[#0058be] shadow-md scale-105'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-[#adc6ff]'
                      }`}
                    >
                      Kelas {g}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Accessibility & Audio Settings (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#adc6ff] shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Sparkles className="w-5 h-5 text-[#0058be]" />
            <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-lg text-gray-900">
              Pengaturan Aksesibilitas & Audio
            </h3>
          </div>

          <div className="space-y-4">
            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div>
                <p className="font-bold text-sm text-gray-900">Efek Suara Interaktif</p>
                <p className="text-xs text-gray-500">Suara klik tombol, koin, dan lonceng kemenangan</p>
              </div>
              <button
                onClick={() => {
                  const nextVal = !currentUser.settings.soundEnabled;
                  updateSettings({ soundEnabled: nextVal });
                  if (nextVal) audioService.playCoinSound();
                }}
                aria-label={currentUser.settings.soundEnabled ? 'Matikan Efek Suara' : 'Nyalakan Efek Suara'}
                className={`w-12 h-7 rounded-full transition-colors relative p-1 ${
                  currentUser.settings.soundEnabled ? 'bg-[#0058be]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    currentUser.settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Narration Voice */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div>
                <p className="font-bold text-sm text-gray-900">Suara Narasi Robot Kobi</p>
                <p className="text-xs text-gray-500">Membacakan teks konsep dan petunjuk dalam bahasa Indonesia</p>
              </div>
              <button
                onClick={() => {
                  const nextVal = !currentUser.settings.narrationVoiceEnabled;
                  updateSettings({ narrationVoiceEnabled: nextVal });
                  if (nextVal) triggerKobiSpeech('Suara narasi diaktifkan!', 'happy', true);
                }}
                aria-label={currentUser.settings.narrationVoiceEnabled ? 'Matikan Suara Kobi' : 'Nyalakan Suara Narasi Kobi'}
                className={`w-12 h-7 rounded-full transition-colors relative p-1 ${
                  currentUser.settings.narrationVoiceEnabled ? 'bg-[#0058be]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    currentUser.settings.narrationVoiceEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Reduce Motion */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div>
                <p className="font-bold text-sm text-gray-900">Kurangi Gerakan Animasi</p>
                <p className="text-xs text-gray-500">Cocok untuk kenyamanan penglihatan yang sensitif</p>
              </div>
              <button
                onClick={() => updateSettings({ reduceMotion: !currentUser.settings.reduceMotion })}
                aria-label="Pengaturan Kurangi Gerakan Animasi"
                className={`w-12 h-7 rounded-full transition-colors relative p-1 ${
                  currentUser.settings.reduceMotion ? 'bg-[#0058be]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    currentUser.settings.reduceMotion ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Dyslexic Friendly Font */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div>
                <p className="font-bold text-sm text-gray-900">Huruf Mudah Dibaca (Dyslexic-friendly)</p>
                <p className="text-xs text-gray-500">Spasi huruf dan bobot yang dioptimalkan untuk membaca</p>
              </div>
              <button
                onClick={() => updateSettings({ dyslexicFont: !currentUser.settings.dyslexicFont })}
                aria-label="Pengaturan Huruf Dyslexic-Friendly"
                className={`w-12 h-7 rounded-full transition-colors relative p-1 ${
                  currentUser.settings.dyslexicFont ? 'bg-[#0058be]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    currentUser.settings.dyslexicFont ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Reset Demo Progress Button */}
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={resetProgress}
              className="text-xs font-bold text-gray-400 hover:text-red-600 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Progres Akun ke Nilai Awal Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
