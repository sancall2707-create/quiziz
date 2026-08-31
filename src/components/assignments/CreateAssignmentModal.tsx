import React, { useState } from 'react';
import {
  X,
  Send,
  Calendar,
  BookOpen,
  Code2,
  HelpCircle,
  Sparkles,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClassGrade, AssignmentType } from '../../types';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGrade?: ClassGrade;
}

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
  defaultGrade
}) => {
  const { currentUser, createAssignment } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetGrade, setTargetGrade] = useState<ClassGrade | 'all'>(
    currentUser.role === 'admin' ? 'all' : defaultGrade || 4
  );
  const [type, setType] = useState<AssignmentType>('mission');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Judul tugas wajib diisi.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Deskripsi atau instruksi tugas wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await createAssignment({
      title,
      description,
      targetGrade,
      type,
      dueDate: dueDate ? dueDate : undefined
    });

    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(true);
      setTimeout(() => {
        setSuccessMessage(false);
        onClose();
        setTitle('');
        setDescription('');
        setDueDate('');
      }, 1200);
    } else {
      setErrorMessage(res.message || 'Gagal membuat tugas.');
    }
  };

  const typeOptions: { id: AssignmentType; label: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'mission',
      label: 'Misi Pembelajaran',
      icon: <BookOpen className="w-4 h-4" />,
      color: 'border-blue-500 bg-blue-50 text-blue-700'
    },
    {
      id: 'practice',
      label: 'Latihan Soal',
      icon: <HelpCircle className="w-4 h-4" />,
      color: 'border-emerald-500 bg-emerald-50 text-emerald-700'
    },
    {
      id: 'project',
      label: 'Proyek Studio Coding',
      icon: <Code2 className="w-4 h-4" />,
      color: 'border-purple-500 bg-purple-50 text-purple-700'
    },
    {
      id: 'quiz',
      label: 'Kuis Tantangan',
      icon: <Sparkles className="w-4 h-4" />,
      color: 'border-amber-500 bg-amber-50 text-amber-700'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-[#e1e2ec] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#0058be] to-[#2170e4] text-white flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-extrabold mb-1">
              <Layers className="w-3.5 h-3.5" />
              {currentUser.role === 'admin' ? 'Panel Admin' : 'Panel Guru'}
            </div>
            <h2 className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl">
              Buat Tugas Baru untuk Siswa
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Tugas berhasil disimpan dan dikirim ke siswa!
            </div>
          )}

          {/* Type of Assignment */}
          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-2">
              Tipe Tugas
            </label>
            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setType(opt.id)}
                  className={`p-3 rounded-2xl border-2 text-left text-xs font-bold flex items-center gap-2 transition-all ${
                    type === opt.id
                      ? opt.color + ' shadow-sm'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-1">
              Judul Tugas <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Contoh: Mengatur Gerak Robot Kobi di Labirin"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-[#0058be] focus:bg-white transition-all"
              required
            />
          </div>

          {/* Target Grade */}
          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-1">
              Kelas Sasaran
            </label>
            <select
              value={targetGrade}
              onChange={e => {
                const val = e.target.value;
                setTargetGrade(val === 'all' ? 'all' : (Number(val) as ClassGrade));
              }}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-[#0058be] focus:bg-white"
            >
              {currentUser.role === 'admin' && (
                <option value="all">Semua Kelas (Kelas 1–6 SD)</option>
              )}
              <option value="1">Kelas 1 SD (Dunia 1: Pulau Bentuk)</option>
              <option value="2">Kelas 2 SD (Dunia 2: Lembah Warna)</option>
              <option value="3">Kelas 3 SD (Dunia 3: Hutan Algoritma)</option>
              <option value="4">Kelas 4 SD (Dunia 4: Kota Logika & Studio)</option>
              <option value="5">Kelas 5 SD (Dunia 5: Pegunungan Variabel)</option>
              <option value="6">Kelas 6 SD (Dunia 6: Samudra Proyek Akhir)</option>
            </select>
          </div>

          {/* Due Date (Optional) */}
          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-1 flex items-center justify-between">
              <span>Tenggat Waktu (Opsional)</span>
              <span className="text-[11px] font-normal text-gray-400">Boleh dikosongkan</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-[#0058be] focus:bg-white"
              />
            </div>
          </div>

          {/* Description & Instruction */}
          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-1">
              Deskripsi & Instruksi Pengerjaan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Jelaskan petunjuk kepada siswa mengenai langkah yang harus diselesaikan..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-[#0058be] focus:bg-white resize-none"
              required
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-extrabold text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#0058be] hover:bg-[#2170e4] text-white text-xs font-extrabold rounded-full shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Kirim Tugas ke Siswa
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
