import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Crown, Star, ArrowRight, Flame, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LeaderboardMiniCard: React.FC = () => {
  const navigate = useNavigate();
  const { allLeaderboardStudents, currentUser } = useApp();

  // Sort by stars descending
  const sortedStudents = [...allLeaderboardStudents].sort((a, b) => b.stars - a.stars);
  const top3 = sortedStudents.slice(0, 3);

  // Find user's rank
  const userRankIndex = sortedStudents.findIndex(s => s.isCurrentUser || s.id === currentUser.id);
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : null;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
      {/* Top Title & Link */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
              <Trophy className="w-5 h-5 text-amber-600 fill-amber-500" />
            </div>
            <div>
              <h3 className="font-extrabold font-['Plus_Jakarta_Sans'] text-slate-800 text-base">
                Papan Skor Bintang
              </h3>
              <p className="text-xs text-slate-500">Peringkat Murid Nusantara</p>
            </div>
          </div>

          {userRank && (
            <div className="bg-blue-50 border border-blue-200 text-[#0058be] px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1">
              <span>Posisi Kamu:</span>
              <span className="bg-[#0058be] text-white px-1.5 py-0.2 rounded-md text-[11px]">
                #{userRank}
              </span>
            </div>
          )}
        </div>

        {/* Top 3 Mini Podium List */}
        <div className="space-y-2.5">
          {top3.map((student, idx) => {
            const rank = idx + 1;
            const isMe = student.isCurrentUser || student.id === currentUser.id;

            return (
              <div
                key={student.id}
                className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                  isMe
                    ? 'bg-blue-50/80 border-blue-300 shadow-xs'
                    : rank === 1
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-slate-50/70 border-slate-200/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0">
                    {rank === 1 ? (
                      <span className="text-amber-600 font-black">🥇</span>
                    ) : rank === 2 ? (
                      <span className="text-slate-500 font-black">🥈</span>
                    ) : (
                      <span className="text-amber-800 font-black">🥉</span>
                    )}
                  </div>

                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-8 h-8 rounded-xl object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-800 text-xs truncate max-w-[130px] sm:max-w-[180px]">
                        {student.name}
                      </span>
                      {isMe && (
                        <span className="text-[9px] bg-[#0058be] text-white font-bold px-1.5 py-0.2 rounded-full">
                          Kamu
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate max-w-[130px] sm:max-w-[180px]">
                      {student.school}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-slate-900 font-black text-xs shrink-0">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>{student.stars} ⭐</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action to Full Leaderboard */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Kumpulkan bintang di misi</span>
        </span>

        <button
          onClick={() => navigate('/student/leaderboard')}
          className="text-xs font-bold text-[#0058be] hover:text-[#2170e4] flex items-center gap-1 hover:gap-1.5 transition-all"
        >
          <span>Lihat Semua Peringkat</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
