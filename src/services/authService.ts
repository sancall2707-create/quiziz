import { User, ClassGrade } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { generateClassId, formatClassDisplayName } from '../data/classData';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export interface RegisterStudentData {
  name: string;
  nickname: string;
  username: string;
  grade: ClassGrade;
  gradeLevel?: ClassGrade;
  section?: string; // 'A' | 'B' | 'C'
  classId?: string; // 'cls-1a', 'cls-4b'
  password: string;
  email?: string | null;
}

/**
 * Deterministically derive an internal email from a username.
 * All CodeNusa accounts use this format so that the login page can construct
 * the email from the username alone — no Firestore lookup needed before auth.
 */
export const getInternalEmail = (username: string) => {
  return `${username.trim().toLowerCase()}@siswa.codenusa.internal`;
};

/**
 * Register a new student account using Firebase Auth + Firestore.
 * Firebase Auth handles credential verification — NO password hashes are stored
 * in Firestore, localStorage, sessionStorage, or source code.
 */
export async function registerStudentFirebase(
  data: RegisterStudentData,
  allUsers: User[]
): Promise<{ success: boolean; message?: string; user?: User }> {
  const cleanUsername = data.username.trim().toLowerCase();

  if (cleanUsername.length < 4) {
    return { success: false, message: 'Username minimal 4 karakter.' };
  }

  // 1. Check local uniqueness (Firestore query may be blocked by rules before auth,
  //    but Firebase Auth email uniqueness is the real guard).
  const localExists = allUsers.some(u => u.username.toLowerCase() === cleanUsername);
  if (localExists) {
    return { success: false, message: 'Username sudah digunakan oleh akun lain.' };
  }

  const internalEmail = getInternalEmail(cleanUsername);

  // 2. Create Firebase Auth account (Firebase enforces email uniqueness)
  let uid: string;
  try {
    const cred = await createUserWithEmailAndPassword(auth, internalEmail, data.password);
    uid = cred.user.uid;
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      return { success: false, message: 'Username sudah digunakan oleh akun lain.' };
    }
    if (err.code === 'auth/weak-password') {
      return { success: false, message: 'Kata sandi terlalu lemah. Minimal 8 karakter.' };
    }
    console.warn('[registerStudentFirebase] Auth error:', err.code || err.message);
    return { success: false, message: 'Pendaftaran gagal. Silakan coba lagi.' };
  }

  const avatars = [
    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA5-LBB1VegifWDRWAvniulyAt3Xc1t1oH6rYn0DwtraSPv3v4NDNq-efVEZkF1GbAcUq6B5bqe2aAX4yKL0vBPj2iNEB3CPkb4A_r73AQOv0Ja8KJx_GeRaS3CZgTE-t7Nl14OG0LxX2KC0BB0ZB7wEql2ZfFn0jPxWqWytNf4OQnGSav8fLQOx9duBdzEq4rHBKP4NNayW_Pfu6ZburdvcNXVrQi6RgBaISPA0VuCkdS8KWa5eR0h',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  ];
  const avatarIndex = (Number(data.grade) - 1 + avatars.length) % avatars.length;
  const todayStr = new Date().toISOString().split('T')[0];

  const effectiveGrade = (Number(data.gradeLevel || data.grade) || 4) as ClassGrade;
  const effectiveSection = data.section ? data.section.trim().toUpperCase() : 'A';
  const effectiveClassId = data.classId || generateClassId(effectiveGrade, effectiveSection);
  const effectiveClassName = formatClassDisplayName(effectiveGrade, effectiveSection);

  const newStudent: User = {
    id: uid,
    name: data.name.trim(),
    fullName: data.name.trim(),
    nickname: data.nickname.trim(),
    username: cleanUsername,
    role: 'student',
    avatar: avatars[avatarIndex],
    email: null,
    grade: effectiveGrade,
    gradeLevel: effectiveGrade,
    section: effectiveSection,
    classId: effectiveClassId,
    className: effectiveClassName,
    school: 'SD Harapan Nusantara',
    accountStatus: 'active',
    createdAt: new Date().toISOString(),
    xp: 0,
    level: 1,
    stars: 0,
    coins: 50,
    streakDays: 1,
    streakHistory: [todayStr],
    lastActive: 'Hari ini',
    lastActiveDate: todayStr,
    badges: ['badge-welcome'],
    completedMissions: [],
    rewardsClaimed: [],
    kobiPosition: 'node-1',
    missionScores: {},
    kobiCustomization: {
      skin: 'blue-classic',
      hat: 'none',
      accessory: 'none'
    },
    settings: {
      soundEnabled: true,
      narrationVoiceEnabled: true,
      reduceMotion: false,
      highContrast: false,
      dyslexicFont: false,
      fontSize: 'normal'
    }
  };

  // 3. Save profile into Firestore users/{uid}
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, newStudent);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
    return {
      success: false,
      message: 'Akun berhasil dibuat tetapi gagal menyimpan profil. Silakan hubungi admin untuk memeriksa data Anda.'
    };
  }

  return { success: true, user: newStudent };
}

/**
 * Sign in using username + password via Firebase Auth.
 * The username is converted to an internal email deterministically —
 * no Firestore read is needed before authentication.
 */
export async function signInWithIdentifier(
  identifier: string,
  password: string
): Promise<{ success: boolean; message?: string }> {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = password.trim();

  if (!cleanId) {
    return { success: false, message: 'Username wajib diisi.' };
  }
  if (!cleanPass) {
    return { success: false, message: 'Kata sandi (password) wajib diisi.' };
  }

  const email = getInternalEmail(cleanId);
  try {
    await signInWithEmailAndPassword(auth, email, cleanPass);
    return { success: true };
  } catch (err: any) {
    if (
      err.code === 'auth/invalid-credential' ||
      err.code === 'auth/wrong-password' ||
      err.code === 'auth/user-not-found'
    ) {
      return { success: false, message: 'Username atau kata sandi salah.' };
    }
    if (err.code === 'auth/too-many-requests') {
      return { success: false, message: 'Terlalu banyak percobaan. Coba lagi nanti.' };
    }
    if (err.code === 'auth/network-request-failed') {
      return { success: false, message: 'Koneksi bermasalah. Periksa internet Anda.' };
    }
    console.warn('[signInWithIdentifier] Auth error:', err.code || err.message);
    return { success: false, message: 'Gagal masuk. Silakan periksa koneksi internet dan coba lagi.' };
  }
}

/**
 * Change the current user's password via Firebase Auth.
 * No password hashes are stored — Firebase Auth manages credentials.
 */
export async function changeCurrentUserPassword(
  newPassword: string
): Promise<{ success: boolean; message?: string }> {
  if (!auth.currentUser) {
    return { success: false, message: 'Sesi tidak ditemukan. Silakan masuk kembali.' };
  }
  if (newPassword.trim().length < 8) {
    return { success: false, message: 'Kata sandi baru minimal 8 karakter.' };
  }

  try {
    await firebaseUpdatePassword(auth.currentUser, newPassword.trim());
    // Clear the mustChangePassword flag in Firestore (allowed by rules — user can set false only)
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, { mustChangePassword: false }, { merge: true });
    } catch {
      // Non-critical — the password was already changed in Firebase Auth
    }
    return { success: true };
  } catch (err: any) {
    if (err.code === 'auth/requires-recent-login') {
      return {
        success: false,
        message: 'Untuk keamanan, silakan keluar dan masuk kembali sebelum mengganti kata sandi.'
      };
    }
    return { success: false, message: 'Gagal memperbarui kata sandi. Silakan coba lagi.' };
  }
}

/**
 * Sign out the current user from Firebase Auth.
 */
export async function signOutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch {
    // ignore
  }
}
