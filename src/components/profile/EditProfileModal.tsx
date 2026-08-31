import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Smile,
  Upload,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  Shield,
  GraduationCap,
  AtSign,
  FileText,
  Camera,
  RotateCcw
} from 'lucide-react';
import { User as UserType } from '../../types';
import { useApp } from '../../context/AppContext';
import { CODENUSA_AVATAR_PRESETS } from '../../data/avatarPresets';
import { UserAvatar, getInitials } from '../common/UserAvatar';
import { validateImageFile, cropImageToSquare, uploadAvatarToStorage } from '../../utils/imageUpload';
import { audioService } from '../../utils/audio';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: UserType;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  targetUser
}) => {
  const { currentUser, updateUserProfile } = useApp();
  const userToEdit = targetUser || currentUser;

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  
  // Avatar Selection State
  const [avatarTab, setAvatarTab] = useState<'preset' | 'upload' | 'initial'>('preset');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState('');
  const [selectedAvatarType, setSelectedAvatarType] = useState<'preset' | 'custom' | 'initial'>('preset');
  
  // Custom Upload State
  const [uploadedBlob, setUploadedBlob] = useState<Blob | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status & Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  // Initialize form with user data whenever modal opens
  useEffect(() => {
    if (isOpen && userToEdit) {
      const initialName = userToEdit.fullName || userToEdit.name || '';
      const initialNick = userToEdit.nickname || userToEdit.displayName || '';
      const initialBio = userToEdit.bio || '';
      const initialAvatar = userToEdit.avatarUrl || userToEdit.avatar || '';
      const initialType = userToEdit.avatarType || (initialAvatar.startsWith('data:') ? 'custom' : initialAvatar ? 'preset' : 'initial');

      setFullName(initialName);
      setNickname(initialNick);
      setBio(initialBio);
      setSelectedAvatarUrl(initialAvatar);
      setSelectedAvatarType(initialType);
      
      if (initialType === 'custom' && initialAvatar) {
        setAvatarTab('upload');
        setPreviewDataUrl(initialAvatar);
      } else if (initialType === 'initial' || !initialAvatar) {
        setAvatarTab('initial');
      } else {
        setAvatarTab('preset');
      }

      setUploadedBlob(null);
      setUploadError(null);
      setErrors({});
      setSubmitError(null);
      setSuccessToast(false);
    }
  }, [isOpen, userToEdit]);

  if (!isOpen || !userToEdit) return null;

  // Determine if form has changes
  const originalName = userToEdit.fullName || userToEdit.name || '';
  const originalNick = userToEdit.nickname || userToEdit.displayName || '';
  const originalBio = userToEdit.bio || '';
  const originalAvatar = userToEdit.avatarUrl || userToEdit.avatar || '';
  const originalType = userToEdit.avatarType || (originalAvatar.startsWith('data:') ? 'custom' : originalAvatar ? 'preset' : 'initial');

  const currentEffectiveAvatar =
    avatarTab === 'initial'
      ? ''
      : avatarTab === 'upload'
      ? (previewDataUrl || selectedAvatarUrl)
      : selectedAvatarUrl;

  const currentEffectiveType: 'preset' | 'custom' | 'initial' =
    avatarTab === 'initial'
      ? 'initial'
      : avatarTab === 'upload'
      ? 'custom'
      : 'preset';

  const hasChanges =
    fullName.trim() !== originalName.trim() ||
    nickname.trim() !== originalNick.trim() ||
    bio.trim() !== originalBio.trim() ||
    currentEffectiveAvatar !== originalAvatar ||
    currentEffectiveType !== originalType ||
    uploadedBlob !== null;

  // Validate form fields
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!fullName.trim()) {
      errs.fullName = 'Nama lengkap wajib diisi.';
    } else if (fullName.trim().length < 2) {
      errs.fullName = 'Nama lengkap minimal 2 karakter.';
    }

    if (nickname.length > 30) {
      errs.nickname = 'Nama panggilan maksimal 30 karakter.';
    }

    if (bio.length > 120) {
      errs.bio = 'Bio singkat maksimal 120 karakter.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle File Upload & Cropping
  const handleFileSelect = async (file: File) => {
    setUploadError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'File tidak valid.');
      audioService.playErrorSound();
      return;
    }

    setIsProcessingImage(true);
    try {
      const cropped = await cropImageToSquare(file, 300);
      setUploadedBlob(cropped.blob);
      setPreviewDataUrl(cropped.dataUrl);
      setSelectedAvatarUrl(cropped.dataUrl);
      setSelectedAvatarType('custom');
      setAvatarTab('upload');
      audioService.playPopSound();
    } catch (err) {
      console.error('Image cropping error:', err);
      setUploadError('Gagal memproses gambar. Pastikan file gambar tidak rusak.');
      audioService.playErrorSound();
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!validate()) {
      audioService.playErrorSound();
      return;
    }

    if (!hasChanges) {
      onClose();
      return;
    }

    setIsSaving(true);
    setSubmitError(null);

    try {
      let finalAvatarUrl = selectedAvatarUrl;
      let finalAvatarType = currentEffectiveType;

      // If user uploaded a new image file, upload to Firebase Storage
      if (avatarTab === 'upload' && uploadedBlob && previewDataUrl) {
        finalAvatarUrl = await uploadAvatarToStorage(
          userToEdit.id,
          uploadedBlob,
          previewDataUrl
        );
        finalAvatarType = 'custom';
      } else if (avatarTab === 'initial') {
        finalAvatarUrl = '';
        finalAvatarType = 'initial';
      }

      const result = await updateUserProfile(userToEdit.id, {
        name: fullName.trim(),
        fullName: fullName.trim(),
        nickname: nickname.trim(),
        displayName: nickname.trim() || fullName.trim(),
        avatar: finalAvatarUrl,
        avatarUrl: finalAvatarUrl,
        avatarType: finalAvatarType,
        bio: bio.trim()
      });

      if (!result.success) {
        setSubmitError(result.message || 'Gagal memperbarui profil.');
        audioService.playErrorSound();
        setIsSaving(false);
        return;
      }

      // Success
      setSuccessToast(true);
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Save profile error:', err);
      setSubmitError('Terjadi kesalahan tidak terduga saat menyimpan profil.');
      setIsSaving(false);
      audioService.playErrorSound();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-100 overflow-hidden my-6 relative flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans']">Ubah Profil Pengguna</h2>
              <p className="text-emerald-100 text-xs">Sesuaikan identitas, avatar, dan bio akun CodeNusa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors text-white disabled:opacity-50"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Toast Overlay */}
        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-6 right-6 z-20 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-center space-x-2 font-bold text-sm"
            >
              <Check className="w-5 h-5" />
              <span>Profil berhasil diperbarui!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1">
          {submitError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl flex items-start space-x-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Section: Live Avatar Preview & Selection */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
            <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center space-x-2">
              <Smile className="w-4 h-4 text-emerald-600" />
              <span>Pilihan Avatar Akun</span>
            </label>

            {/* Live Preview Avatar & Active Name */}
            <div className="flex items-center space-x-4 mb-5 pb-4 border-b border-slate-200/80">
              <div className="relative">
                <UserAvatar
                  name={fullName || userToEdit.name}
                  avatar={currentEffectiveAvatar}
                  avatarType={currentEffectiveType}
                  size="xl"
                  className="ring-4 ring-white shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full text-[10px] shadow-sm">
                  <Sparkles className="w-3 h-3" />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pratinjau Avatar</p>
                <h4 className="text-base font-extrabold text-slate-800 truncate">
                  {nickname.trim() || fullName.trim() || 'Nama Pengguna'}
                </h4>
                <p className="text-xs text-slate-500 truncate">
                  @{userToEdit.username} • {userToEdit.role === 'student' ? `Kelas ${userToEdit.grade} SD` : userToEdit.role === 'teacher' ? 'Guru' : 'Administrator'}
                </p>
              </div>
            </div>

            {/* Avatar Tab Selector */}
            <div className="flex rounded-xl bg-slate-200/70 p-1 mb-4 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => {
                  setAvatarTab('preset');
                  if (selectedAvatarType === 'initial') {
                    setSelectedAvatarUrl(CODENUSA_AVATAR_PRESETS[0].url);
                    setSelectedAvatarType('preset');
                  }
                }}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                  avatarTab === 'preset' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Karakter CodeNusa</span>
              </button>
              <button
                type="button"
                onClick={() => setAvatarTab('upload')}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                  avatarTab === 'upload' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah Foto Sendiri</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAvatarTab('initial');
                  setSelectedAvatarType('initial');
                  setSelectedAvatarUrl('');
                }}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                  avatarTab === 'initial' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Inisial Nama</span>
              </button>
            </div>

            {/* Tab 1: Preset Grid */}
            {avatarTab === 'preset' && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-48 overflow-y-auto p-1">
                {CODENUSA_AVATAR_PRESETS.map((preset) => {
                  const isSelected = selectedAvatarUrl === preset.url && selectedAvatarType === 'preset';
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedAvatarUrl(preset.url);
                        setSelectedAvatarType('preset');
                        audioService.playPopSound();
                      }}
                      className={`relative rounded-2xl p-1.5 border-2 transition-all flex flex-col items-center group ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 scale-105 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                      title={preset.name}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <span className="text-[10px] font-medium text-slate-700 mt-1 truncate w-full text-center">
                        {preset.name.split(' ')[0]}
                      </span>
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white rounded-full p-0.5 shadow-sm">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tab 2: Upload Custom Image */}
            {avatarTab === 'upload' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />

                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                    uploadError
                      ? 'border-rose-300 bg-rose-50/50'
                      : previewDataUrl
                      ? 'border-emerald-400 bg-emerald-50/40'
                      : 'border-slate-300 hover:border-emerald-500 bg-white hover:bg-slate-50'
                  }`}
                >
                  {isProcessingImage ? (
                    <div className="py-4 flex flex-col items-center">
                      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                      <p className="text-xs font-semibold text-slate-600">Memotong & menyiapkan gambar 1:1...</p>
                    </div>
                  ) : previewDataUrl ? (
                    <div className="flex flex-col items-center space-y-2">
                      <img
                        src={previewDataUrl}
                        alt="Preview Upload"
                        className="w-20 h-20 rounded-2xl object-cover ring-2 ring-emerald-500 shadow-md"
                      />
                      <p className="text-xs font-bold text-emerald-700">Foto siap digunakan (Rasio 1:1)</p>
                      <p className="text-[11px] text-slate-500">Klik atau seret file baru untuk mengganti</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Klik untuk memilih foto atau seret ke sini
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Format JPG, PNG, atau WebP • Maksimal 2 MB • Otomatis dipotong 1:1
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {uploadError && (
                  <div className="text-xs text-rose-600 font-semibold flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Initials Only */}
            {avatarTab === 'initial' && (
              <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center space-x-4">
                <UserAvatar
                  name={fullName || userToEdit.name}
                  avatarType="initial"
                  size="lg"
                />
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800">Inisial Warna Otomatis</p>
                  <p>Inisial huruf akan diambil secara otomatis dari nama Anda dengan palet warna yang konsisten.</p>
                </div>
              </div>
            )}
          </div>

          {/* Section: Basic Profile Inputs */}
          <div className="space-y-4">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Nama Lengkap <span className="text-rose-500">*</span></span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.fullName;
                        return copy;
                      });
                    }
                  }}
                  placeholder="Contoh: Wijaya Pratama"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all focus:outline-hidden ${
                    errors.fullName
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/20'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white'
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-rose-500 font-semibold mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.fullName}</span>
                </p>
              )}
            </div>

            {/* Nama Panggilan / Tampilan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Nama Panggilan / Nama Tampilan</span>
                <span className={`text-[11px] font-mono ${nickname.length > 30 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                  {nickname.length}/30
                </span>
              </label>
              <input
                type="text"
                value={nickname}
                maxLength={30}
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (errors.nickname) {
                    setErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.nickname;
                      return copy;
                    });
                  }
                }}
                placeholder="Contoh: Wijaya"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white text-sm font-semibold transition-all focus:outline-hidden"
              />
              {errors.nickname && (
                <p className="text-xs text-rose-500 font-semibold mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.nickname}</span>
                </p>
              )}
            </div>

            {/* Bio Singkat Opsional */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Bio Singkat (Opsional)</span>
                <span className={`text-[11px] font-mono ${bio.length > 120 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                  {bio.length}/120
                </span>
              </label>
              <textarea
                value={bio}
                maxLength={120}
                rows={2}
                onChange={(e) => {
                  setBio(e.target.value);
                  if (errors.bio) {
                    setErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.bio;
                      return copy;
                    });
                  }
                }}
                placeholder="Tuliskan semangat belajarmu, hobi koding, atau moto petualangan..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white text-sm font-medium transition-all focus:outline-hidden resize-none"
              />
              {errors.bio && (
                <p className="text-xs text-rose-500 font-semibold mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.bio}</span>
                </p>
              )}
            </div>
          </div>

          {/* Read-Only Academic & Account Information */}
          <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center space-x-1.5 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Informasi Terkunci (Read-Only)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <span className="text-slate-400 block text-[10px]">Username</span>
                <span className="font-mono font-bold text-slate-700">@{userToEdit.username}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Peran (Role)</span>
                <span className="font-bold text-slate-700 capitalize">
                  {userToEdit.role === 'student' ? 'Siswa' : userToEdit.role === 'teacher' ? 'Guru' : 'Administrator'}
                </span>
              </div>
              {userToEdit.role === 'student' && (
                <div>
                  <span className="text-slate-400 block text-[10px]">Kelas Siswa</span>
                  <span className="font-bold text-slate-700">Kelas {userToEdit.grade} SD</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 pt-1 italic">
              * Username, kelas, role, dan capaian poin dikunci demi integritas data pembelajaran.
            </p>
          </div>
        </form>

        {/* Modal Actions Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end space-x-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-sm transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasChanges || !fullName.trim()}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
