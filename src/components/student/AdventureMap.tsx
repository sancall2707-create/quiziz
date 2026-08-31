import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  Lock,
  Check,
  Play,
  Award,
  Sparkles,
  MapPin,
  ChevronRight,
  Compass,
  ArrowLeft,
  Coins,
  Trophy
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CHAPTERS_DATA, LEARNING_WORLDS } from '../../data/mockData';
import { KobiCharacter } from '../common/KobiCharacter';
import { audioService } from '../../utils/audio';
import { OfflineBanner } from '../common/OfflineBanner';

export const AdventureMap: React.FC = () => {
  const { currentUser, setActiveMissionId, activeMissionId, setKobiPosition } = useApp();
  const navigate = useNavigate();
  const activeNodeRef = useRef<HTMLDivElement>(null);

  // Find active chapter based on current user grade
  const currentChapter = CHAPTERS_DATA.find(c => c.grade === currentUser.grade) || CHAPTERS_DATA[0];
  const currentWorld = LEARNING_WORLDS.find(w => w.id === currentChapter.worldId) || LEARNING_WORLDS[3];

  const completedMissions = currentUser.completedMissions || [];

  // Determine current active mission: either context activeMissionId or first uncompleted mission
  const activeMission = currentChapter.missions.find(m => m.id === activeMissionId) ||
    currentChapter.missions.find(m => !completedMissions.includes(m.id)) ||
    currentChapter.missions[currentChapter.missions.length - 1];

  const completedCount = currentChapter.missions.filter(m => completedMissions.includes(m.id)).length;

  const scrollToActive = () => {
    if (activeNodeRef.current) {
      activeNodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      audioService.playSnapSound();
    }
  };

  const handleNodeClick = (missionId: string, isLocked: boolean, originalIndex: number) => {
    if (isLocked) {
      audioService.playErrorSound();
      return;
    }
    audioService.playSnapSound();
    setKobiPosition(`node-${originalIndex + 1}`, missionId);
    navigate(`/student/mission/${missionId}`);
  };

  return (
    <div className="relative min-h-[85vh] space-y-6 pb-20 animate-in fade-in">
      {/* Offline Banner Notification */}
      <OfflineBanner />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#e1e2ec] shadow-sm">
        <div>
          <button
            onClick={() => navigate('/student/home')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0058be] hover:underline mb-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏝️</span>
            <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-2xl md:text-3xl text-gray-900">
              {currentWorld.name}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 font-semibold mt-0.5">
            {currentChapter.title} • {currentChapter.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/student/leaderboard')}
            className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-full font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2 transition-transform hover:scale-105"
          >
            <Trophy className="w-4 h-4 text-amber-600 fill-amber-500" />
            <span>Papan Skor</span>
          </button>

          <button
            onClick={scrollToActive}
            className="px-4 py-2.5 bg-[#d8e2ff] hover:bg-[#adc6ff] text-[#0058be] rounded-full font-bold text-xs sm:text-sm shadow-sm flex items-center gap-2 transition-transform hover:scale-105"
          >
            <MapPin className="w-4 h-4" />
            <span>Fokus ke Posisiku</span>
          </button>
        </div>
      </div>

      {/* Main Container: Map Trail on Left/Center + Active Mission Bento HUD on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Trail Map (lg:col-span-7) */}
        <div className="lg:col-span-7 relative bg-gradient-to-b from-[#ddf2fb] via-[#e8f5e9] to-[#d4edda] rounded-[3rem] p-6 sm:p-12 border-2 border-[#bbf7d0] shadow-inner overflow-hidden min-h-[650px] flex flex-col justify-end">
          {/* Decorative Clouds & Forest Trees */}
          <div className="absolute top-8 left-8 text-4xl opacity-80 animate-float pointer-events-none">☁️</div>
          <div className="absolute top-20 right-12 text-3xl opacity-70 animate-float pointer-events-none" style={{ animationDelay: '1.5s' }}>☁️</div>
          <div className="absolute top-1/2 left-6 text-3xl opacity-80 pointer-events-none">🌲</div>
          <div className="absolute top-1/3 right-8 text-3xl opacity-80 pointer-events-none">🌳</div>
          <div className="absolute bottom-12 right-10 text-4xl opacity-80 pointer-events-none">🌴</div>
          <div className="absolute bottom-16 left-12 text-3xl opacity-80 pointer-events-none">🍄</div>

          {/* SVG Trail Curve in Background */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path
              d="M 50,90 Q 25,75 50,60 T 50,30 Q 75,15 50,5"
              fill="none"
              stroke="#ffffff"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="4 4"
              opacity="0.8"
            />
            <path
              d="M 50,90 Q 25,75 50,60 T 50,30 Q 75,15 50,5"
              fill="none"
              stroke="#86efac"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="3 3"
            />
          </svg>

          {/* Mission Nodes: Ordered from 5 at top down to 1 at bottom */}
          <div className="relative z-10 space-y-12 flex flex-col items-center py-6">
            {[...currentChapter.missions].reverse().map((mission, idx) => {
              const originalIndex = currentChapter.missions.findIndex(m => m.id === mission.id);
              const isCompleted = completedMissions.includes(mission.id);
              const isActive = mission.id === activeMission.id;
              
              // Node is locked if it's not completed, not active, and earlier missions aren't completed
              const isPreviousCompleted = originalIndex === 0 || completedMissions.includes(currentChapter.missions[originalIndex - 1].id);
              const isLocked = !isCompleted && !isActive && !isPreviousCompleted;

              // Alternate horizontal offset for winding snake trail
              const offsetClasses = [
                'translate-x-0',
                '-translate-x-12 sm:-translate-x-20',
                'translate-x-8 sm:translate-x-16',
                '-translate-x-10 sm:-translate-x-16',
                'translate-x-0'
              ];
              const offsetClass = offsetClasses[idx % offsetClasses.length];

              const userScore = currentUser.missionScores?.[mission.id];
              const starCount = userScore?.stars || 3;

              return (
                <div
                  key={mission.id}
                  ref={isActive ? activeNodeRef : null}
                  className={`relative flex flex-col items-center ${offsetClass} transition-transform`}
                >
                  {/* "Kamu di Sini" indicator with Kobi Avatar for ACTIVE node */}
                  {isActive && (
                    <div className="absolute -top-16 flex flex-col items-center z-20 animate-bounce">
                      <div className="bg-[#0058be] text-white px-3 py-1 rounded-full text-[11px] font-extrabold shadow-lg flex items-center gap-1 border border-white">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        KAMU DI SINI!
                      </div>
                      <div className="w-2.5 h-2.5 bg-[#0058be] rotate-45 -mt-1 border-r border-b border-white" />
                    </div>
                  )}

                  {/* Node Button Card */}
                  <div
                    onClick={() => handleNodeClick(mission.id, isLocked, originalIndex)}
                    className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all ${
                      isActive
                        ? 'bg-gradient-to-tr from-[#0058be] to-[#2170e4] text-white ring-8 ring-[#adc6ff] shadow-2xl scale-110 animate-pulse-glow'
                        : isCompleted
                        ? 'bg-gradient-to-tr from-[#00855b] to-[#4edea3] text-white shadow-lg hover:scale-105'
                        : isLocked
                        ? 'bg-gray-300/80 text-gray-500 cursor-not-allowed border-4 border-gray-200 opacity-80'
                        : 'bg-white text-[#0058be] border-4 border-[#adc6ff] shadow-md hover:scale-105'
                    }`}
                  >
                    {/* Node Icon */}
                    <div className="text-2xl sm:text-3xl">
                      {isLocked ? (
                        <Lock className="w-7 h-7 text-gray-500" />
                      ) : isCompleted ? (
                        <Check className="w-8 h-8 text-white stroke-[3]" />
                      ) : mission.order === 1 ? (
                        '🚩'
                      ) : mission.order === 2 ? (
                        '🖱️'
                      ) : mission.order === 3 ? (
                        '⌨️'
                      ) : mission.order === 4 ? (
                        '🤖'
                      ) : (
                        '🧠'
                      )}
                    </div>

                    {/* Star ratings underneath completed nodes */}
                    {isCompleted && (
                      <div className="absolute -bottom-2 flex items-center gap-0.5 bg-white px-2 py-0.5 rounded-full shadow-md border border-amber-200">
                        {Array.from({ length: starCount }).map((_, s) => (
                          <Star key={s} className="w-3 h-3 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Node Title & Subtitle Badge */}
                  <div className="mt-3 text-center max-w-[150px]">
                    <span className={`text-xs font-extrabold px-3 py-1 rounded-full shadow-sm ${
                      isActive
                        ? 'bg-[#0058be] text-white'
                        : isCompleted
                        ? 'bg-[#e8f5e9] text-emerald-800 border border-[#a5d6a7]'
                        : isLocked
                        ? 'bg-gray-200 text-gray-500'
                        : 'bg-white text-gray-700 border'
                    }`}>
                      {mission.title}
                    </span>
                  </div>

                  {/* Kobi Standing next to active node */}
                  {isActive && (
                    <div className="absolute -right-24 -top-6 hidden sm:block pointer-events-none">
                      <KobiCharacter size="md" mood="happy" interactive={false} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Active Mission HUD Bento Card (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6 sticky top-20">
          {/* Chapter Summary Card */}
          <div className="p-6 bg-white rounded-3xl border border-[#e1e2ec] shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#d8e2ff] flex items-center justify-center text-2xl">
                🏝️
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase text-[#0058be] tracking-wider">
                  Bab 1 Sedang Aktif
                </span>
                <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl text-gray-900">
                  {currentChapter.title}
                </h3>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              {currentChapter.description}
            </p>
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 pt-3 border-t border-gray-100">
              <span>{currentChapter.missions.length} Misi Tersedia</span>
              <span className="text-emerald-600 flex items-center gap-1 font-bold">
                <Check className="w-3.5 h-3.5" /> {completedCount} dari {currentChapter.missions.length} Telah Selesai
              </span>
            </div>
          </div>

          {/* Active Mission Details Bento Card */}
          <div className="p-6 sm:p-8 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/60 rounded-3xl border-2 border-[#adc6ff] shadow-xl relative overflow-hidden">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d8e2ff] text-[#001a42] text-xs font-extrabold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#0058be]" />
              {completedMissions.includes(activeMission.id) ? 'Ulangi Misi Latihan' : 'Misi Rekomendasi Selanjutnya'}
            </div>

            <h2 className="font-['Plus_Jakarta_Sans'] font-extrabold text-2xl text-gray-900 mb-1">
              {activeMission.title}
            </h2>
            <p className="text-xs font-bold text-[#0058be] mb-4">
              Misi {activeMission.order} • {activeMission.subtitle}
            </p>

            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              {activeMission.description}
            </p>

            {/* Rewards Grid */}
            <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-white rounded-2xl border border-[#adc6ff]/60 mb-6 shadow-sm">
              <div className="text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Hadiah XP</p>
                <p className="text-sm font-extrabold text-[#0058be]">+{activeMission.rewardXp}</p>
              </div>
              <div className="text-center border-x border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Bintang</p>
                <p className="text-sm font-extrabold text-purple-700 flex items-center justify-center gap-0.5">
                  <Star className="w-3.5 h-3.5 fill-purple-600" />
                  {activeMission.rewardStars}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Koin</p>
                <p className="text-sm font-extrabold text-amber-600 flex items-center justify-center gap-0.5">
                  <Coins className="w-3.5 h-3.5 fill-amber-500" />
                  +{activeMission.rewardCoins}
                </p>
              </div>
            </div>

            {/* Skills acquired */}
            {activeMission.skillsGained && activeMission.skillsGained.length > 0 && (
              <div className="mb-6 space-y-1.5">
                <p className="text-xs font-bold text-gray-700">Keahlian Yang Akan Dipelajari:</p>
                <div className="flex flex-wrap gap-1.5">
                  {activeMission.skillsGained.map((sk, idx) => (
                    <span key={idx} className="text-[11px] font-bold bg-white text-gray-700 px-2.5 py-1 rounded-full border border-gray-200 shadow-2xs">
                      ✨ {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              onClick={() => {
                setActiveMissionId(activeMission.id);
                navigate(`/student/mission/${activeMission.id}`);
              }}
              className="w-full bg-[#0058be] hover:bg-[#2170e4] text-white font-['Plus_Jakarta_Sans'] font-extrabold text-base py-4 rounded-full tactile-btn shadow-xl shadow-[#0058be]/25 flex items-center justify-center gap-3 transition-transform"
            >
              <Play className="w-5 h-5 fill-white" />
              {completedMissions.includes(activeMission.id) ? 'Ulangi Misi Ini' : 'Mulai Misi Sekarang!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
