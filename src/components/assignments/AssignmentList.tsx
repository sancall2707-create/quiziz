import React from 'react';
import {
  BookOpen,
  HelpCircle,
  Code2,
  Sparkles,
  Calendar,
  Trash2,
  Layers,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Assignment, AssignmentType } from '../../types';

interface AssignmentListProps {
  gradeFilter?: number | 'all';
  canManage?: boolean;
}

export const AssignmentList: React.FC<AssignmentListProps> = ({
  gradeFilter,
  canManage = false
}) => {
  const { assignments, deleteAssignment, currentUser } = useApp();

  const filteredAssignments = assignments.filter(a => {
    if (!gradeFilter || gradeFilter === 'all') return true;
    return a.targetGrade === gradeFilter || a.targetGrade === 'all';
  });

  const getTypeBadge = (type: AssignmentType) => {
    switch (type) {
      case 'mission':
        return {
          label: 'Misi Pembelajaran',
          icon: <BookOpen className="w-3.5 h-3.5" />,
          color: 'bg-blue-100 text-blue-800'
        };
      case 'practice':
        return {
          label: 'Latihan Soal',
          icon: <HelpCircle className="w-3.5 h-3.5" />,
          color: 'bg-emerald-100 text-emerald-800'
        };
      case 'project':
        return {
          label: 'Proyek Studio',
          icon: <Code2 className="w-3.5 h-3.5" />,
          color: 'bg-purple-100 text-purple-800'
        };
      case 'quiz':
        return {
          label: 'Kuis Tantangan',
          icon: <Sparkles className="w-3.5 h-3.5" />,
          color: 'bg-amber-100 text-amber-800'
        };
    }
  };

  if (filteredAssignments.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
        <Layers className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-sm font-bold text-gray-600">Belum ada tugas yang dibuat untuk kelas ini.</p>
        <p className="text-xs text-gray-400 mt-1">Gunakan tombol "Buat Tugas Baru" untuk menugaskan materi ke siswa.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filteredAssignments.map(asg => {
        const badge = getTypeBadge(asg.type);
        const isOwner = currentUser.role === 'admin' || asg.createdBy?.uid === currentUser.id;

        return (
          <div
            key={asg.id}
            className="p-5 bg-white rounded-3xl border-2 border-[#e1e2ec] hover:border-[#adc6ff] transition-all shadow-sm flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold ${badge.color}`}>
                  {badge.icon}
                  {badge.label}
                </span>

                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {asg.targetGrade === 'all' ? 'Semua Kelas' : `Kelas ${asg.targetGrade} SD`}
                </span>
              </div>

              <h4 className="font-['Plus_Jakarta_Sans'] font-extrabold text-base text-gray-900 line-clamp-1">
                {asg.title}
              </h4>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                {asg.description}
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-semibold">
              <div className="flex items-center gap-2">
                {asg.dueDate ? (
                  <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
                    <Calendar className="w-3.5 h-3.5" />
                    Tenggat: {asg.dueDate}
                  </span>
                ) : (
                  <span className="text-gray-400">Tanpa batas waktu</span>
                )}
              </div>

              {canManage && isOwner && (
                <button
                  onClick={() => {
                    if (confirm(`Hapus tugas "${asg.title}"?`)) {
                      deleteAssignment(asg.id);
                    }
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Hapus Tugas"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
