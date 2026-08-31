import React, { useState } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { audioService } from '../../utils/audio';

export const ChangePasswordModal: React.FC = () => {
  const { currentUser, mustChangePassword, updatePassword } = useApp();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!mustChangePassword) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedNew) {
      setError('Kata sandi baru wajib diisi.');
      audioService.playErrorSound();
      return;
    }
    if (trimmedNew.length < 8) {
      setError('Kata sandi baru minimal 8 karakter.');
      audioService.playErrorSound();
      return;
    }
    if (trimmedNew !== trimmedConfirm) {
      setError('Konfirmasi kata sandi baru tidak cocok.');
      audioService.playErrorSound();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await updatePassword(trimmedNew);
      if (res.success) {
        audioService.playSuccessSound();
      } else {
        setError(res.message || 'Gagal memperbarui kata sandi.');
        audioService.playErrorSound();
      }
    } catch {
      setError('Terjadi kesalahan jaringan.');
      audioService.playErrorSound();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl border-2 border-[#adc6ff] shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="font-['Plus_Jakarta_Sans'] font-extrabold text-2xl text-gray-900">
            Wajib Ganti Kata Sandi
          </h2>
          <p className="text-xs text-gray-600 font-medium">
            Halo <span className="font-bold text-gray-900">{currentUser.name}</span> (@{currentUser.username})! Demi keamanan akun, Anda diwajibkan mengganti kata sandi sementara saat pertama kali masuk.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => {
                  setNewPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Minimal 8 karakter"
                className="w-full pl-10 pr-10 py-3 bg-[#f9f9ff] rounded-2xl border-2 border-gray-200 font-semibold text-sm text-gray-900 transition-all focus:outline-none focus:bg-white focus:border-[#0058be]"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 text-gray-400 hover:text-gray-600 absolute right-3 top-2.5 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Konfirmasi Kata Sandi Baru
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => {
                  setConfirmPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ulangi kata sandi baru"
                className="w-full pl-10 pr-10 py-3 bg-[#f9f9ff] rounded-2xl border-2 border-gray-200 font-semibold text-sm text-gray-900 transition-all focus:outline-none focus:bg-white focus:border-[#0058be]"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="p-1.5 text-gray-400 hover:text-gray-600 absolute right-3 top-2.5 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3.5 px-6 bg-[#0058be] hover:bg-[#2170e4] text-white font-['Plus_Jakarta_Sans'] font-extrabold text-sm rounded-full shadow-lg shadow-[#0058be]/25 transition-all flex items-center justify-center gap-2 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan Kata Sandi...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Kata Sandi & Lanjutkan</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
