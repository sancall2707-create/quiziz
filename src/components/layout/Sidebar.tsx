import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Rocket,
  Palette,
  BookOpen,
  User as UserIcon,
  Play,
  Layers,
  ShieldAlert,
  GraduationCap,
  Trophy
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const { currentUser, activeMissionId } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const studentMenuItems = [
    { to: '/student/home', label: 'Beranda', icon: Home },
    { to: '/student/adventure', label: 'Petualangan', icon: Rocket },
    { to: '/student/studio', label: 'Studio', icon: Palette },
    { to: '/student/leaderboard', label: 'Papan Skor', icon: Trophy },
    { to: '/student/collection', label: 'Koleksi', icon: BookOpen },
    { to: '/student/profile', label: 'Profil', icon: UserIcon }
  ];

  const handleStartActiveMission = () => {
    navigate(`/student/mission/${activeMissionId || 'm-g4-c1-m4'}`);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 py-6 bg-white shadow-md w-64 rounded-r-3xl border-r border-[#e1e2ec]">
        {/* App Logo & Mascot badge */}
        <div
          className="flex items-center gap-3 px-6 mb-8 cursor-pointer"
          onClick={() => {
            if (currentUser.role === 'student') navigate('/student/home');
            else if (currentUser.role === 'teacher') navigate('/teacher/dashboard');
            else navigate('/admin/dashboard');
          }}
        >
          <div className="w-12 h-12 bg-gradient-to-tr from-[#0058be] to-[#2170e4] rounded-2xl flex items-center justify-center text-white shadow-md shadow-[#0058be]/20">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-2xl text-[#0058be] tracking-tight">CodeNusa</h1>
            <p className="text-xs text-gray-500 font-bold">
              {currentUser.role === 'student'
                ? `Kelas ${currentUser.grade} • Level ${currentUser.level}`
                : currentUser.role === 'teacher'
                ? 'Dashboard Guru'
                : 'Pusat Admin'}
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {currentUser.role === 'student' ? (
            <>
              {studentMenuItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.to) ||
                  (item.to === '/student/adventure' && location.pathname.includes('/student/mission'));
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-full font-bold text-base transition-all ${
                      isActive
                        ? 'bg-[#d8e2ff] text-[#0058be] shadow-sm translate-x-1'
                        : 'text-gray-600 hover:bg-[#f2f3fd] hover:text-[#0058be]'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? 'text-[#0058be]' : 'text-gray-500'}`} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </>
          ) : currentUser.role === 'teacher' ? (
            <>
              <NavLink
                to="/teacher/dashboard"
                className={({ isActive }) =>
                  `w-full flex items-center gap-4 px-5 py-3.5 rounded-full font-bold text-base transition-all ${
                    isActive
                      ? 'bg-[#d8e2ff] text-[#0058be] shadow-sm'
                      : 'text-gray-600 hover:bg-[#f2f3fd] hover:text-[#0058be]'
                  }`
                }
              >
                <GraduationCap className="w-6 h-6" />
                <span>Dashboard Guru</span>
              </NavLink>
              <NavLink
                to="/student/adventure"
                className={({ isActive }) =>
                  `w-full flex items-center gap-4 px-5 py-3.5 rounded-full font-bold text-base transition-all ${
                    isActive
                      ? 'bg-[#d8e2ff] text-[#0058be] shadow-sm'
                      : 'text-gray-600 hover:bg-[#f2f3fd] hover:text-[#0058be]'
                  }`
                }
              >
                <Rocket className="w-6 h-6" />
                <span>Preview Materi</span>
              </NavLink>
              <NavLink
                to="/student/studio"
                className={({ isActive }) =>
                  `w-full flex items-center gap-4 px-5 py-3.5 rounded-full font-bold text-base transition-all ${
                    isActive
                      ? 'bg-[#d8e2ff] text-[#0058be] shadow-sm'
                      : 'text-gray-600 hover:bg-[#f2f3fd] hover:text-[#0058be]'
                  }`
                }
              >
                <Palette className="w-6 h-6" />
                <span>Studio Coding</span>
              </NavLink>
              <NavLink
                to="/student/profile"
                className={({ isActive }) =>
                  `w-full flex items-center gap-4 px-5 py-3.5 rounded-full font-bold text-base transition-all ${
                    isActive
                      ? 'bg-[#d8e2ff] text-[#0058be] shadow-sm'
                      : 'text-gray-600 hover:bg-[#f2f3fd] hover:text-[#0058be]'
                  }`
                }
              >
                <UserIcon className="w-6 h-6" />
                <span>Profil Pendidik</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) =>
                  `w-full flex items-center gap-4 px-5 py-3.5 rounded-full font-bold text-base transition-all ${
                    isActive
                      ? 'bg-[#d8e2ff] text-[#0058be] shadow-sm'
                      : 'text-gray-600 hover:bg-[#f2f3fd] hover:text-[#0058be]'
                  }`
                }
              >
                <ShieldAlert className="w-6 h-6" />
                <span>Dashboard Admin</span>
              </NavLink>
              <NavLink
                to="/teacher/dashboard"
                className={({ isActive }) =>
                  `w-full flex items-center gap-4 px-5 py-3.5 rounded-full font-bold text-base transition-all ${
                    isActive
                      ? 'bg-[#d8e2ff] text-[#0058be] shadow-sm'
                      : 'text-gray-600 hover:bg-[#f2f3fd] hover:text-[#0058be]'
                  }`
                }
              >
                <GraduationCap className="w-6 h-6" />
                <span>Modul Guru</span>
              </NavLink>
              <NavLink
                to="/student/adventure"
                className={({ isActive }) =>
                  `w-full flex items-center gap-4 px-5 py-3.5 rounded-full font-bold text-base transition-all ${
                    isActive
                      ? 'bg-[#d8e2ff] text-[#0058be] shadow-sm'
                      : 'text-gray-600 hover:bg-[#f2f3fd] hover:text-[#0058be]'
                  }`
                }
              >
                <Layers className="w-6 h-6" />
                <span>Kurikulum Siswa</span>
              </NavLink>
              <NavLink
                to="/student/profile"
                className={({ isActive }) =>
                  `w-full flex items-center gap-4 px-5 py-3.5 rounded-full font-bold text-base transition-all ${
                    isActive
                      ? 'bg-[#d8e2ff] text-[#0058be] shadow-sm'
                      : 'text-gray-600 hover:bg-[#f2f3fd] hover:text-[#0058be]'
                  }`
                }
              >
                <UserIcon className="w-6 h-6" />
                <span>Profil Admin</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Bottom CTA Button: Mulai Misi */}
        {currentUser.role === 'student' && (
          <div className="px-5 mt-auto pt-4 border-t border-gray-100">
            <button
              onClick={handleStartActiveMission}
              className="w-full bg-[#0058be] text-white font-['Plus_Jakarta_Sans'] font-extrabold text-base py-4 rounded-full tactile-btn shadow-lg shadow-[#0058be]/25 flex items-center justify-center gap-2 hover:bg-[#2170e4]"
            >
              <Play className="w-5 h-5 fill-white" />
              Mulai Misi
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation Bar (for student role) */}
      {currentUser.role === 'student' && (
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.08)] z-40 pb-safe pt-1.5 border-t border-[#e1e2ec]">
          <ul className="flex justify-around items-center h-16 px-2">
            {studentMenuItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.to) ||
                (item.to === '/student/adventure' && location.pathname.includes('/student/mission'));
              return (
                <li key={item.to} className="flex-1">
                  <NavLink
                    to={item.to}
                    className={`w-full flex flex-col items-center justify-center gap-1 h-full py-1 transition-all ${
                      isActive ? 'text-[#0058be]' : 'text-gray-500'
                    }`}
                  >
                    <div className={`px-3 py-1 rounded-full transition-all ${isActive ? 'bg-[#d8e2ff]' : ''}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold tracking-tight">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
};
