import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Crown,
  Star,
  Zap,
  Flame,
  Search,
  School,
  GraduationCap,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Filter,
  CheckCircle2,
  Heart,
  RotateCcw,
  Compass,
  Play
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LeaderboardScope, LeaderboardTimeframe, LeaderboardSortBy, ClassGrade, LeaderboardStudent } from '../../types';
import { KobiCharacter } from '../common/KobiCharacter';
import { audioService } from '../../utils/audio';
import { OfflineBanner } from '../common/OfflineBanner';

export const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    allLeaderboardStudents,
    cheerStudent,
    cheersMap,
    triggerKobiSpeech,
    activeMissionId
  } = useApp();

  // State Filters
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('all_time');
  const [selectedGrade, setSelectedGrade] = useState<ClassGrade | 'all'>('all');
  const [sortBy, setSortBy] = useState<LeaderboardSortBy>('stars');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [recentCheeredId, setRecentCheeredId] = useState<string | null>(null);

  // Filter and Sort Logic
  const filteredStudents = useMemo(() => {
    let list = [...allLeaderboardStudents];

    // 1. Filter by Scope
    if (scope === 'school') {
      const userSchool = currentUser.school || 'SD Harapan Nusantara';
      list = list.filter(s => s.school.toLowerCase().includes(userSchool.toLowerCase()) || s.isCurrentUser);
    } else if (scope === 'grade') {
      list = list.filter(s => s.grade === currentUser.grade || s.isCurrentUser);
    }

    // 2. Filter by Grade Pill
    if (selectedGrade !== 'all') {
      list = list.filter(s => s.grade === selectedGrade);
    }

    // 3. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        s => s.name.toLowerCase().includes(q) || s.school.toLowerCase().includes(q) || s.username.toLowerCase().includes(q)
      );
    }

    // 4. Sort
    list.sort((a, b) => {
      if (sortBy === 'stars') {
        const starA = timeframe === 'weekly' ? a.weeklyStars : timeframe === 'monthly' ? a.monthlyStars : a.stars;
        const starB = timeframe === 'weekly' ? b.weeklyStars : timeframe === 'monthly' ? b.monthlyStars : b.stars;
        return starB - starA || b.xp - a.xp;
      } else if (sortBy === 'xp') {
        return b.xp - a.xp || b.stars - a.stars;
      } else if (sortBy === 'streak') {
        return b.streakDays - a.streakDays || b.stars - a.stars;
      }
      return 0;
    });

    return list;
  }, [allLeaderboardStudents, scope, timeframe, selectedGrade, sortBy, searchQuery, currentUser]);

  // Current User's dynamic rank in current filtered view
  const currentUserRankIndex = filteredStudents.findIndex(s => s.isCurrentUser || s.id === currentUser.id);
  const currentUserRank = currentUserRankIndex >= 0 ? currentUserRankIndex + 1 : null;
  const studentAhead = currentUserRankIndex > 0 ? filteredStudents[currentUserRankIndex - 1] : null;

  // Stars difference to rank up
  const starsNeededToOvertake = useMemo(() => {
    if (!studentAhead) return 0;
    const currentStars = timeframe === 'weekly' 
      ? Math.round(currentUser.stars * 0.25) 
      : timeframe === 'monthly' 
      ? Math.round(currentUser.stars * 0.7) 
      : currentUser.stars;
    const aheadStars = timeframe === 'weekly' 
      ? studentAhead.weeklyStars 
      : timeframe === 'monthly' 
      ? studentAhead.monthlyStars 
      : studentAhead.stars;
    return Math.max(1, (aheadStars - currentStars) + 1);
  }, [studentAhead, currentUser.stars, timeframe]);

  // Podium Data: Top 3
  const top1 = filteredStudents[0];
  const top2 = filteredStudents[1];
  const top3 = filteredStudents[2];

  const handleCheer = (student: LeaderboardStudent) => {
    cheerStudent(student.id);
    setRecentCheeredId(student.id);
    setTimeout(() => {
      setRecentCheeredId(null);
    }, 1500);
  };

  const getStarValue = (student: LeaderboardStudent) => {
    if (timeframe === 'weekly') return student.weeklyStars;
    if (timeframe === 'monthly') return student.monthlyStars;
    return student.stars;
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in">
      <OfflineBanner />

      {/* ========================================================================= */}
      {/* 1. HERO BANNER                                                            */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0058be] via-[#2170e4] to-[#407eff] text-white p-6 sm:p-10 shadow-xl shadow-[#0058be]/20">
        {/* Background decorative elements */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-20 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center lg:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-amber-200 font-bold text-xs">
              <Trophy className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Papan Peringkat Bintang Nusantara</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight text-white leading-tight">
              Papan Skor Bintang Cilik
            </h1>
            
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              Kumpulkan bintang emas dari setiap misi, tantangan algoritma, dan proyek koding. 
              Raih posisi puncak dan jadilah inspirasi bagi teman-teman di seluruh Nusantara!
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <div className="bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-2xl flex items-center gap-2 text-xs font-bold">
                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Bintang Kamu: {currentUser.stars} ⭐</span>
              </div>
              <div className="bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-2xl flex items-center gap-2 text-xs font-bold">
                <Flame className="w-4 h-4 text-orange-300 fill-orange-300" />
                <span>Streak: {currentUser.streakDays} Hari 🔥</span>
              </div>
              {currentUserRank && (
                <div className="bg-amber-400 text-slate-900 px-3.5 py-1.5 rounded-2xl flex items-center gap-2 text-xs font-extrabold shadow-sm">
                  <Crown className="w-4 h-4 fill-slate-900" />
                  <span>Peringkat #{currentUserRank}</span>
                </div>
              )}
            </div>
          </div>

          {/* Kobi Mascot */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-xl animate-pulse" />
              <KobiCharacter
                mood="celebrating"
                size="md"
                className="relative z-10 cursor-pointer transform hover:scale-105 transition-transform"
                onClick={() =>
                  triggerKobiSpeech(
                    `Semangat ${currentUser.name}! Kamu berada di peringkat #${currentUserRank || 4}. Selesaikan misi lagi untuk naik ke podium!`,
                    'celebrating',
                    true
                  )
                }
              />
            </div>
            <span className="text-[11px] font-bold text-blue-100 mt-2 bg-white/10 px-2.5 py-0.5 rounded-full">
              Kobi Siap Mendukungmu! 🤖
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CURRENT USER SPOTLIGHT & NEXT TARGET BANNER                           */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#0058be] shadow-md"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1 -right-1 bg-[#0058be] text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                #{currentUserRank || '-'}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-800 text-base">{currentUser.name}</h3>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Kamu
                </span>
                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Kelas {currentUser.grade} SD
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentUser.school || 'SD Harapan Nusantara'} • Level {currentUser.level} ({currentUser.xp} XP)
              </p>
            </div>
          </div>

          {/* Motivational Next Target */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            {studentAhead ? (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2.5 rounded-2xl border border-amber-200/80 text-left">
                <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                  Target Berikutnya:
                </div>
                <div className="text-xs text-slate-700 mt-0.5">
                  Butuh <span className="font-extrabold text-amber-700">+{starsNeededToOvertake} ⭐</span> lagi untuk melewati{' '}
                  <span className="font-bold text-slate-900">{studentAhead.name}</span> (Peringkat #{currentUserRankIndex})
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 px-4 py-2.5 rounded-2xl border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <Crown className="w-4 h-4 text-emerald-600 fill-emerald-500" />
                <span>Luar biasa! Kamu sedang memimpin di posisi teratas! 👑</span>
              </div>
            )}

            <button
              onClick={() => navigate(`/student/mission/${activeMissionId || 'm-g4-c1-m4'}`)}
              className="bg-[#0058be] hover:bg-[#2170e4] text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition-all shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Kumpulkan Bintang</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PODIUM JUARA TOP 3 VISUALIZER                                          */}
      {/* ========================================================================= */}
      {filteredStudents.length >= 3 && !searchQuery && (
        <div className="bg-gradient-to-b from-white to-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
          <div className="text-center mb-8 space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold font-['Plus_Jakarta_Sans'] text-slate-800 flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500 fill-amber-400" />
              <span>Podium Juara Nusantara</span>
            </h2>
            <p className="text-xs text-slate-500">
              {timeframe === 'weekly' ? 'Bintang Terbanyak Pekan Ini' : timeframe === 'monthly' ? 'Bintang Terbanyak Bulan Ini' : 'Bintang Terbanyak Sepanjang Masa'}
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-end justify-center gap-4 sm:gap-6 pt-6 max-w-4xl mx-auto">
            {/* Rank 2 - Silver (Left) */}
            {top2 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="w-full md:w-1/3 flex flex-col items-center order-2 md:order-1"
              >
                <div className="relative mb-3 flex flex-col items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl p-1 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 shadow-md">
                    <img
                      src={top2.avatar}
                      alt={top2.name}
                      className="w-full h-full rounded-[1.2rem] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-2 bg-gradient-to-r from-slate-400 to-slate-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-white">
                    <span>2</span>
                  </div>
                </div>

                <div className="text-center w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative">
                  <h4 className="font-extrabold text-slate-800 text-sm truncate">{top2.name}</h4>
                  <p className="text-[11px] text-slate-500 truncate">{top2.school}</p>
                  
                  <div className="mt-2.5 inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl text-amber-900 font-extrabold text-sm">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span>{getStarValue(top2)} ⭐</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span>Kelas {top2.grade}</span>
                    <button
                      onClick={() => handleCheer(top2)}
                      className="flex items-center gap-1 text-slate-600 hover:text-rose-600 active:scale-95 font-bold transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                      <span>{top2.cheerCount || 0}</span>
                    </button>
                  </div>
                </div>

                {/* Silver Podium Pillar */}
                <div className="w-full h-24 md:h-28 bg-gradient-to-b from-slate-200 via-slate-100 to-slate-200 rounded-t-2xl mt-2 flex flex-col items-center justify-center border-t-4 border-slate-300 shadow-inner">
                  <span className="font-black text-2xl text-slate-400">#2</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Perak</span>
                </div>
              </motion.div>
            )}

            {/* Rank 1 - Gold (Center / Raised) */}
            {top1 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full md:w-1/3 flex flex-col items-center order-1 md:order-2 -mt-4 md:-mt-8"
              >
                {/* Crown badge */}
                <div className="animate-bounce mb-1">
                  <Crown className="w-9 h-9 text-amber-500 fill-amber-400 filter drop-shadow-md" />
                </div>

                <div className="relative mb-3 flex flex-col items-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl p-1 bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-500 shadow-lg shadow-amber-500/20 ring-4 ring-amber-300/40">
                    <img
                      src={top1.avatar}
                      alt={top1.name}
                      className="w-full h-full rounded-[1.2rem] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 text-xs font-black px-3 py-0.5 rounded-full shadow-lg flex items-center gap-1 border-2 border-white">
                    <Crown className="w-3 h-3 fill-slate-950" />
                    <span>1</span>
                  </div>
                </div>

                <div className="text-center w-full bg-gradient-to-b from-amber-50/70 to-white p-4 rounded-2xl border-2 border-amber-300 shadow-md relative">
                  <span className="inline-block bg-amber-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full mb-1">
                    Juara 1 Nusantara
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-base truncate">{top1.name}</h4>
                  <p className="text-[11px] text-slate-600 truncate">{top1.school}</p>
                  
                  <div className="mt-2.5 inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 px-3.5 py-1.5 rounded-xl font-black text-base shadow-sm">
                    <Star className="w-4 h-4 fill-slate-950 text-slate-950" />
                    <span>{getStarValue(top1)} ⭐</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-amber-200/60">
                    <span>Kelas {top1.grade} SD</span>
                    <button
                      onClick={() => handleCheer(top1)}
                      className="flex items-center gap-1 text-slate-700 hover:text-rose-600 active:scale-95 font-bold transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                      <span>{top1.cheerCount || 0}</span>
                    </button>
                  </div>
                </div>

                {/* Gold Podium Pillar */}
                <div className="w-full h-32 md:h-36 bg-gradient-to-b from-amber-300 via-amber-200 to-amber-300 rounded-t-2xl mt-2 flex flex-col items-center justify-center border-t-4 border-amber-400 shadow-inner">
                  <span className="font-black text-3xl text-amber-800">#1</span>
                  <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider">Emas Murni</span>
                </div>
              </motion.div>
            )}

            {/* Rank 3 - Bronze (Right) */}
            {top3 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="w-full md:w-1/3 flex flex-col items-center order-3"
              >
                <div className="relative mb-3 flex flex-col items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl p-1 bg-gradient-to-br from-amber-700 via-amber-600 to-orange-700 shadow-md">
                    <img
                      src={top3.avatar}
                      alt={top3.name}
                      className="w-full h-full rounded-[1.2rem] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-2 bg-gradient-to-r from-amber-700 to-orange-800 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-white">
                    <span>3</span>
                  </div>
                </div>

                <div className="text-center w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative">
                  <h4 className="font-extrabold text-slate-800 text-sm truncate">{top3.name}</h4>
                  <p className="text-[11px] text-slate-500 truncate">{top3.school}</p>
                  
                  <div className="mt-2.5 inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl text-amber-900 font-extrabold text-sm">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span>{getStarValue(top3)} ⭐</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span>Kelas {top3.grade}</span>
                    <button
                      onClick={() => handleCheer(top3)}
                      className="flex items-center gap-1 text-slate-600 hover:text-rose-600 active:scale-95 font-bold transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                      <span>{top3.cheerCount || 0}</span>
                    </button>
                  </div>
                </div>

                {/* Bronze Podium Pillar */}
                <div className="w-full h-20 md:h-22 bg-gradient-to-b from-amber-200 via-orange-100 to-amber-200 rounded-t-2xl mt-2 flex flex-col items-center justify-center border-t-4 border-amber-400 shadow-inner">
                  <span className="font-black text-2xl text-amber-800">#3</span>
                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Perunggu</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. FILTER & CONTROLS TOOLBAR                                              */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        {/* Scope Tabs (Global vs School vs Grade) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => {
                setScope('global');
                audioService.playClickSound();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                scope === 'global'
                  ? 'bg-white text-[#0058be] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Global Nusantara</span>
            </button>

            <button
              onClick={() => {
                setScope('school');
                audioService.playClickSound();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                scope === 'school'
                  ? 'bg-white text-[#0058be] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>Sekolah Saya</span>
            </button>

            <button
              onClick={() => {
                setScope('grade');
                audioService.playClickSound();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                scope === 'grade'
                  ? 'bg-white text-[#0058be] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Kelas {currentUser.grade}</span>
            </button>
          </div>

          {/* Timeframe selector (All time / Monthly / Weekly) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => {
                setTimeframe('all_time');
                audioService.playClickSound();
              }}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                timeframe === 'all_time' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sepanjang Masa
            </button>
            <button
              onClick={() => {
                setTimeframe('monthly');
                audioService.playClickSound();
              }}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                timeframe === 'monthly' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => {
                setTimeframe('weekly');
                audioService.playClickSound();
              }}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                timeframe === 'weekly' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pekan Ini
            </button>
          </div>
        </div>

        {/* Secondary Filter Row: Search & Grade Pills & Sort */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Grade Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
            <span className="text-xs font-bold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            <button
              onClick={() => setSelectedGrade('all')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedGrade === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Kelas
            </button>
            {([1, 2, 3, 4, 5, 6] as ClassGrade[]).map(g => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  selectedGrade === g
                    ? 'bg-[#0058be] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Kelas {g}
              </button>
            ))}
          </div>

          {/* Search Box & Sort */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari murid atau sekolah..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0058be]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as LeaderboardSortBy)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0058be]"
            >
              <option value="stars">Urutkan: Bintang ⭐</option>
              <option value="xp">Urutkan: XP ⚡</option>
              <option value="streak">Urutkan: Streak 🔥</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. COMPLETE LEADERBOARD LIST                                              */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <Award className="w-4 h-4 text-[#0058be]" />
            <span>Daftar Peringkat Lengkap ({filteredStudents.length} Murid)</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Diperbarui secara real-time
          </span>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <RotateCcw className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
            <h4 className="font-bold text-slate-700 text-base">Tidak ada murid yang sesuai</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Coba ganti kata kunci pencarian atau ubah filter tingkat kelas.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGrade('all');
                setScope('global');
              }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredStudents.map((student, idx) => {
              const rank = idx + 1;
              const isUser = student.isCurrentUser || student.id === currentUser.id;
              const starsVal = getStarValue(student);

              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }}
                  className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    isUser
                      ? 'bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/90 border-2 border-blue-400 shadow-md ring-2 ring-blue-300/30'
                      : rank <= 3
                      ? 'bg-white border border-amber-200/80 shadow-xs hover:border-amber-300'
                      : 'bg-white border border-slate-200/80 shadow-xs hover:border-slate-300'
                  }`}
                >
                  {/* Left: Rank & Avatar & Info */}
                  <div className="flex items-center gap-3.5">
                    {/* Rank Badge */}
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                      {rank === 1 ? (
                        <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
                          <Crown className="w-4 h-4 fill-slate-950" />
                        </div>
                      ) : rank === 2 ? (
                        <div className="w-8 h-8 rounded-xl bg-slate-300 text-slate-800 flex items-center justify-center shadow-xs">
                          2
                        </div>
                      ) : rank === 3 ? (
                        <div className="w-8 h-8 rounded-xl bg-amber-700 text-white flex items-center justify-center shadow-xs">
                          3
                        </div>
                      ) : (
                        <span className="text-slate-500 font-bold">#{rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />

                    {/* Name and School */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800 text-sm">{student.name}</span>
                        {isUser && (
                          <span className="bg-[#0058be] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            Kamu
                          </span>
                        )}
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Kelas {student.grade}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                        <span className="truncate max-w-[200px] sm:max-w-[240px]">{student.school}</span>
                        <span>•</span>
                        <span className="text-slate-600 font-medium">Level {student.level} ({student.xp} XP)</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Stars, Streak, and Cheer Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3.5 pl-11 sm:pl-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Streak Badge */}
                    <div className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-xl border border-orange-200">
                      <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                      <span>{student.streakDays}d</span>
                    </div>

                    {/* Stars Badge */}
                    <div className="flex items-center gap-1.5 bg-amber-50 px-3.5 py-1.5 rounded-xl border border-amber-200 text-amber-950 font-black text-sm">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                      <span>{starsVal} ⭐</span>
                    </div>

                    {/* Cheer Button */}
                    <button
                      onClick={() => handleCheer(student)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        recentCheeredId === student.id
                          ? 'bg-rose-500 text-white scale-105 shadow-md shadow-rose-500/20'
                          : 'bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 active:scale-95'
                      }`}
                      title="Beri tepuk tangan apresiasi"
                    >
                      <span>👏</span>
                      <span>{student.cheerCount || 0}</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. HOW TO EARN MORE STARS - KOBI TIPS CARD                                */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-6 sm:p-8 border border-blue-200/80">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#0058be]" />
          <h3 className="font-extrabold text-slate-800 text-base">
            Tips Robot Kobi: Cara Cepat Mengumpulkan Bintang Emas ⭐
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-2">
              ⭐
            </div>
            <h4 className="font-extrabold text-slate-800 text-sm">Selesaikan Misi Sempurna</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Jawab kuis bergambar dan tantangan arah tanpa kesalahan untuk mendapatkan 3 Bintang Penuh di setiap pulau petualangan.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold mb-2">
              🧩
            </div>
            <h4 className="font-extrabold text-slate-800 text-sm">Taklukkan Tantangan Studio</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Buka Studio Coding dan pecahkan tantangan algoritma (Tingkat Dasar, Menengah, dan Mahir) untuk bonus bintang ekstra.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center font-bold mb-2">
              🔥
            </div>
            <h4 className="font-extrabold text-slate-800 text-sm">Jaga Streak Harian</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Login dan pelajari minimal 1 materi setiap hari. Streak belajar membuka bonus bintang dan lencana khusus!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
