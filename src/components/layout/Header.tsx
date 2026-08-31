import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  Coins,
  Bell,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
  UserCheck,
  GraduationCap,
  Flame,
  LogOut,
  User,
  Edit3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { audioService } from '../../utils/audio';
import { OfflineSyncIndicator } from '../common/OfflineSyncIndicator';
import { UserAvatar } from '../common/UserAvatar';
import { EditProfileModal } from '../profile/EditProfileModal';

export const Header: React.FC = () => {
  const { currentUser, updateSettings, triggerKobiSpeech, allUsers, switchUser, streakInfo, logout } = useApp();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleSound = () => {
    const nextVal = !currentUser.settings.soundEnabled;
    updateSettings({ soundEnabled: nextVal });
    if (nextVal) {
      audioService.playCoinSound();
    }
  };

  const toggleVoice = () => {
    const nextVal = !currentUser.settings.narrationVoiceEnabled;
    updateSettings({ narrationVoiceEnabled: nextVal });
    if (nextVal) {
      triggerKobiSpeech('Suara narasi Kobi diaktifkan!', 'happy', true);
    }
  };

  const handleSwitchAccount = (targetUserId: string) => {
    const targetUser = allUsers.find(u => u.id === targetUserId);
    switchUser(targetUserId);
    setShowUserDropdown(false);
    audioService.playSnapSound();

    if (targetUser) {
      if (targetUser.role === 'student') {
        navigate('/student/home');
      } else if (targetUser.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else if (targetUser.role === 'admin') {
        navigate('/admin/dashboard');
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between w-full px-4 md:px-8 py-3 bg-[#f9f9ff]/90 backdrop-blur-md border-b border-[#e1e2ec]">
      {/* Left side: Mobile Brand & Static Grade indicator for student or Role indicator */}
      <div className="flex items-center gap-3">
        <div
          className="md:hidden flex items-center gap-2 cursor-pointer"
          onClick={() => {
            if (currentUser.role === 'student') navigate('/student/home');
            else if (currentUser.role === 'teacher') navigate('/teacher/dashboard');
            else navigate('/admin/dashboard');
          }}
        >
          <div className="w-10 h-10 bg-[#0058be] rounded-full flex items-center justify-center text-white shadow-sm">
            <span className="font-bold text-lg">🤖</span>
          </div>
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl text-[#0058be] tracking-tight">CodeNusa</h1>
          </div>
        </div>

        {/* Grade Badge for Students (Locked - non-editable by student as per requirements) */}
        {currentUser.role === 'student' && (
          <div
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#d8e2ff] text-[#001a42] rounded-full font-bold text-xs md:text-sm shadow-sm border border-[#adc6ff]"
            title="Kelas Siswa Terdaftar"
          >
            <GraduationCap className="w-4 h-4 text-[#0058be]" />
            <span>Kelas {currentUser.grade} SD</span>
          </div>
        )}

        {/* Role badge for Teacher/Admin */}
        {currentUser.role !== 'student' && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300">
            <UserCheck className="w-3.5 h-3.5" />
            Mode {currentUser.role === 'teacher' ? 'Guru' : 'Admin'}
          </span>
        )}
      </div>

      {/* Right side stats and profile bar */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Offline / Online Sync Indicator */}
        <OfflineSyncIndicator />

        {/* Audio Controls */}
        <div className="hidden sm:flex items-center gap-1 bg-white p-1 rounded-full shadow-sm border border-[#e1e2ec]">
          <button
            onClick={toggleSound}
            aria-label={currentUser.settings.soundEnabled ? 'Matikan Efek Suara' : 'Nyalakan Efek Suara'}
            title={currentUser.settings.soundEnabled ? 'Matikan Efek Suara' : 'Nyalakan Efek Suara'}
            className={`p-1.5 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-[#0058be] ${
              currentUser.settings.soundEnabled ? 'text-[#0058be] bg-[#d8e2ff]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {currentUser.settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleVoice}
            aria-label={currentUser.settings.narrationVoiceEnabled ? 'Matikan Suara Kobi' : 'Nyalakan Suara Narasi Kobi'}
            title={currentUser.settings.narrationVoiceEnabled ? 'Matikan Suara Kobi' : 'Nyalakan Suara Narasi Kobi'}
            className={`p-1.5 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-[#0058be] ${
              currentUser.settings.narrationVoiceEnabled ? 'text-purple-700 bg-[#e9ddff]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>

        {/* Streak Counter for Students */}
        {currentUser.role === 'student' && (
          <div
            onClick={() => navigate('/student/profile')}
            className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-300 px-3 py-1.5 rounded-full shadow-sm text-orange-800 font-bold text-sm cursor-pointer hover:scale-105 transition-transform"
            title="Streak Belajar Harian"
          >
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span>{streakInfo.currentStreak} Hari</span>
          </div>
        )}

        {/* Stars Widget */}
        <div
          onClick={() => {
            if (currentUser.role === 'student') navigate('/student/collection');
          }}
          className="flex items-center gap-1.5 bg-[#e9ddff] px-3 py-1.5 rounded-full hover:scale-105 transition-transform cursor-pointer shadow-sm border border-[#d0bcff]"
          title="Bintang Terkumpul"
        >
          <Star className="w-4 h-4 text-[#6b38d4] fill-[#6b38d4]" />
          <span className="font-bold text-sm text-[#23005c]">{currentUser.stars}</span>
        </div>

        {/* Coins Widget */}
        <div
          onClick={() => {
            if (currentUser.role === 'student') navigate('/student/collection');
          }}
          className="flex items-center gap-1.5 bg-[#d8e2ff] px-3 py-1.5 rounded-full hover:scale-105 transition-transform cursor-pointer shadow-sm border border-[#adc6ff]"
          title="Koin Emas"
        >
          <Coins className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="font-bold text-sm text-[#001a42]">{currentUser.coins}</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Pemberitahuan dan Pengumuman"
            className="w-10 h-10 flex items-center justify-center bg-white hover:bg-[#f2f3fd] text-gray-700 hover:text-[#0058be] rounded-full shadow-sm border border-[#e1e2ec] transition-colors relative focus-visible:ring-2 focus-visible:ring-[#0058be]"
            title="Notifikasi"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border-2 border-[#adc6ff] p-4 z-50 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#0058be]" />
                  Pemberitahuan
                </h4>
                <span className="text-xs bg-[#d8e2ff] text-[#0058be] px-2 py-0.5 rounded-full font-bold">2 Baru</span>
              </div>
              <div className="space-y-2.5">
                <div className="p-3 bg-[#f2f3fd] rounded-2xl border border-[#adc6ff]/50">
                  <p className="text-xs font-bold text-[#0058be] mb-0.5">🌟 Misi Hari Ini Tersedia!</p>
                  <p className="text-xs text-gray-600">Selesaikan misi "Mengenal Perangkat Keras" untuk mendapatkan lencana baru.</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                  <p className="text-xs font-bold text-amber-800 mb-0.5">🔥 Streak Aktif!</p>
                  <p className="text-xs text-amber-900">Kobi sangat bangga melihat semangat belajarmu setiap hari.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            aria-label="Menu Pengguna"
            className="flex items-center gap-2 p-1 bg-white hover:bg-[#f2f3fd] rounded-full border-2 border-[#2170e4] shadow-sm transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-[#0058be]"
            title="Menu Akun"
            id="btn-header-user-menu"
          >
            <UserAvatar
              name={currentUser.fullName || currentUser.name}
              avatar={currentUser.avatarUrl || currentUser.avatar}
              avatarType={currentUser.avatarType}
              size="sm"
            />
            <div className="hidden lg:flex flex-col text-left pr-2">
              <span className="text-xs font-bold text-gray-900 leading-tight truncate max-w-[110px]">
                {currentUser.nickname || currentUser.displayName || currentUser.name}
              </span>
              <span className="text-[10px] text-gray-500 font-semibold">
                {currentUser.role === 'student' ? `Level ${currentUser.level} Coder` : currentUser.role === 'teacher' ? 'Guru' : 'Admin'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 mr-1 hidden sm:block" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border-2 border-[#adc6ff] p-4 z-50 animate-in fade-in space-y-3">
              {/* User Identity Info */}
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <UserAvatar
                  name={currentUser.fullName || currentUser.name}
                  avatar={currentUser.avatarUrl || currentUser.avatar}
                  avatarType={currentUser.avatarType}
                  size="md"
                />
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-gray-900 truncate">
                    {currentUser.fullName || currentUser.name}
                  </p>
                  {currentUser.nickname && currentUser.nickname !== (currentUser.fullName || currentUser.name) && (
                    <p className="text-[11px] text-blue-700 font-bold truncate">Panggilan: {currentUser.nickname}</p>
                  )}
                  <p className="text-xs text-gray-500 truncate">@{currentUser.username}</p>
                  <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d8e2ff] text-[#0058be] uppercase">
                    {currentUser.role === 'student' ? `Kelas ${currentUser.grade} SD` : currentUser.role === 'teacher' ? 'Guru' : 'Admin'}
                  </span>
                </div>
              </div>

              {/* Action Links */}
              <div className="space-y-1">
                {/* Direct Ubah Profil Button in Menu */}
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    setIsEditProfileOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#0058be] hover:bg-[#eef2ff] rounded-xl transition-colors"
                  id="btn-dropdown-ubah-profil"
                >
                  <Edit3 className="w-4 h-4 text-[#0058be]" />
                  <span>Ubah Profil Saya</span>
                </button>

                {currentUser.role === 'student' && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigate('/student/profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-[#f2f3fd] hover:text-[#0058be] rounded-xl transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-500" />
                    <span>Lihat Profil Siswa</span>
                  </button>
                )}
                {currentUser.role === 'teacher' && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigate('/teacher/dashboard');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-[#f2f3fd] hover:text-[#0058be] rounded-xl transition-colors"
                  >
                    <GraduationCap className="w-4 h-4 text-gray-500" />
                    <span>Dashboard Guru</span>
                  </button>
                )}
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigate('/admin/dashboard');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-[#f2f3fd] hover:text-[#0058be] rounded-xl transition-colors"
                  >
                    <UserCheck className="w-4 h-4 text-gray-500" />
                    <span>Dashboard Admin</span>
                  </button>
                )}
              </div>

              {/* Logout Button */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal Triggerable from Header */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </header>
  );
};
