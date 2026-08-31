import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Send,
  Sparkles,
  TrendingUp,
  Star,
  ChevronRight,
  BookOpen,
  Trophy,
  Plus,
  Edit3
} from 'lucide-react';
import { CLASSROOMS_DATA } from '../../data/mockData';
import { Classroom, ClassGrade } from '../../types';
import { useApp } from '../../context/AppContext';
import { audioService } from '../../utils/audio';
import { CreateAssignmentModal } from '../assignments/CreateAssignmentModal';
import { AssignmentList } from '../assignments/AssignmentList';
import { UserAvatar } from '../common/UserAvatar';
import { EditProfileModal } from '../profile/EditProfileModal';

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, allUsers } = useApp();
  const [selectedClass, setSelectedClass] = useState<string>('cls-4a');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);

  // Derive real registered students from allUsers (synced with Firestore)
  const registeredStudents = useMemo(() => {
    return allUsers.filter(u => u.role === 'student');
  }, [allUsers]);

  const activeClass = CLASSROOMS_DATA.find(c => c.id === selectedClass) || CLASSROOMS_DATA[0];

  // Filter students based on selected classroom grade and search query
  const studentsInClass = useMemo(() => {
    return registeredStudents.filter(s => {
      const matchGrade = s.grade === activeClass.grade;
      const matchQuery = searchQuery.trim() === '' || 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.nickname && s.nickname.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.username.toLowerCase().includes(searchQuery.toLowerCase());
      return matchGrade && matchQuery;
    });
  }, [registeredStudents, activeClass.grade, searchQuery]);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in">
      {/* Teacher Hero Header */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-[#0058be] to-[#2170e4] rounded-[2.5rem] text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-extrabold backdrop-blur-sm">
            <GraduationCap className="w-4 h-4 text-[#6ffbbe]" />
            Panel Pendidik Informatika & CODESign
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-2xl sm:text-3xl">
            Selamat Datang, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-white/80 font-semibold">
            {currentUser.school} • Pantau perkembangan belajar siswa secara realtime dan kelola penugasan kelas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowEditProfileModal(true)}
            className="px-5 py-3.5 bg-white/20 hover:bg-white/30 text-white font-['Plus_Jakarta_Sans'] font-bold text-sm rounded-full backdrop-blur-md flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            id="btn-teacher-ubah-profil"
          >
            <Edit3 className="w-4 h-4 text-[#6ffbbe]" />
            Ubah Profil
          </button>

          <button
            onClick={() => navigate('/student/leaderboard')}
            className="px-5 py-3.5 bg-white/20 hover:bg-white/30 text-white font-['Plus_Jakarta_Sans'] font-bold text-sm rounded-full backdrop-blur-md flex items-center gap-2 transition-all shrink-0"
          >
            <Trophy className="w-4 h-4 text-amber-300 fill-amber-300" />
            Papan Skor Siswa
          </button>

          <button
            onClick={() => setShowTaskModal(true)}
            className="px-6 py-3.5 bg-white text-[#0058be] font-['Plus_Jakarta_Sans'] font-extrabold text-sm rounded-full tactile-btn shadow-lg flex items-center gap-2 hover:bg-blue-50 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Buat Tugas Baru
          </button>
        </div>
      </div>

      {/* Classroom Selection Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {CLASSROOMS_DATA.map(cls => {
          const countForClass = registeredStudents.filter(s => s.grade === cls.grade).length;
          const avgProgress = countForClass > 0 
            ? Math.round(registeredStudents.filter(s => s.grade === cls.grade).reduce((acc, s) => acc + ((s.completedMissions?.length || 0) * 10), 0) / countForClass)
            : 0;

          return (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls.id)}
              className={`p-5 rounded-3xl border-2 text-left transition-all flex flex-col justify-between ${
                selectedClass === cls.id
                  ? 'bg-white border-[#0058be] shadow-md ring-4 ring-[#0058be]/10'
                  : 'bg-white border-[#e1e2ec] hover:border-[#adc6ff]'
              }`}
            >
              <div>
                <p className="text-[11px] font-extrabold uppercase text-gray-400">Kelas {cls.grade} SD</p>
                <h3 className="font-bold text-base text-gray-900 mt-0.5">{cls.name}</h3>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>{countForClass} Siswa Terdaftar</span>
                <span className="font-bold text-emerald-600">{avgProgress}% Progres</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Student Progress Table */}
      <div className="bg-white rounded-3xl border border-[#e1e2ec] shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl text-gray-900">
              Daftar Siswa Realtime ({activeClass.name})
            </h3>
            <p className="text-xs text-gray-500 font-semibold">
              Data siswa langsung tersinkronisasi dari Cloud Firestore
            </p>
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, panggilan, atau username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#f2f3fd] border border-[#adc6ff] rounded-full text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#0058be]"
            />
          </div>
        </div>

        {/* Check if any students are registered in the system */}
        {registeredStudents.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-50 text-[#0058be] flex items-center justify-center border-2 border-[#adc6ff]">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-['Plus_Jakarta_Sans'] font-extrabold text-lg text-gray-900">
                Belum ada siswa yang mendaftar di database.
              </h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Setiap siswa yang baru mendaftar di formulir Pendaftaran Siswa akan langsung terdeteksi di sini secara realtime.
              </p>
            </div>
          </div>
        ) : studentsInClass.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-700">
              Belum ada siswa yang terdaftar di {activeClass.name}.
            </p>
            <p className="text-xs text-gray-500">
              Terdapat {registeredStudents.length} siswa di kelas lain. Silakan pilih kelas lain di atas.
            </p>
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Nama Lengkap & Panggilan</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Misi Selesai</th>
                  <th className="py-3 px-4">Bintang</th>
                  <th className="py-3 px-4">XP & Level</th>
                  <th className="py-3 px-4 text-right">Status Keaktifan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentsInClass.map(stu => {
                  const completedCount = stu.completedMissions?.length || 0;
                  return (
                    <tr key={stu.id} className="hover:bg-[#f9f9ff] transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={stu.fullName || stu.name}
                            avatar={stu.avatarUrl || stu.avatar}
                            avatarType={stu.avatarType}
                            size="sm"
                          />
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{stu.fullName || stu.name}</p>
                            {stu.nickname && stu.nickname !== (stu.fullName || stu.name) && (
                              <p className="text-[11px] text-blue-600 font-bold">Panggilan: {stu.nickname}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-gray-600">
                        @{stu.username}
                      </td>
                      <td className="py-4 px-4 font-bold text-gray-700">
                        Kelas {stu.grade} SD
                      </td>
                      <td className="py-4 px-4 font-bold text-gray-700">
                        {completedCount} Misi
                      </td>
                      <td className="py-4 px-4 font-bold text-purple-700">
                        ⭐ {stu.stars}
                      </td>
                      <td className="py-4 px-4 font-semibold text-gray-600">
                        Level {stu.level} ({stu.xp} XP)
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> {stu.lastActive || 'Aktif'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment / Tugas Kelas Section */}
      <div className="bg-white rounded-3xl border border-[#e1e2ec] shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl text-gray-900">
              Daftar Tugas & Misi Kelas ({activeClass.name})
            </h3>
            <p className="text-xs text-gray-500 font-semibold">
              Tugas yang dibuat akan muncul langsung pada Beranda siswa kelas ini
            </p>
          </div>

          <button
            onClick={() => setShowTaskModal(true)}
            className="px-4 py-2 bg-[#0058be] text-white rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5 hover:bg-[#2170e4] self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Buat Tugas Baru
          </button>
        </div>

        <AssignmentList gradeFilter={activeClass.grade} canManage={true} />
      </div>

      {/* Modal: Buat Tugas Baru */}
      <CreateAssignmentModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        defaultGrade={activeClass.grade as ClassGrade}
      />

      {/* Modal: Ubah Profil Guru */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
      />
    </div>
  );
};
