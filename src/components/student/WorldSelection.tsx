import React from 'react';
import {
  ArrowLeft,
  GraduationCap,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Lock,
  ChevronRight,
  Play
} from 'lucide-react';
import { LEARNING_WORLDS } from '../../data/mockData';
import { ClassGrade } from '../../types';
import { useApp } from '../../context/AppContext';

interface WorldSelectionProps {
  onBack: () => void;
  onSelectWorld: (worldId: string, grade: ClassGrade) => void;
}

export const WorldSelection: React.FC<WorldSelectionProps> = ({
  onBack,
  onSelectWorld
}) => {
  const { currentUser, updateUserGrade } = useApp();

  return (
    <div className="space-y-8 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0058be] hover:underline mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </button>
          <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-2xl sm:text-3xl text-gray-900">
            Dunia Belajar Informatika & CODESign
          </h1>
          <p className="text-sm text-gray-600">
            Kurikulum berjenjang dari Kelas 1 sampai Kelas 6 Sekolah Dasar
          </p>
        </div>
      </div>

      {/* Grid of 6 Worlds */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LEARNING_WORLDS.map(world => {
          const isUserCurrentGrade = world.grade === currentUser.grade;
          return (
            <div
              key={world.id}
              onClick={() => {
                updateUserGrade(world.grade);
                onSelectWorld(world.id, world.grade);
              }}
              className={`relative rounded-[2rem] p-6 border-2 transition-all cursor-pointer flex flex-col justify-between tactile-card ${
                isUserCurrentGrade
                  ? 'bg-gradient-to-b from-blue-50/80 to-white border-[#0058be] shadow-lg shadow-blue-500/10 ring-4 ring-[#0058be]/15'
                  : 'bg-white border-[#e1e2ec] hover:border-[#adc6ff]'
              }`}
            >
              {/* Badge for Current Grade */}
              {isUserCurrentGrade && (
                <div className="absolute top-4 right-4 bg-[#0058be] text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Kelas Aktifmu
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
                    style={{ backgroundColor: `${world.color}15`, color: world.color }}
                  >
                    {world.grade === 1 ? '🎨' : world.grade === 2 ? '🧭' : world.grade === 3 ? '⚙️' : world.grade === 4 ? '💻' : world.grade === 5 ? '🌐' : '✨'}
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                      {world.subtitle}
                    </span>
                    <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl text-gray-900 leading-tight">
                      {world.name}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  {world.description}
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <BookOpen className="w-4 h-4 text-[#0058be]" />
                    <span>{world.totalChapters} Bab Pembelajaran Komprehensif</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span>Aktivitas Interaktif & Studio Visual</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-bold text-[#0058be]">
                  {isUserCurrentGrade ? 'Masuki Dunia' : 'Ganti ke Kelas Ini'}
                </span>
                <div className="w-10 h-10 rounded-full bg-[#0058be] text-white flex items-center justify-center shadow-md transition-transform group-hover:translate-x-1">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
