import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  X,
  GraduationCap,
  ShieldAlert
} from 'lucide-react';
import { KobiCharacter } from '../common/KobiCharacter';
import { audioService } from '../../utils/audio';

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();

  // Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setErrorMessage('Username wajib diisi.');
      audioService.playErrorSound();
      return;
    }
    if (!cleanPass) {
      setErrorMessage('Kata sandi (password) wajib diisi.');
      audioService.playErrorSound();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await login(cleanId, cleanPass);
      if (res.success && res.user) {
        audioService.playSuccessSound();
        if (res.user.role === 'student') {
          navigate('/student/home');
        } else if (res.user.role === 'teacher') {
          navigate('/teacher/dashboard');
        } else if (res.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/student/home');
        }
      } else {
        audioService.playErrorSound();
        setErrorMessage(res.message || 'Login gagal. Periksa kembali username dan kata sandi Anda.');
      }
    } catch (err) {
      audioService.playErrorSound();
      setErrorMessage('Terjadi kesalahan saat masuk. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f2f3fd] via-[#e8f0fe] to-white flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] border-2 border-[#adc6ff] shadow-2xl p-6 sm:p-10 space-y-6 relative overflow-hidden">
        
        {/* Top Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#0058be] via-[#7c4dff] to-[#0058be]" />

        {/* Top Header & Branding */}
        <div className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d8e2ff] text-[#001a42] text-xs font-extrabold shadow-xs">
            <Sparkles className="w-4 h-4 text-[#0058be]" />
            PLATFORM PEMBELAJARAN INFORMATIKA SD
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
            Selamat datang kembali! Masuk dengan akun Anda untuk melanjutkan aktivitas pembelajaran.
          </p>
        </div>

        {/* Mascot Speech */}
        <div className="flex justify-center">
          <KobiCharacter
            size="sm"
            mood="happy"
            showSpeech={true}
            speechText="Halo sahabat koding! Masukkan username dan kata sandimu ya!"
            interactive={true}
          />
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Credential Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={e => {
                  setIdentifier(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Masukkan username"
                className="w-full pl-10 pr-4 py-3.5 bg-[#f9f9ff] rounded-2xl border-2 border-gray-200 font-semibold text-sm text-gray-900 transition-all focus:outline-none focus:bg-white focus:border-[#0058be] focus:ring-4 focus:ring-[#adc6ff]/40"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-4" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Kata Sandi (Password)
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-xs font-bold text-[#0058be] hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Lupa kata sandi?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Masukkan kata sandi akun"
                className="w-full pl-10 pr-10 py-3.5 bg-[#f9f9ff] rounded-2xl border-2 border-gray-200 font-semibold text-sm text-gray-900 transition-all focus:outline-none focus:bg-white focus:border-[#0058be] focus:ring-4 focus:ring-[#adc6ff]/40"
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
          </div>

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
                <span>Memverifikasi Akun...</span>
              </>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Link: Belum punya akun? Daftar sekarang */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-2xl border border-[#adc6ff] text-center">
          <p className="text-xs sm:text-sm text-gray-700 font-semibold">
            Belum punya akun siswa?{' '}
            <Link
              to="/register"
              className="text-[#0058be] font-extrabold hover:underline inline-flex items-center gap-1 ml-1"
            >
              Daftar Sekarang <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <div className="text-center pt-2">
          <p className="text-[11px] text-gray-400 font-medium">
            Informatika SD • Berpikir Komputasional • Sokrates Platform Ready
          </p>
        </div>
      </div>

      {/* Modal Lupa Kata Sandi Siswa */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl border-2 border-[#adc6ff] shadow-2xl p-6 sm:p-8 space-y-5 text-center relative animate-in zoom-in-95">
            <button
              onClick={() => setShowForgotPasswordModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 mx-auto bg-[#d8e2ff] text-[#0058be] rounded-3xl flex items-center justify-center border-2 border-[#adc6ff] shadow-inner">
              <GraduationCap className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl text-gray-900">
                Lupa Kata Sandi?
              </h3>
              <p className="text-sm font-bold text-[#0058be]">
                Hubungi guru atau admin.
              </p>
              <p className="text-xs text-gray-600 leading-relaxed pt-1">
                Karena akun siswa CodeNusa tidak menggunakan email, silakan beritahu guru kelas atau admin sekolah Anda untuk membantu mereset kata sandi akunmu.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-left flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-900 font-semibold leading-relaxed">
                Guru atau admin dapat langsung mengatur ulang kata sandi melalui menu manajemen sekolah.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(false)}
              className="w-full py-3 bg-[#0058be] hover:bg-[#2170e4] text-white text-xs font-extrabold rounded-full shadow-md transition-all"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
