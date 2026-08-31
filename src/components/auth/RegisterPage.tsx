import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  User,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Smile,
  ShieldCheck,
  AtSign
} from 'lucide-react';
import { KobiCharacter } from '../common/KobiCharacter';
import { audioService } from '../../utils/audio';
import { ClassGrade } from '../../types';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerStudent } = useApp();

  // Form State - strictly student focused, no email required
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    username: '',
    grade: 4 as ClassGrade,
    password: '',
    confirmPassword: ''
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Field change handler
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear specific field error on change
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (generalError) setGeneralError(null);
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Nama Lengkap Siswa
    if (!formData.name.trim()) {
      newErrors.name = 'Nama lengkap siswa wajib diisi.';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nama lengkap minimal 2 karakter.';
    }

    // 2. Nama Panggilan
    if (!formData.nickname.trim()) {
      newErrors.nickname = 'Nama panggilan wajib diisi.';
    }

    // 3. Username Siswa
    const cleanUsername = formData.username.trim();
    if (!cleanUsername) {
      newErrors.username = 'Username siswa wajib diisi.';
    } else if (cleanUsername.length < 4) {
      newErrors.username = 'Username minimal 4 karakter.';
    } else if (!/^[a-zA-Z0-9._]+$/.test(cleanUsername)) {
      newErrors.username = 'Username hanya boleh menggunakan huruf, angka, titik (.), atau garis bawah (_).';
    }

    // 4. Kelas 1 - 6 SD
    if (!formData.grade || formData.grade < 1 || formData.grade > 6) {
      newErrors.grade = 'Pilih kelas siswa antara 1 sampai 6.';
    }

    // 5. Kata Sandi
    if (!formData.password) {
      newErrors.password = 'Kata sandi wajib diisi.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Kata sandi minimal 8 karakter.';
    }

    // 6. Konfirmasi Kata Sandi
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi kata sandi wajib diisi.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi kata sandi tidak cocok dengan kata sandi.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) {
      audioService.playErrorSound();
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);

    try {
      const result = await registerStudent({
        name: formData.name.trim(),
        nickname: formData.nickname.trim(),
        username: formData.username.trim().toLowerCase(),
        grade: Number(formData.grade) as ClassGrade,
        password: formData.password
      });

      if (result.success) {
        audioService.playFanfare();
        navigate('/student/home');
      } else {
        audioService.playErrorSound();
        if (result.message?.toLowerCase().includes('username')) {
          setErrors(prev => ({ ...prev, username: result.message || 'Username sudah digunakan oleh akun lain.' }));
        } else {
          setGeneralError(result.message || 'Pendaftaran gagal. Silakan periksa kembali data Anda.');
        }
      }
    } catch (err: any) {
      audioService.playErrorSound();
      setGeneralError('Terjadi kesalahan sistem saat mendaftar. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f2f3fd] via-[#e8f0fe] to-white flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] border-2 border-[#adc6ff] shadow-2xl p-6 sm:p-10 space-y-6 relative overflow-hidden">
        
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#0058be] via-[#7c4dff] to-[#0058be]" />

        {/* Top Header & Branding */}
        <div className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d8e2ff] text-[#001a42] text-xs font-extrabold shadow-xs">
            <Sparkles className="w-4 h-4 text-[#0058be]" />
            PENDAFTARAN SISWA BARU
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-[#0058be] to-[#2170e4] rounded-2xl flex items-center justify-center text-white text-2xl shadow-md">
              🤖
            </div>
            <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-3xl sm:text-4xl text-[#0058be] tracking-tight">
              CodeNusa
            </h1>
          </div>

          <p className="text-sm sm:text-base text-gray-600 font-semibold max-w-md mx-auto">
            Buat akun siswa dengan mudah untuk mulai belajar koding, logika komputasi, dan berpetualang bersama Kobi!
          </p>
        </div>

        {/* Mascot Speech */}
        <div className="flex justify-center">
          <KobiCharacter
            size="sm"
            mood="celebrating"
            showSpeech={true}
            speechText="Halo sahabat cilik! Cukup isi nama, username, dan kelas untuk mulai petualangan kodingmu!"
            interactive={true}
          />
        </div>

        {/* General Error Banner */}
        {generalError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          {/* Row 1: Nama Lengkap & Nama Panggilan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Nama Lengkap Siswa <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder="Contoh: Budi Pratama"
                  className={`w-full pl-10 pr-4 py-3.5 bg-[#f9f9ff] rounded-2xl border-2 font-semibold text-sm text-gray-900 transition-all focus:outline-none focus:bg-white ${
                    errors.name
                      ? 'border-red-400 focus:border-red-500 ring-2 ring-red-100'
                      : 'border-gray-200 focus:border-[#0058be] focus:ring-4 focus:ring-[#adc6ff]/40'
                  }`}
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-4" />
              </div>
              {errors.name && (
                <p className="text-xs text-red-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Nama Panggilan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={e => handleChange('nickname', e.target.value)}
                  placeholder="Contoh: Budi"
                  className={`w-full pl-10 pr-4 py-3.5 bg-[#f9f9ff] rounded-2xl border-2 font-semibold text-sm text-gray-900 transition-all focus:outline-none focus:bg-white ${
                    errors.nickname
                      ? 'border-red-400 focus:border-red-500 ring-2 ring-red-100'
                      : 'border-gray-200 focus:border-[#0058be] focus:ring-4 focus:ring-[#adc6ff]/40'
                  }`}
                />
                <Smile className="w-4 h-4 text-gray-400 absolute left-3.5 top-4" />
              </div>
              {errors.nickname && (
                <p className="text-xs text-red-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.nickname}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Username Siswa (Clean Full Width layout) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Username Siswa <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-gray-500 font-semibold">
                Min. 4 karakter (huruf, angka, . atau _)
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={formData.username}
                onChange={e => handleChange('username', e.target.value)}
                placeholder="Contoh: budi_pratama atau budi.coder"
                className={`w-full pl-10 pr-4 py-3.5 bg-[#f9f9ff] rounded-2xl border-2 font-semibold text-sm text-gray-900 transition-all focus:outline-none focus:bg-white ${
                  errors.username
                    ? 'border-red-400 focus:border-red-500 ring-2 ring-red-100'
                    : 'border-gray-200 focus:border-[#0058be] focus:ring-4 focus:ring-[#adc6ff]/40'
                }`}
              />
              <AtSign className="w-4 h-4 text-gray-400 absolute left-3.5 top-4" />
            </div>
            {errors.username && (
              <p className="text-xs text-red-600 mt-1.5 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.username}
              </p>
            )}
          </div>

          {/* Row 3: Pilihan Kelas Siswa (1 - 6 SD) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Kelas Sekolah Dasar (SD) <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-gray-500 font-semibold">
                Pilih kelas 1 sampai 6
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {([1, 2, 3, 4, 5, 6] as ClassGrade[]).map(gradeNum => {
                const isSelected = formData.grade === gradeNum;
                return (
                  <button
                    type="button"
                    key={gradeNum}
                    onClick={() => {
                      handleChange('grade', gradeNum);
                      audioService.playSnapSound();
                    }}
                    className={`py-3 px-2 rounded-2xl font-['Plus_Jakarta_Sans'] font-extrabold text-sm border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? 'bg-[#0058be] border-[#0058be] text-white shadow-md scale-105 ring-2 ring-[#adc6ff]'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-[#adc6ff] hover:bg-blue-50/50'
                    }`}
                  >
                    <GraduationCap className={`w-4 h-4 ${isSelected ? 'text-amber-300' : 'text-gray-400'}`} />
                    <span>Kelas {gradeNum}</span>
                  </button>
                );
              })}
            </div>
            {errors.grade && (
              <p className="text-xs text-red-600 mt-1 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.grade}
              </p>
            )}
          </div>

          {/* Row 4: Password & Konfirmasi Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Kata Sandi <span className="text-red-500">* (Min. 8 Karakter)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => handleChange('password', e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className={`w-full pl-10 pr-10 py-3.5 bg-[#f9f9ff] rounded-2xl border-2 font-semibold text-sm text-gray-900 transition-all focus:outline-none focus:bg-white ${
                    errors.password
                      ? 'border-red-400 focus:border-red-500 ring-2 ring-red-100'
                      : 'border-gray-200 focus:border-[#0058be] focus:ring-4 focus:ring-[#adc6ff]/40'
                  }`}
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-4" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 absolute right-3 top-3 focus:outline-none"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.password}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Konfirmasi Kata Sandi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={e => handleChange('confirmPassword', e.target.value)}
                  placeholder="Ulangi kata sandi"
                  className={`w-full pl-10 pr-10 py-3.5 bg-[#f9f9ff] rounded-2xl border-2 font-semibold text-sm text-gray-900 transition-all focus:outline-none focus:bg-white ${
                    errors.confirmPassword
                      ? 'border-red-400 focus:border-red-500 ring-2 ring-red-100'
                      : 'border-gray-200 focus:border-[#0058be] focus:ring-4 focus:ring-[#adc6ff]/40'
                  }`}
                />
                <ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3.5 top-4" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 absolute right-3 top-3 focus:outline-none"
                  aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi' : 'Tampilkan konfirmasi'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Information & Welcome Bonus Note */}
          <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0058be] shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900 font-medium leading-relaxed">
              Akun yang dibuat akan otomatis terdaftar sebagai <strong>Murid SD</strong> dengan progres awal petualangan koding dan 50 Koin bonus selamat datang!
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 px-6 bg-[#0058be] hover:bg-[#2170e4] text-white font-['Plus_Jakarta_Sans'] font-extrabold text-base rounded-full shadow-lg shadow-[#0058be]/25 transition-all flex items-center justify-center gap-2 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Mendaftarkan Akun Siswa...</span>
              </>
            ) : (
              <>
                <span>Daftar Sekarang & Mulai Belajar</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Login */}
        <div className="text-center pt-3 border-t border-gray-100">
          <p className="text-xs sm:text-sm text-gray-600 font-semibold">
            Sudah punya akun?{' '}
            <Link
              to="/login"
              className="text-[#0058be] hover:underline font-extrabold inline-flex items-center gap-1"
            >
              Masuk di sini <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
