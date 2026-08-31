import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Flame,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Plus,
  BookOpen,
  Compass,
  Star,
  Coins,
  Cpu,
  Calendar,
  Layers,
  HelpCircle,
  Code2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LEARNING_WORLDS, CHAPTERS_DATA } from '../../data/mockData';
import { KobiCharacter } from '../common/KobiCharacter';
import { audioService } from '../../utils/audio';
import { OfflineBanner } from '../common/OfflineBanner';
import { LeaderboardMiniCard } from './LeaderboardMiniCard';
import { AssignmentType } from '../../types';

export const StudentHome: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    dailyMissions,
    claimDailyMission,
    projects,
    kobiSpeech,
    streakInfo,
    checkInStreak,
    activeMissionId,
    assignments
  } = useApp();

  // Filter assignments relevant for this student's grade
  const studentAssignments = assignments.filter(
    a => a.targetGrade === 'all' || a.targetGrade === currentUser.grade
  );

  // Find active chapter and progress
  const currentChapter = CHAPTERS_DATA.find(c => c.grade === currentUser.grade) || CHAPTERS_DATA[0];
  const completedInChapter = currentChapter.missions.filter(m => currentUser.completedMissions.includes(m.id)).length;
  const progressPercent = Math.round((completedInChapter / currentChapter.missions.length) * 100);

  // Next milestone calculation
  const nextMilestone = streakInfo.milestones.find(m => !m.completed) || streakInfo.milestones[streakInfo.milestones.length - 1];
  const streakProgressPercent = Math.min(100, Math.round((streakInfo.currentStreak / nextMilestone.days) * 100));

  return (
    <div className="space-y-8 pb-12 animate-in fade-in">
      {/* Offline Banner Notification */}
      <OfflineBanner />

      {/* 1. Hero Card: Lanjutkan Petualangan */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0058be] via-[#2170e4] to-[#407eff] text-white p-6 sm:p-10 shadow-xl shadow-[#0058be]/20">
        {/* Abstract background circles */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-32 top-0 w-48 h-48 rounded-full bg-[#6ffbbe]/20 blur-xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs sm:text-sm font-bold tracking-wide">
              <Compass className="w-4 h-4 text-[#6ffbbe]" />
              <span>{currentChapter.title} • {currentChapter.subtitle.split('•')[0]}</span>
            </div>

            <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-3xl sm:text-4xl md:text-5xl leading-tight">
              Lanjutkan Petualangan!
            </h1>

            <p className="text-white/90 text-sm sm:text-base max-w-xl leading-relaxed">
              Mengenal perangkat keras komputer, cara kerja mouse & keyboard, serta blok perintah pertama bersama Kobi.
            </p>

            {/* Progress indicator */}
            <div className="space-y-2 pt-2 max-w-md">
              <div className="flex justify-between text-xs font-bold text-white/90">
                <span>Progres Bab 1</span>
                <span>{progressPercent}% Selesai</span>
              </div>
              <div className="w-full h-3.5 bg-black/25 rounded-full overflow-hidden p-0.5 backdrop-blur-sm border border-white/20">
                <div
                  className="h-full bg-gradient-to-r from-[#4edea3] to-[#6ffbbe] rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${Math.max(progressPercent, 10)}%` }}
                />
              </div>
            </div>

            {/* Action button */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate('/student/adventure')}
                className="bg-white hover:bg-[#f2f3fd] text-[#0058be] font-['Plus_Jakarta_Sans'] font-extrabold text-base sm:text-lg px-8 py-4 rounded-full tactile-btn shadow-xl flex items-center gap-3 transition-transform"
              >
                <Play className="w-5 h-5 fill-[#0058be]" />
                Lanjutkan Misi Sekarang
              </button>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-bold text-amber-300">
                <Flame className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
                <span>Streak Aktif: {streakInfo.currentStreak} Hari</span>
              </div>
            </div>
          </div>

          {/* 3D Mascot Illustration */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative">
              <KobiCharacter size="xl" mood="happy" interactive={true} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Streak Harian & Kobi Companion Speech Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Streak Indicator Card */}
        <div className="lg:col-span-6 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-white p-6 rounded-[2rem] border-2 border-orange-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                  <Flame className="w-7 h-7 fill-white animate-bounce-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-lg text-gray-900">
                      Streak Harian
                    </h3>
                    <span className="bg-orange-100 text-orange-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-orange-200">
                      {streakInfo.currentStreak} Hari Beruntun 🔥
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">
                    {streakInfo.isTodayActive
                      ? '✨ Hebat! Streak kamu hari ini sudah aktif dan tercatat.'
                      : '⚡ Belajar atau klik check-in hari ini agar streak tidak terputus!'}
                  </p>
                </div>
              </div>

              {!streakInfo.isTodayActive ? (
                <button
                  onClick={checkInStreak}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-full shadow-md transition-all hover:scale-105 shrink-0 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  Check-in Harian
                </button>
              ) : (
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Aktif Hari Ini
                </div>
              )}
            </div>

            {/* Weekly Days Track */}
            <div className="pt-2">
              <div className="grid grid-cols-7 gap-2">
                {streakInfo.activeDaysThisWeek.map((day, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all ${
                      day.active
                        ? 'bg-gradient-to-b from-orange-500 to-amber-500 text-white border-orange-500 shadow-sm'
                        : day.isToday
                        ? 'bg-white border-2 border-orange-400 text-orange-600 ring-2 ring-orange-200 shadow-sm'
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider mb-1">
                      {day.dayName}
                    </span>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black">
                      {day.active ? (
                        <Flame className="w-4 h-4 fill-white" />
                      ) : day.isToday ? (
                        <span className="text-orange-500 font-extrabold">●</span>
                      ) : (
                        <span className="text-gray-300">○</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestone target preview */}
            <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-2xl border border-orange-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700 flex items-center gap-1">
                  🎯 Target: <span className="text-orange-600">{nextMilestone.title}</span> ({nextMilestone.days} Hari)
                </span>
                <span className="font-extrabold text-orange-600">{streakProgressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${streakProgressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                Hadiah berikutnya: <span className="font-bold text-purple-700">{nextMilestone.reward}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Leaderboard Mini Podium Card */}
        <div className="lg:col-span-6">
          <LeaderboardMiniCard />
        </div>
      </div>

      {/* 3. Kobi Companion Speech Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 rounded-[2rem] border-2 border-[#adc6ff] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-md border border-[#adc6ff]">
            <span className="text-2xl animate-bounce-slow">🤖</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[#0058be] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Kobi Sahabat Koding • Pesan Motivasi
            </p>
            <p className="text-gray-800 font-semibold text-sm sm:text-base leading-snug mt-0.5">
              "{kobiSpeech ? kobiSpeech.text : `Semangat belajar koding hari ini! Kumpulkan bintang dan naikkan peringkatmu bersama Kobi.`}"
            </p>
          </div>
        </div>

        <button
          onClick={() => audioService.speakText(kobiSpeech ? kobiSpeech.text : 'Semangat belajar koding hari ini!')}
          className="px-4 py-2.5 bg-white hover:bg-[#d8e2ff] text-[#0058be] border border-[#adc6ff] rounded-full font-bold text-xs shadow-sm flex items-center gap-2 transition-all hover:scale-105 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Dengarkan Kobi
        </button>
      </div>

      {/* Tugas dari Guru & Sekolah */}
      {studentAssignments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-[#0058be] font-bold">
                📋
              </div>
              <div>
                <h2 className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl text-gray-900">
                  Tugas dari Guru & Sekolah
                </h2>
                <p className="text-xs text-gray-500 font-semibold">
                  Tugas dan instruksi pembelajaran khusus untuk Kelas {currentUser.grade} SD
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold px-3 py-1 bg-blue-50 text-[#0058be] rounded-full border border-[#adc6ff]">
              {studentAssignments.length} Tugas Tersedia
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {studentAssignments.map(asg => {
              const getTypeInfo = (type: AssignmentType) => {
                switch (type) {
                  case 'mission':
                    return {
                      label: 'Misi Pembelajaran',
                      icon: <BookOpen className="w-3.5 h-3.5" />,
                      color: 'bg-blue-100 text-blue-800 border-blue-200'
                    };
                  case 'practice':
                    return {
                      label: 'Latihan Soal',
                      icon: <HelpCircle className="w-3.5 h-3.5" />,
                      color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    };
                  case 'project':
                    return {
                      label: 'Proyek Studio',
                      icon: <Code2 className="w-3.5 h-3.5" />,
                      color: 'bg-purple-100 text-purple-800 border-purple-200'
                    };
                  case 'quiz':
                    return {
                      label: 'Kuis Tantangan',
                      icon: <Sparkles className="w-3.5 h-3.5" />,
                      color: 'bg-amber-100 text-amber-800 border-amber-200'
                    };
                }
              };
              const typeInfo = getTypeInfo(asg.type);

              return (
                <div
                  key={asg.id}
                  className="p-5 bg-white rounded-3xl border-2 border-[#adc6ff] hover:border-[#0058be] transition-all shadow-sm hover:shadow-md flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border ${typeInfo.color}`}>
                        {typeInfo.icon}
                        {typeInfo.label}
                      </span>
                      {asg.dueDate && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <Calendar className="w-3 h-3" />
                          Tenggat: {asg.dueDate}
                        </span>
                      )}
                    </div>

                    <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-base text-gray-900 mb-1">
                      {asg.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {asg.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400">
                      Oleh {asg.createdBy?.name || 'Guru'} ({asg.createdBy?.role === 'admin' ? 'Admin' : 'Pendidik'})
                    </span>
                    <button
                      onClick={() => {
                        if (asg.type === 'project') {
                          navigate('/student/studio');
                        } else {
                          navigate('/student/adventure');
                        }
                      }}
                      className="px-4 py-2 bg-[#0058be] hover:bg-[#2170e4] text-white rounded-full text-xs font-extrabold shadow-sm transition-all hover:scale-105 flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Mulai Kerjakan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Misi Hari Ini (Daily Missions) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 font-bold">
              ⚡
            </div>
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl text-gray-900">
                Misi Hari Ini
              </h2>
              <p className="text-xs text-gray-500 font-semibold">Selesaikan untuk mendapatkan bintang & koin ekstra</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dailyMissions.map(misi => (
            <div
              key={misi.id}
              className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                misi.isCompleted
                  ? 'bg-[#e8f5e9] border-[#a5d6a7] shadow-sm'
                  : 'bg-white border-[#e1e2ec] hover:border-[#adc6ff] shadow-sm tactile-card'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">
                    {misi.id === 'dm-1' ? '📅' : misi.id === 'dm-2' ? '📖' : misi.id === 'dm-3' ? '🧩' : '🔒'}
                  </span>
                  {misi.isCompleted ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Selesai
                    </span>
                  ) : misi.id === 'dm-4' ? (
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Terkunci
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-[#0058be] bg-[#d8e2ff] px-2.5 py-1 rounded-full">
                      Aktif
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base text-gray-900 mb-1">{misi.title}</h3>
                <p className="text-xs text-gray-600 mb-4">{misi.description}</p>
              </div>

              <div className="pt-3 border-t border-gray-100/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs font-bold text-purple-700">
                    <Star className="w-3.5 h-3.5 fill-purple-600" />
                    +{misi.rewardStars}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-700">
                    <Coins className="w-3.5 h-3.5 fill-amber-500" />
                    +{misi.rewardCoins}
                  </span>
                </div>

                {!misi.isCompleted && misi.id !== 'dm-4' ? (
                  <button
                    onClick={() => {
                      if (misi.id === 'dm-1') {
                        claimDailyMission(misi.id);
                      } else if (misi.id === 'dm-2') {
                        navigate(`/student/mission/${activeMissionId || 'm-g4-c1-m4'}`);
                      } else if (misi.id === 'dm-3') {
                        navigate('/student/studio');
                      }
                    }}
                    className="px-3.5 py-1.5 bg-[#0058be] text-white hover:bg-[#2170e4] rounded-full text-xs font-bold shadow-sm transition-all hover:scale-105"
                  >
                    {misi.id === 'dm-1' ? 'Klaim' : 'Mulai'}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Proyek Terbaru di Studio */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
              🎨
            </div>
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl text-gray-900">
                Proyek Studio Coding Kamu
              </h2>
              <p className="text-xs text-gray-500 font-semibold">Karya koding visual buatanmu sendiri</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/student/studio')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#0058be] hover:underline"
          >
            Buka Studio
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.map(proj => (
            <div
              key={proj.id}
              onClick={() => navigate('/student/studio')}
              className="p-5 bg-white rounded-3xl border-2 border-[#adc6ff] shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
            >
              <div className="h-32 bg-gradient-to-br from-indigo-50 to-blue-100 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden border border-[#adc6ff]/50">
                <span className="text-5xl group-hover:scale-110 transition-transform">🤖</span>
                <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-[#0058be] px-2 py-0.5 rounded-full">
                  {proj.blocks.length} Blok Kode
                </div>
              </div>
              <h3 className="font-bold text-base text-gray-900 group-hover:text-[#0058be] transition-colors">
                {proj.title}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-2 mt-1 mb-3">
                {proj.description}
              </p>
              <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold pt-2 border-t border-gray-100">
                <span>Diperbarui {proj.updatedAt}</span>
                <span className="text-[#0058be] font-bold flex items-center gap-1">
                  Buka Proyek <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}

          {/* New Project Tile */}
          <div
            onClick={() => navigate('/student/studio')}
            className="p-6 bg-gradient-to-br from-[#f2f3fd] to-white rounded-3xl border-2 border-dashed border-[#adc6ff] hover:border-[#0058be] flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-blue-50/50 min-h-[220px]"
          >
            <div className="w-14 h-14 rounded-full bg-[#d8e2ff] text-[#0058be] flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
              <Plus className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-base text-gray-800">Buat Proyek Baru</h4>
            <p className="text-xs text-gray-500 max-w-[200px] mt-1">
              Rancang animasi, cerita interaktif, atau game kreasimu
            </p>
          </div>
        </div>
      </div>

      {/* 5. Dunia Petualangan Terbuka */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 font-bold">
              🗺️
            </div>
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl text-gray-900">
                Dunia Belajar Informatika
              </h2>
              <p className="text-xs text-gray-500 font-semibold">Tersedia untuk murid SD Kelas 1 sampai 6</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/student/adventure')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#0058be] hover:underline"
          >
            Lihat Semua Dunia
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {LEARNING_WORLDS.slice(0, 3).map(world => {
            const isUserGrade = world.grade === currentUser.grade;
            return (
              <div
                key={world.id}
                onClick={() => navigate('/student/adventure')}
                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer tactile-card relative overflow-hidden ${
                  isUserGrade
                    ? 'bg-white border-[#0058be] shadow-lg shadow-blue-500/10 ring-2 ring-[#0058be]/20'
                    : 'bg-white border-[#e1e2ec] hover:border-[#adc6ff]'
                }`}
              >
                {isUserGrade && (
                  <div className="absolute top-3 right-3 bg-[#0058be] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                    Dunia Utama
                  </div>
                )}
                <div className="w-14 h-14 rounded-2xl bg-[#d8e2ff] flex items-center justify-center text-3xl mb-4 shadow-sm">
                  {world.grade === 1 ? '🎨' : world.grade === 2 ? '🧭' : world.grade === 3 ? '⚙️' : world.grade === 4 ? '💻' : world.grade === 5 ? '🌐' : '✨'}
                </div>
                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-gray-900">
                  {world.name}
                </h3>
                <p className="text-xs font-bold text-[#0058be] mt-0.5 mb-2">
                  {world.subtitle} • {world.totalChapters} Bab Petualangan
                </p>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {world.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
