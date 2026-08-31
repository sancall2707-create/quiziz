import { User, ClassGrade } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { generateClassId, formatClassDisplayName } from '../data/classData';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where
} from 'firebase/firestore';

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

export interface AuthSession {
  userId: string;
  token: string;
  loggedInAt: string;
}

export interface AuthRegistryEntry {
  passwordHash: string;
  nickname?: string;
  email?: string | null;
  username: string;
  mustChangePassword?: boolean;
}

const AUTH_SESSION_KEY = 'codenusa_auth_session_v1';
const AUTH_REGISTRY_KEY = 'codenusa_auth_registry_v1';

export const getInternalEmail = (username: string) => {
  return `${username.trim().toLowerCase()}@siswa.codenusa.internal`;
};

// Seeded account password hashes (SHA-256 salted)
const SEEDED_AUTH_ACCOUNTS: Record<string, AuthRegistryEntry> = {
  'user-admin-wijaya': {
    passwordHash: 'e6efd5794fd5d6e51d3234db930508ae3ba765395c6a7e7db9488716eb96fc29',
    email: 'wijaya.admin@codenusa.id',
    username: 'wijaya_admin',
    mustChangePassword: true
  },
  'user-teacher-wijaya': {
    passwordHash: 'c4a7334a81131b275695d182755117df156e00957f0b0f7627b180f9e9f3d350',
    email: 'wijaya.guru@codenusa.id',
    username: 'wijaya_guru',
    mustChangePassword: true
  }
};

const DEMO_USER_IDS = ['user-raka', 'user-alya', 'user-budi', 'user-teacher-ratna', 'user-admin-hendra'];

/**
 * Hash password securely using Web Crypto API SHA-256 with salt
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const salt = 'codenusa_sd_secure_salt_2026_!';
      const data = encoder.encode(password + salt);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('Crypto subtle digest fallback:', e);
  }
  
  let hash = 0;
  const str = password + 'codenusa_fallback_salt_2026';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(16) + '_' + btoa(password.slice(0, 4));
}

/**
 * Get the stored auth registry
 */
export function getAuthRegistry(): Record<string, AuthRegistryEntry> {
  try {
    const raw = localStorage.getItem(AUTH_REGISTRY_KEY);
    let parsed: Record<string, AuthRegistryEntry> = {};
    if (raw) {
      parsed = JSON.parse(raw);
    }
    
    let modified = false;
    DEMO_USER_IDS.forEach(demoId => {
      if (parsed[demoId]) {
        delete parsed[demoId];
        modified = true;
      }
    });

    Object.keys(SEEDED_AUTH_ACCOUNTS).forEach(accId => {
      if (!parsed[accId]) {
        parsed[accId] = { ...SEEDED_AUTH_ACCOUNTS[accId] };
        modified = true;
      }
    });

    if (modified || !raw) {
      localStorage.setItem(AUTH_REGISTRY_KEY, JSON.stringify(parsed));
    }

    return parsed;
  } catch {
    return { ...SEEDED_AUTH_ACCOUNTS };
  }
}

/**
 * Save credentials for a registered user locally and to auth registry
 */
export function saveAuthUser(
  userId: string,
  passwordHash: string,
  email: string | null | undefined,
  username: string,
  nickname?: string,
  mustChangePassword = false
): void {
  try {
    const registry = getAuthRegistry();
    registry[userId] = {
      passwordHash,
      nickname,
      email: email ? email.toLowerCase() : null,
      username: username.toLowerCase(),
      mustChangePassword
    };
    localStorage.setItem(AUTH_REGISTRY_KEY, JSON.stringify(registry));
  } catch (e) {
    console.warn('Failed to save auth user to registry:', e);
  }
}

/**
 * Update user password
 */
export async function changeUserPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; message?: string }> {
  if (!newPassword || newPassword.trim().length < 8) {
    return { success: false, message: 'Kata sandi baru minimal 8 karakter.' };
  }

  try {
    const newHash = await hashPassword(newPassword.trim());
    const registry = getAuthRegistry();
    if (registry[userId]) {
      registry[userId].passwordHash = newHash;
      registry[userId].mustChangePassword = false;
      localStorage.setItem(AUTH_REGISTRY_KEY, JSON.stringify(registry));
    }

    // Try updating password in Firestore if doc exists
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { passwordHash: newHash, mustChangePassword: false }, { merge: true });
    } catch {
      // Ignore if offline
    }

    return { success: true };
  } catch {
    return { success: false, message: 'Gagal memperbarui kata sandi. Silakan coba lagi.' };
  }
}

export function isPasswordChangeRequired(userId: string): boolean {
  const registry = getAuthRegistry();
  return Boolean(registry[userId]?.mustChangePassword);
}

export function getAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session && session.userId) {
      return session;
    }
    return null;
  } catch {
    return null;
  }
}

export function setAuthSession(userId: string): AuthSession {
  const session: AuthSession = {
    userId,
    token: 'tok_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now(),
    loggedInAt: new Date().toISOString()
  };
  try {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('Failed to save auth session:', e);
  }
  return session;
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
  } catch (e) {
    console.warn('Failed to remove auth session:', e);
  }
  try {
    firebaseSignOut(auth);
  } catch {
    // ignore
  }
}

/**
 * Register student using Firebase Auth + Firestore
 */
export async function registerStudentFirebase(
  data: RegisterStudentData,
  allUsers: User[]
): Promise<{ success: boolean; message?: string; user?: User }> {
  const cleanUsername = data.username.trim().toLowerCase();

  if (cleanUsername.length < 4) {
    return { success: false, message: 'Username minimal 4 karakter.' };
  }

  // 1. Check local & Firestore uniqueness
  const localExists = allUsers.some(u => u.username.toLowerCase() === cleanUsername);
  if (localExists) {
    return { success: false, message: 'Username sudah digunakan oleh akun lain.' };
  }

  try {
    const q = query(collection(db, 'users'), where('username', '==', cleanUsername));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { success: false, message: 'Username sudah digunakan oleh akun lain.' };
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'users');
  }

  const passwordHash = await hashPassword(data.password);
  const internalEmail = getInternalEmail(cleanUsername);

  // 2. Register in Firebase Auth
  let uid = `user-std-${Date.now()}`;
  try {
    const cred = await createUserWithEmailAndPassword(auth, internalEmail, data.password);
    if (cred.user) {
      uid = cred.user.uid;
    }
  } catch (err: any) {
    // If account exists in Firebase Auth, attempt sign in with password
    if (err.code === 'auth/email-already-in-use') {
      try {
        const signCred = await signInWithEmailAndPassword(auth, internalEmail, data.password);
        if (signCred.user) uid = signCred.user.uid;
      } catch {
        return { success: false, message: 'Username sudah terdaftar.' };
      }
    } else {
      console.warn('Firebase Auth create error (continuing with Firestore doc):', err);
    }
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
  const effectiveSection = (data.section ? data.section.trim().toUpperCase() : 'A');
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

  // 3. Save profile into Firestore `users/{uid}`
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      ...newStudent,
      passwordHash
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
  }

  // 4. Save local auth registry & session
  saveAuthUser(uid, passwordHash, null, cleanUsername, data.nickname.trim());
  setAuthSession(uid);

  return { success: true, user: newStudent };
}

/**
 * Validate credentials against Firebase Auth & Firestore
 */
export async function validateCredentials(
  identifier: string,
  passwordInput: string,
  allUsers: User[]
): Promise<{ valid: boolean; user?: User; mustChangePassword?: boolean; message?: string }> {
  const trimmedId = identifier.trim().toLowerCase();
  const trimmedPass = passwordInput.trim();

  if (!trimmedId) {
    return { valid: false, message: 'Username wajib diisi.' };
  }
  if (!trimmedPass) {
    return { valid: false, message: 'Kata sandi (password) wajib diisi.' };
  }

  // 1. Check in allUsers (synced from Firestore)
  let user = allUsers.find(
    u => u.username.toLowerCase() === trimmedId || (u.email && u.email.toLowerCase() === trimmedId)
  );

  // 2. If not found in current state, attempt query directly from Firestore
  if (!user) {
    try {
      const q = query(collection(db, 'users'), where('username', '==', trimmedId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        user = snap.docs[0].data() as User;
      } else if (trimmedId.includes('@')) {
        const qEmail = query(collection(db, 'users'), where('email', '==', trimmedId));
        const snapEmail = await getDocs(qEmail);
        if (!snapEmail.empty) {
          user = snapEmail.docs[0].data() as User;
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'users');
    }
  }

  if (!user) {
    return { valid: false, message: 'Akun dengan username/email tersebut tidak ditemukan.' };
  }

  // 3. Try Firebase Auth sign in
  const internalEmail = user.email || getInternalEmail(user.username);
  try {
    await signInWithEmailAndPassword(auth, internalEmail, trimmedPass);
    const mustChange = isPasswordChangeRequired(user.id);
    return {
      valid: true,
      user,
      mustChangePassword: mustChange
    };
  } catch {
    // If Firebase Auth fails (or offline), verify via hash comparison
    const registry = getAuthRegistry();
    const regEntry = registry[user.id];

    if (regEntry && regEntry.passwordHash) {
      const inputHash = await hashPassword(trimmedPass);
      if (inputHash === regEntry.passwordHash) {
        return {
          valid: true,
          user,
          mustChangePassword: Boolean(regEntry.mustChangePassword)
        };
      }
    }
  }

  return { valid: false, message: 'Kata sandi (password) yang kamu masukkan salah.' };
}
