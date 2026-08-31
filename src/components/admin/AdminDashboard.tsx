import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Layers,
  Users,
  Plus,
  Edit2,
  Edit3,
  Trash2,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Settings,
  Search,
  Send
} from 'lucide-react';
import { LEARNING_WORLDS, CHAPTERS_DATA } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { CreateAssignmentModal } from '../assignments/CreateAssignmentModal';
import { AssignmentList } from '../assignments/AssignmentList';
import { UserAvatar } from '../common/UserAvatar';
import { EditProfileModal } from '../profile/EditProfileModal';

export const AdminDashboard: React.FC = () => {
  const { allUsers, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'users' | 'assignments' | 'curriculum'>('users');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher' | 'admin'>('all');
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        query === '' ||
        u.name.toLowerCase().includes(query) ||
        (u.nickname && u.nickname.toLowerCase().includes(query)) ||
        u.username.toLowerCase().includes(query);
      return matchRole && matchSearch;
    });
  }, [allUsers, roleFilter, searchQuery]);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in">
      {/* Header */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-purple-800 to-indigo-900 rounded-[2.5rem] text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-extrabold backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            Pusat Kendali Ekosistem CodeNusa
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-2xl sm:text-3xl">
            Selamat Datang, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-white/80 font-semibold">
            Pantau akun siswa & guru secara realtime, kelola penugasan lintas kelas, dan materi kurikulum.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowEditProfileModal(true)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-['Plus_Jakarta_Sans'] font-bold text-xs rounded-full backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer"
            id="btn-admin-ubah-profil"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-300" />
            Ubah Profil
          </button>

          <div className="flex flex-wrap items-center gap-1.5 bg-white/10 p-1.5 rounded-full border border-white/20">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all ${
                activeTab === 'users' ? 'bg-white text-purple-900 shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              Pengguna ({allUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all ${
                activeTab === 'assignments' ? 'bg-white text-purple-900 shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              Tugas & Aktivitas
            </button>
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all ${
                activeTab === 'curriculum' ? 'bg-white text-purple-900 shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              Kurikulum (SD 1–6)
            </button>
          </div>
        </div>
      </div>

      {/* Users Manager Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-[#e1e2ec] shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl text-gray-900">
                Manajemen Akun Terdaftar (Realtime)
              </h3>
              <p className="text-xs text-gray-500 font-semibold">
                Daftar siswa dan pendidik yang tersinkron langsung dari Firestore
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Peran */}
              <div className="flex items-center bg-gray-100 p-1 rounded-2xl">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    roleFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setRoleFilter('student')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    roleFilter === 'student' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Siswa
                </button>
                <button
                  onClick={() => setRoleFilter('teacher')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    roleFilter === 'teacher' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Guru
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama / username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-[#f2f3fd] border border-[#adc6ff] rounded-full text-xs font-semibold text-gray-800 focus:outline-none focus:border-purple-700"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Nama Lengkap & Panggilan</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Peran (Role) & Kelas</th>
                  <th className="py-3 px-4">Sekolah</th>
                  <th className="py-3 px-4">Level / XP</th>
                  <th className="py-3 px-4 text-right">Status Keaktifan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={u.fullName || u.name}
                          avatar={u.avatarUrl || u.avatar}
                          avatarType={u.avatarType}
                          size="sm"
                        />
                        <div>
                          <p className="font-bold text-gray-900">{u.fullName || u.name}</p>
                          {u.nickname && u.nickname !== (u.fullName || u.name) && (
                            <p className="text-[10px] text-purple-700 font-bold">Panggilan: {u.nickname}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-600">
                      @{u.username}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                        u.role === 'student'
                          ? 'bg-blue-100 text-blue-800'
                          : u.role === 'teacher'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {u.role === 'student' ? `Siswa Kelas ${u.grade} SD` : u.role === 'teacher' ? 'Pendidik / Guru' : 'Admin'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-600">{u.school}</td>
                    <td className="py-3.5 px-4 font-bold text-[#0058be]">
                      {u.role === 'student' ? `Level ${u.level} (${u.xp} XP)` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> {u.lastActive || 'Aktif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assignments Manager Tab */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-3xl border border-[#e1e2ec] shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl text-gray-900">
                Manajemen Tugas Seluruh Kelas (1–6 SD)
              </h3>
              <p className="text-xs text-gray-500 font-semibold">
                Admin dapat membuat tugas terstruktur untuk semua kelas atau kelas tertentu di Cloud Firestore.
              </p>
            </div>

            <button
              onClick={() => setShowTaskModal(true)}
              className="px-5 py-2.5 bg-[#0058be] hover:bg-[#2170e4] text-white rounded-full text-xs font-extrabold shadow-sm flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Buat Tugas Baru
            </button>
          </div>

          <AssignmentList gradeFilter="all" canManage={true} />
        </div>
      )}

      {/* Curriculum Manager Tab */}
      {activeTab === 'curriculum' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl text-gray-900">
              Daftar Dunia & Bab Terstruktur
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LEARNING_WORLDS.map(world => (
              <div key={world.id} className="p-6 bg-white rounded-3xl border-2 border-[#e1e2ec] shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-purple-100 text-purple-800">
                      Kelas {world.grade} SD
                    </span>
                    <span className="text-xs font-bold text-gray-400">
                      {world.totalChapters} Bab
                    </span>
                  </div>
                  <h4 className="font-bold text-lg text-gray-900">{world.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{world.description}</p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#0058be]">
                  <span>Status: Aktif</span>
                  <span className="text-gray-400 font-semibold">Kurikulum Nasional</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Buat Tugas */}
      <CreateAssignmentModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
      />

      {/* Modal Ubah Profil Admin */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
      />
    </div>
  );
};
