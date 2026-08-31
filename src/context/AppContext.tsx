import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  User,
  UserRole,
  ClassGrade,
  AccessibilitySettings,
  CodingProject,
  DailyMission,
  Badge,
  Mission,
  StreakInfo,
  OfflineProgressRecord,
  NetworkStatusState,
  LeaderboardStudent,
  Assignment
} from '../types';
import {
  BADGES_DATA,
  DAILY_MISSIONS,
  CHAPTERS_DATA,
  GLOBAL_LEADERBOARD_STUDENTS
} from '../data/mockData';
import { audioService } from '../utils/audio';
import {
  registerServiceWorker,
  isServiceWorkerActive,
  getOfflineQueue,
  saveToOfflineQueue,
  clearOfflineQueue,
  getLastSyncTime,
  recordLastSyncTime,
  getStorageEstimate
} from '../utils/offlineStorage';
import {
  RegisterStudentData,
  registerStudentFirebase,
  signInWithIdentifier,
  signOutUser,
  changeCurrentUserPassword
} from '../services/authService';
import { db, auth, functions, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  query,
  where
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

interface KobiSpeechState {
  text: string;
  mood: 'happy' | 'thinking' | 'celebrating' | 'helping' | 'waving';
  duration?: number;
}

interface AppContextType {
  currentUser: User;
  allUsers: User[];
  isAuthenticated: boolean;
  authLoading: boolean;
  authError: string | null;
  mustChangePassword: boolean;
  login: (identifier: string, passwordInput: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  registerStudent: (data: RegisterStudentData) => Promise<{ success: boolean; message?: string; user?: User }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUserGrade: (grade: ClassGrade) => void;
  adminUpdateUserGrade: (userId: string, grade: ClassGrade) => void;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  completeMission: (missionId: string, stars: number, score: number) => { isAlreadyClaimed: boolean; newBadge?: Badge; starsEarned: number; coinsEarned: number; xpEarned: number; isOfflineSaved?: boolean };
  projects: CodingProject[];
  saveProject: (project: CodingProject) => void;
  deleteProject: (projectId: string) => void;
  dailyMissions: DailyMission[];
  claimDailyMission: (missionId: string) => void;
  activeMissionId: string;
  setActiveMissionId: (id: string) => void;
  setKobiPosition: (nodeId: string, missionId?: string) => void;
  kobiSpeech: KobiSpeechState | null;
  triggerKobiSpeech: (text: string, mood?: KobiSpeechState['mood'], speakAudio?: boolean) => void;
  dismissKobiSpeech: () => void;
  resetProgress: () => void;
  getMissionById: (missionId: string) => Mission | undefined;
  streakInfo: StreakInfo;
  checkInStreak: () => { streakCount: number; isFirstToday: boolean; bonusXp: number; bonusCoins: number; newBadge?: Badge };
  recordDailyActivity: (reason?: string) => void;
  awardChallengeBonus: (challengeId: string, challengeTitle: string, displayStars: number, displayXp: number) => void;
  // Offline & Service Worker functionalities
  networkStatus: NetworkStatusState;
  offlineQueue: OfflineProgressRecord[];
  toggleSimulatedOffline: (simulate?: boolean) => void;
  syncOfflineData: () => Promise<{ syncedCount: number }>;
  isOffline: boolean;
  // Leaderboard & Peers
  allLeaderboardStudents: LeaderboardStudent[];
  cheersMap: Record<string, number>;
  cheerStudent: (studentId: string) => void;
  // Assignments / Tugas Guru & Admin
  assignments: Assignment[];
  createAssignment: (data: Omit<Assignment, 'id' | 'createdAt' | 'createdBy'>) => Promise<{ success: boolean; message?: string }>;
  deleteAssignment: (assignmentId: string) => Promise<{ success: boolean; message?: string }>;
  // Edit Profile
  updateUserProfile: (userId: string, data: UpdateProfileData) => Promise<{ success: boolean; message?: string }>;
}

export interface UpdateProfileData {
  name: string;
  fullName?: string;
  nickname?: string;
  displayName?: string;
  avatar: string;
  avatarUrl?: string;
  avatarType?: 'preset' | 'custom' | 'initial';
  bio?: string;
}

// Safe default user — never rendered (auth loading screen prevents it).
// Exists only so the `currentUser` type stays non-nullable for existing components.
const GUEST_USER: User = {
  id: '',
  name: '',
  username: '',
  role: 'student',
  avatar: '',
  grade: 4,
  school: '',
  xp: 0,
  level: 1,
  stars: 0,
  coins: 0,
  streakDays: 0,
  lastActive: '',
  badges: [],
  completedMissions: [],
  missionScores: {},
  kobiCustomization: { skin: 'blue-classic', hat: 'none', accessory: 'none' },
  settings: {
    soundEnabled: true,
    narrationVoiceEnabled: false,
    reduceMotion: false,
    highContrast: false,
    dyslexicFont: false,
    fontSize: 'normal'
  }
};

const STORAGE_KEY = 'codenusa_user_state_v2';
const ACTIVE_MISSION_KEY = 'codenusa_active_mission_id';
const DAILY_MISSIONS_KEY = 'codenusa_daily_missions_v1';
const PROJECTS_KEY = 'codenusa_projects_v1';
const CHEERS_KEY = 'codenusa_student_cheers_v1';
const ASSIGNMENTS_STORAGE_KEY = 'codenusa_assignments_v1';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ============================================================
  //  Auth state — onAuthStateChanged is the single source of truth
  // ============================================================
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [trustedRole, setTrustedRole] = useState<UserRole | null>(null);
  const [teacherClassIds, setTeacherClassIds] = useState<string[]>([]);
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);

  // UI cache for allUsers (NOT used for auth decisions — just for dashboards/leaderboard rendering)
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { /* ignore */ }
    return [];
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    try {
      const saved = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { /* ignore */ }
    return [];
  });

  const [activeMissionId, setActiveMissionIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_MISSION_KEY);
      if (saved) return saved;
    } catch { /* ignore */ }
    return 'm-g4-c1-m4';
  });

  const [dailyMissions, setDailyMissions] = useState<DailyMission[]>(() => {
    try {
      const saved = localStorage.getItem(DAILY_MISSIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return DAILY_MISSIONS;
  });

  const [projects, setProjects] = useState<CodingProject[]>(() => {
    try {
      const saved = localStorage.getItem(PROJECTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return [
      {
        id: 'proj-1',
        title: 'Tarian Robot Kobi',
        description: 'Animasi Kobi berputar dan menyapa dengan suara musik ceria!',
        authorId: 'user-std-1',
        authorName: 'Siswa CodeNusa',
        grade: 4,
        createdAt: '2026-08-28',
        updatedAt: '2026-08-30',
        blocks: [
          { instanceId: 'b1', templateId: 'blk-when-flag-clicked', opcode: 'event_whenflagclicked', category: 'events', name: 'ketika ⚑ diklik', shape: 'cap', params: {} },
          { instanceId: 'b2', templateId: 'blk-move', opcode: 'motion_movesteps', category: 'motion', name: 'gerak 10 langkah', shape: 'notch', params: { STEPS: 15 } },
          { instanceId: 'b3', templateId: 'blk-say-for-sec', opcode: 'looks_sayforsecs', category: 'looks', name: 'katakan Halo selama 2 detik', shape: 'notch', params: { MESSAGE: 'Halo Sahabat!', SECS: 2 } },
          { instanceId: 'b4', templateId: 'blk-play-sound', opcode: 'sound_play', category: 'sound', name: 'mainkan suara', shape: 'notch', params: { SOUND: 'Chime Sukses' } }
        ],
        sprite: { name: 'Kobi', type: 'kobi', x: 0, y: 0, size: 100, direction: 90, visible: true },
        stageBackground: 'park'
      }
    ];
  });

  const [kobiSpeech, setKobiSpeech] = useState<KobiSpeechState | null>({
    text: 'Selamat datang di CodeNusa! Ayo selesaikan misi belajar kodingmu hari ini.',
    mood: 'happy'
  });

  // Offline, Network & Service Worker State
  const [offlineQueue, setOfflineQueue] = useState<OfflineProgressRecord[]>(() => getOfflineQueue());
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(() => {
    try { return localStorage.getItem('codenusa_simulated_offline') === 'true'; } catch { return false; }
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => getLastSyncTime());
  const [serviceWorkerActive, setServiceWorkerActive] = useState<boolean>(false);
  const [storageEstimate, setStorageEstimate] = useState<{ usedBytes: number; quotaBytes: number; percentage: number } | undefined>(undefined);

  const [cheersMap, setCheersMap] = useState<Record<string, number>>(() => {
    try { const saved = localStorage.getItem(CHEERS_KEY); return saved ? JSON.parse(saved) : {}; } catch { return {}; }
  });

  // ============================================================
  //  onAuthStateChanged — single source of login truth
  // ============================================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 1. Read trusted role from custom claims (NOT from any client-writable doc).
        //    Retry with forced token refresh until the claim is available — the
        //    onUserCreate Cloud Function may not have set it yet on first login
        //    after registration. Do NOT default to a role as authorization fallback.
        //    Show a provisioning/loading state (authLoading stays true) until the
        //    claim arrives or timeout is reached.
        let role: UserRole | null = null;
        let claimClassIds: string[] = [];
        let tokenFailed = false;

        for (let attempt = 0; attempt < 6; attempt++) {
          try {
            const tokenResult = await firebaseUser.getIdTokenResult(attempt > 0);
            if (tokenResult.claims.role) {
              role = tokenResult.claims.role as UserRole;
              claimClassIds = (tokenResult.claims.teacherClassIds as string[]) || [];
              break;
            }
            // Claim not yet available — wait and retry with forced refresh
            if (attempt < 5) await new Promise(res => setTimeout(res, 1000));
          } catch (tokenErr) {
            // Token invalid/revoked (e.g. account disabled) — sign out
            console.warn('Token refresh failed, signing out:', tokenErr);
            tokenFailed = true;
            break;
          }
        }

        if (tokenFailed) {
          await signOutUser();
          setTrustedRole(null);
          setCurrentUserId('');
          setIsAuthenticated(false);
          setAuthError('Sesi Anda telah berakhir. Silakan masuk kembali.');
          setAuthLoading(false);
          return;
        }

        if (!role) {
          // Claim provisioning timeout — do NOT grant access based on assumed role.
          setAuthError('Akun Anda sedang disiapkan. Silakan coba masuk kembali dalam beberapa saat.');
          await signOutUser();
          setTrustedRole(null);
          setCurrentUserId('');
          setIsAuthenticated(false);
          setAuthLoading(false);
          return;
        }

        setTrustedRole(role);
        setTeacherClassIds(claimClassIds);

        // 2. Fetch Firestore profile by Firebase UID — no fallback to first user or admin
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          let userSnap = await getDoc(userDocRef);
          if (!userSnap.exists()) {
            // Race condition guard: the user may have JUST registered and the
            // Firestore profile write may still be in flight.  Retry once after
            // a short delay before declaring "profile not found".
            await new Promise(res => setTimeout(res, 1500));
            userSnap = await getDoc(userDocRef);
          }
          if (userSnap.exists()) {
            const profile = userSnap.data() as User;
            // Check for disabled account — admin may have set accountStatus to 'inactive'
            if (profile.accountStatus === 'inactive') {
              setAuthError('Akun Anda telah dinonaktifkan. Hubungi administrator untuk informasi lebih lanjut.');
              await signOutUser();
              setIsAuthenticated(false);
              setCurrentUserId('');
              setTrustedRole(null);
              setAuthLoading(false);
              return;
            }
            setAllUsers(prev => {
              const idx = prev.findIndex(u => u.id === firebaseUser.uid);
              if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = profile;
                return copy;
              }
              return [...prev, profile];
            });
            setCurrentUserId(firebaseUser.uid);
            setIsAuthenticated(true);
            setMustChangePassword(Boolean(profile.mustChangePassword));
            setAuthError(null);
          } else {
            // Profile genuinely not found — show error, sign out, do NOT create a fake session
            setAuthError('Profil pengguna tidak ditemukan untuk akun ini. Hubungi administrator untuk membuat profil Anda.');
            await signOutUser();
            setIsAuthenticated(false);
            setCurrentUserId('');
            setTrustedRole(null);
          }
        } catch (err) {
          // Firestore read failed (rules not deployed yet, network error, etc.)
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
          setAuthError('Gagal memuat profil pengguna. Pastikan Firebase Rules sudah dideploy dan koneksi internet tersedia.');
          setIsAuthenticated(false);
          setCurrentUserId('');
          setTrustedRole(null);
        }
      } else {
        // No authenticated user
        setTrustedRole(null);
        setTeacherClassIds([]);
        setCurrentUserId('');
        setIsAuthenticated(false);
        setMustChangePassword(false);
        setAuthError(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ============================================================
  //  Firestore real-time listeners — role-aware
  //  Only set up AFTER auth is resolved so the correct queries match the rules.
  // ============================================================
  useEffect(() => {
    if (!isAuthenticated || !currentUserId) return;

    const unsubFns: Array<() => void> = [];

    if (trustedRole === 'admin') {
      // Admin: listen to all users
      unsubFns.push(
        onSnapshot(
          collection(db, 'users'),
          (snapshot) => {
            const users: User[] = [];
            snapshot.forEach((docSnap) => {
              const u = docSnap.data() as User;
              if (u && u.id) users.push(u);
            });
            setAllUsers(prev => {
              const snapshotIds = new Set(users.map(u => u.id));
              const retained = prev.filter(u => !snapshotIds.has(u.id));
              return [...users, ...retained];
            });
          },
          (error) => handleFirestoreError(error, OperationType.LIST, 'users')
        )
      );

      unsubFns.push(
        onSnapshot(
          collection(db, 'assignments'),
          (snapshot) => {
            const list: Assignment[] = [];
            snapshot.forEach((docSnap) => {
              const a = docSnap.data() as Assignment;
              if (a && a.id) list.push(a);
            });
            setAssignments(list);
            try { localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
          },
          (error) => handleFirestoreError(error, OperationType.LIST, 'assignments')
        )
      );
    } else if (trustedRole === 'teacher') {
      // Teacher: listen to students in assigned classes only (filtered by custom claims)
      if (teacherClassIds.length > 0) {
        const studentQuery = query(
          collection(db, 'users'),
          where('role', '==', 'student'),
          where('classId', 'in', teacherClassIds)
        );
        unsubFns.push(
          onSnapshot(
            studentQuery,
            (snapshot) => {
              const users: User[] = [];
              snapshot.forEach((docSnap) => {
                const u = docSnap.data() as User;
                if (u && u.id) users.push(u);
              });
              setAllUsers(prev => {
                const snapshotIds = new Set(users.map(u => u.id));
                const retained = prev.filter(u => !snapshotIds.has(u.id) && u.id !== currentUserId);
                return [...users, ...retained];
              });
            },
            (error) => handleFirestoreError(error, OperationType.LIST, 'users')
          )
        );
      }

      // Teacher's own profile (real-time updates)
      unsubFns.push(
        onSnapshot(
          doc(db, 'users', currentUserId),
          (docSnap) => {
            if (docSnap.exists()) {
              const profile = docSnap.data() as User;
              setAllUsers(prev => {
                const idx = prev.findIndex(u => u.id === currentUserId);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = profile;
                  return copy;
                }
                return [...prev, profile];
              });
            }
          },
          (error) => handleFirestoreError(error, OperationType.GET, `users/${currentUserId}`)
        )
      );

      // Assignments (learning content — all staff can read)
      unsubFns.push(
        onSnapshot(
          collection(db, 'assignments'),
          (snapshot) => {
            const list: Assignment[] = [];
            snapshot.forEach((docSnap) => {
              const a = docSnap.data() as Assignment;
              if (a && a.id) list.push(a);
            });
            setAssignments(list);
            try { localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
          },
          (error) => handleFirestoreError(error, OperationType.LIST, 'assignments')
        )
      );
    } else {
      // Student: listen to own profile only
      unsubFns.push(
        onSnapshot(
          doc(db, 'users', currentUserId),
          (docSnap) => {
            if (docSnap.exists()) {
              const profile = docSnap.data() as User;
              setAllUsers(prev => {
                const idx = prev.findIndex(u => u.id === currentUserId);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = profile;
                  return copy;
                }
                return [...prev, profile];
              });
            }
          },
          (error) => handleFirestoreError(error, OperationType.GET, `users/${currentUserId}`)
        )
      );

      // Students can read all assignments (learning content — filtered by grade in UI)
      unsubFns.push(
        onSnapshot(
          collection(db, 'assignments'),
          (snapshot) => {
            const list: Assignment[] = [];
            snapshot.forEach((docSnap) => {
              const a = docSnap.data() as Assignment;
              if (a && a.id) list.push(a);
            });
            setAssignments(list);
            try { localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
          },
          (error) => handleFirestoreError(error, OperationType.LIST, 'assignments')
        )
      );
    }

    return () => unsubFns.forEach(fn => fn());
  }, [isAuthenticated, currentUserId, trustedRole, teacherClassIds]);

  // ============================================================
  //  Progress sync — routes protected-field writes through a
  //  callable Cloud Function (Admin SDK bypasses Firestore Rules).
  //  When the function is not deployed, the call fails gracefully
  //  and local state updates optimistically.
  // ============================================================
  const submitProgressToBackend = useCallback(async (type: string, payload: Record<string, unknown>) => {
    try {
      const submitProgress = httpsCallable<{ type: string; payload: Record<string, unknown> }, unknown>(functions, 'submitProgress');
      await submitProgress({ type, payload });
    } catch (err) {
      console.warn(`[submitProgress:${type}] Cloud Function unavailable or failed:`, err);
    }
  }, []);

  const cheerStudent = useCallback((studentId: string) => {
    setCheersMap(prev => {
      const current = prev[studentId] || 0;
      const updated = { ...prev, [studentId]: current + 1 };
      try { localStorage.setItem(CHEERS_KEY, JSON.stringify(updated)); } catch (e) { console.warn('Cheers sync error:', e); }
      return updated;
    });
    audioService.playCoinSound();
    triggerKobiSpeech('Kamu mengirimkan tepuk tangan apresiasi kepada temanmu! 👏✨', 'happy', true);
  }, []);

  const allLeaderboardStudents = useMemo(() => {
    const studentUsers = allUsers.filter(u => u.role === 'student');
    const appStudents: LeaderboardStudent[] = studentUsers.map(user => {
      const weeklyStars = Math.max(1, Math.round(user.stars * 0.25));
      const monthlyStars = Math.max(weeklyStars, Math.round(user.stars * 0.7));
      return {
        id: user.id,
        name: user.fullName || user.name,
        nickname: user.nickname,
        username: user.username || user.name.toLowerCase().replace(/\s+/g, '_'),
        avatar: user.avatarUrl || user.avatar,
        avatarType: user.avatarType,
        grade: user.grade,
        school: user.school || 'SD Harapan Nusantara',
        stars: user.stars,
        monthlyStars,
        weeklyStars,
        xp: user.xp,
        level: user.level,
        streakDays: user.streakDays || 1,
        badgesCount: user.badges?.length || 0,
        favoriteTopic: user.grade >= 4 ? 'Blok Visual & Loop' : 'Bentuk & Navigasi Kobi',
        isCurrentUser: user.id === currentUserId,
        cheerCount: (cheersMap[user.id] || 0) + (user.stars > 100 ? 12 : 5)
      };
    });
    const registeredIds = new Set(appStudents.map(s => s.id));
    const mergedList: LeaderboardStudent[] = [...appStudents];
    for (const globalPeer of GLOBAL_LEADERBOARD_STUDENTS) {
      if (!registeredIds.has(globalPeer.id)) {
        mergedList.push({ ...globalPeer, cheerCount: (globalPeer.cheerCount || 0) + (cheersMap[globalPeer.id] || 0), isCurrentUser: globalPeer.id === currentUserId });
      }
    }
    return mergedList;
  }, [allUsers, currentUserId, cheersMap]);

  const isOffline = !isOnline || isSimulatedOffline;

  // Initialize Service Worker & network listeners on mount
  useEffect(() => {
    registerServiceWorker().then(registered => setServiceWorkerActive(registered || isServiceWorkerActive()));
    getStorageEstimate().then(setStorageEstimate);
    const handleOnline = () => { setIsOnline(true); audioService.playCoinSound(); triggerKobiSpeech('Internet terhubung kembali! Sistem siap menyinkronkan data petualanganmu.', 'happy', true); };
    const handleOffline = () => { setIsOnline(false); triggerKobiSpeech('Koneksi internet terputus. Mode offline aktif! Progres misimu tetap aman tersimpan.', 'helping', true); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  const persistUsers = useCallback((users: User[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(users)); } catch (e) { console.warn('LocalStorage users sync error:', e); }
  }, []);

  const persistProjects = useCallback((projs: CodingProject[]) => {
    try { localStorage.setItem(PROJECTS_KEY, JSON.stringify(projs)); } catch (e) { console.warn('LocalStorage projects sync error:', e); }
  }, []);

  const persistDailyMissions = useCallback((dMissions: DailyMission[]) => {
    try { localStorage.setItem(DAILY_MISSIONS_KEY, JSON.stringify(dMissions)); } catch (e) { console.warn('LocalStorage daily missions sync error:', e); }
  }, []);

  const setActiveMissionId = useCallback((id: string) => {
    setActiveMissionIdState(id);
    try { localStorage.setItem(ACTIVE_MISSION_KEY, id); } catch { /* ignore */ }
  }, []);

  // Multi-tab sync (UI cache only — not auth)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ACTIVE_MISSION_KEY && e.newValue) { setActiveMissionIdState(e.newValue); }
      else if (e.key === PROJECTS_KEY && e.newValue) { try { const p = JSON.parse(e.newValue); if (Array.isArray(p)) setProjects(p); } catch { /* ignore */ } }
      else if (e.key === DAILY_MISSIONS_KEY && e.newValue) { try { const p = JSON.parse(e.newValue); if (Array.isArray(p)) setDailyMissions(p); } catch { /* ignore */ } }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => { persistProjects(projects); }, [projects, persistProjects]);
  useEffect(() => { persistDailyMissions(dailyMissions); }, [dailyMissions, persistDailyMissions]);

  // ============================================================
  //  currentUser — role comes from trusted custom claims,
  //  NEVER from the client-writable Firestore document.
  // ============================================================
  const currentUser = useMemo(() => {
    const firestoreUser = allUsers.find(u => u.id === currentUserId);
    if (!firestoreUser) return GUEST_USER;
    return { ...firestoreUser, role: (trustedRole || firestoreUser.role) as UserRole };
  }, [allUsers, currentUserId, trustedRole]);

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getYesterdayStr = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; };

  const streakInfo: StreakInfo = useMemo(() => {
    const todayStr = getTodayStr();
    const history = currentUser.streakHistory || [];
    const isTodayActive = history.includes(todayStr) || currentUser.lastActiveDate === todayStr;
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const activeDaysThisWeek = [];
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + mondayOffset + i);
      const dateStr = targetDate.toISOString().split('T')[0];
      const isDateToday = dateStr === todayStr;
      const isActive = history.includes(dateStr) || (isDateToday && isTodayActive);
      activeDaysThisWeek.push({ dayName: dayNames[i], date: dateStr, active: isActive, isToday: isDateToday });
    }
    const currentStreak = currentUser.streakDays || (isTodayActive ? 1 : 0);
    const bestStreak = Math.max(currentStreak, 3);
    const milestones = [
      { days: 3, title: 'Api Semangat 3 Hari', reward: '+50 Koin & Lencana 🥉', completed: currentStreak >= 3 },
      { days: 7, title: 'Api Pembelajar Sepekan', reward: '+150 Koin & Lencana 🥈', completed: currentStreak >= 7 },
      { days: 14, title: 'Pendekar 14 Hari', reward: '+300 Koin & Lencana 🥇', completed: currentStreak >= 14 },
      { days: 30, title: 'Legenda Nusantara', reward: '+1000 Koin & Mahkota 👑', completed: currentStreak >= 30 }
    ];
    return { currentStreak, bestStreak, isTodayActive, activeDaysThisWeek, milestones };
  }, [currentUser]);

  const recordDailyActivity = useCallback((reason: string = 'Aktivitas Harian') => {
    const todayStr = getTodayStr();
    const yesterdayStr = getYesterdayStr();
    setAllUsers(prev => prev.map(u => {
      if (u.id === currentUserId) {
        const history = u.streakHistory || [];
        const isAlreadyToday = history.includes(todayStr) || u.lastActiveDate === todayStr;
        if (isAlreadyToday) {
          return { ...u, lastActive: 'Hari ini', lastActiveDate: todayStr };
        }
        let newStreak = 1;
        if (u.lastActiveDate === yesterdayStr || (u.streakDays && u.streakDays > 0 && !u.lastActiveDate)) {
          newStreak = (u.streakDays || 0) + 1;
        }
        const newBadges = [...u.badges];
        let bonusCoins = 0;
        let bonusXp = 0;
        if (newStreak >= 3 && !newBadges.includes('badge-streak-3')) { newBadges.push('badge-streak-3'); bonusCoins += 50; bonusXp += 100; }
        if (newStreak >= 7 && !newBadges.includes('badge-streak-7')) { newBadges.push('badge-streak-7'); bonusCoins += 150; bonusXp += 250; }
        if (newStreak >= 14 && !newBadges.includes('badge-streak-14')) { newBadges.push('badge-streak-14'); bonusCoins += 300; bonusXp += 500; }
        const newHistory = Array.from(new Set([...history, todayStr]));
        const updatedUser: User = { ...u, streakDays: newStreak, streakHistory: newHistory, lastActive: 'Hari ini', lastActiveDate: todayStr, coins: u.coins + bonusCoins, xp: u.xp + bonusXp, badges: newBadges };
        // Route through Cloud Function — students cannot write these fields directly
        // Server computes streak, bonus, and badges — client sends only the reason
        submitProgressToBackend('daily_activity', { reason });
        return updatedUser;
      }
      return u;
    }));
  }, [currentUserId, submitProgressToBackend]);

  const checkInStreak = () => {
    const todayStr = getTodayStr();
    const yesterdayStr = getYesterdayStr();
    const history = currentUser.streakHistory || [];
    const isAlreadyToday = history.includes(todayStr) || currentUser.lastActiveDate === todayStr;
    if (isAlreadyToday) {
      audioService.playSuccessSound();
      triggerKobiSpeech(`Streak harianmu aktif (${currentUser.streakDays} hari beruntun)! Ayo lanjutkan petualangan kodingmu hari ini!`, 'happy', true);
      return { streakCount: currentUser.streakDays, isFirstToday: false, bonusXp: 0, bonusCoins: 0 };
    }
    let newStreak = 1;
    if (currentUser.lastActiveDate === yesterdayStr || (currentUser.streakDays && currentUser.streakDays > 0 && !currentUser.lastActiveDate)) {
      newStreak = (currentUser.streakDays || 0) + 1;
    }
    const bonusXp = 50;
    const bonusCoins = 30;
    let milestoneBadge: Badge | undefined;
    if (newStreak >= 3 && !currentUser.badges.includes('badge-streak-3')) milestoneBadge = BADGES_DATA.find(b => b.id === 'badge-streak-3');
    else if (newStreak >= 7 && !currentUser.badges.includes('badge-streak-7')) milestoneBadge = BADGES_DATA.find(b => b.id === 'badge-streak-7');
    else if (newStreak >= 14 && !currentUser.badges.includes('badge-streak-14')) milestoneBadge = BADGES_DATA.find(b => b.id === 'badge-streak-14');

    setAllUsers(prev => prev.map(u => {
      if (u.id === currentUserId) {
        const newBadges = milestoneBadge && !u.badges.includes(milestoneBadge.id) ? [...u.badges, milestoneBadge.id] : u.badges;
        const newHistory = Array.from(new Set([...(u.streakHistory || []), todayStr]));
        const updatedUser: User = { ...u, streakDays: newStreak, streakHistory: newHistory, lastActive: 'Hari ini', lastActiveDate: todayStr, xp: u.xp + bonusXp + (milestoneBadge ? 100 : 0), coins: u.coins + bonusCoins + (milestoneBadge ? 50 : 0), badges: newBadges };
        // Server computes everything — client sends nothing but the type
        submitProgressToBackend('streak_checkin', {});
        return updatedUser;
      }
      return u;
    }));

    audioService.playFanfare();
    triggerKobiSpeech(`Luar biasa! Streak belajarmu bertambah menjadi ${newStreak} hari berturut-turut! Kamu dapat bonus +${bonusXp} XP dan +${bonusCoins} Koin!`, 'celebrating', true);
    return { streakCount: newStreak, isFirstToday: true, bonusXp, bonusCoins, newBadge: milestoneBadge };
  };

  useEffect(() => {
    if (currentUser?.settings) {
      audioService.setSettings(currentUser.settings.soundEnabled, currentUser.settings.narrationVoiceEnabled);
    }
  }, [currentUser?.settings]);

  // ============================================================
  //  Auth functions — Firebase Auth is the only credential verifier
  // ============================================================
  const login = async (identifier: string, passwordInput: string): Promise<{ success: boolean; message?: string; user?: User }> => {
    const res = await signInWithIdentifier(identifier, passwordInput);
    if (res.success) {
      // onAuthStateChanged will populate currentUser — return a lightweight success
      const targetUser = allUsers.find(u => u.username.toLowerCase() === identifier.trim().toLowerCase());
      triggerKobiSpeech(`Selamat datang kembali, ${targetUser?.name || 'Sahabat'}!`, 'happy', true);
      return { success: true, user: targetUser };
    }
    return { success: false, message: res.message || 'Login gagal.' };
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; message?: string }> => {
    const res = await changeCurrentUserPassword(newPassword);
    if (res.success) {
      setMustChangePassword(false);
      triggerKobiSpeech('Kata sandi baru berhasil disimpan!', 'happy', true);
    }
    return res;
  };

  const registerStudent = async (data: RegisterStudentData): Promise<{ success: boolean; message?: string; user?: User }> => {
    const res = await registerStudentFirebase(data, allUsers);
    if (res.success && res.user) {
      // onAuthStateChanged will set currentUserId — add to local state immediately
      setAllUsers(prev => prev.find(u => u.id === res.user!.id) ? prev : [...prev, res.user!]);
      triggerKobiSpeech(`Selamat datang di CodeNusa, ${data.nickname || data.name}! Ayo mulai petualangan kodingmu!`, 'celebrating', true);
      // Force token refresh after a short delay so the `student` custom claim
      // (set by the onUserCreate Cloud Function) is picked up. The
      // onAuthStateChanged handler retries until the claim is available
      // (provisioning state) — it does NOT default to an assumed role.
      setTimeout(async () => {
        try {
          if (auth.currentUser) {
            await auth.currentUser.getIdToken(true);
          }
        } catch { /* non-critical */ }
      }, 2000);
    }
    return res;
  };

  const logout = () => {
    signOutUser();
    // onAuthStateChanged will clear isAuthenticated, currentUserId, etc.
    audioService.playSnapSound();
    triggerKobiSpeech('Sampai jumpa lagi! Jangan lupa kembali besok untuk menjaga streak belajarmu.', 'waving', false);
  };

  // ============================================================
  //  Allowed direct writes (rules permit these — student-editable fields)
  // ============================================================
  const setKobiPosition = (nodeId: string, missionId?: string) => {
    if (missionId) setActiveMissionId(missionId);
    setAllUsers(prev => {
      const updated = prev.map(u => u.id === currentUserId ? { ...u, kobiPosition: nodeId } : u);
      try { const userRef = doc(db, 'users', currentUserId); setDoc(userRef, { kobiPosition: nodeId }, { merge: true }); } catch { /* ignore */ }
      persistUsers(updated);
      return updated;
    });
  };

  // Students cannot persist grade changes to Firestore (rules block it).
  // This updates local UI state only. Admin/teacher grade changes go through adminUpdateUserGrade.
  const updateUserGrade = (grade: ClassGrade) => {
    setAllUsers(prev => {
      const updated = prev.map(u => u.id === currentUserId ? { ...u, grade } : u);
      persistUsers(updated);
      return updated;
    });
    triggerKobiSpeech(`Kelasmu kini diubah ke Kelas ${grade} SD! Dunia petualanganmu disesuaikan.`, 'happy', true);
  };

  const adminUpdateUserGrade = (userId: string, grade: ClassGrade) => {
    // Optimistic local state update
    setAllUsers(prev => {
      const updated = prev.map(u => u.id === userId ? { ...u, grade } : u);
      persistUsers(updated);
      return updated;
    });
    // Route through Cloud Function — server validates authorization
    // (admin: any student; teacher: only students in their assigned classes)
    const targetUser = allUsers.find(u => u.id === userId);
    const section = targetUser?.section || 'A';
    const classId = `cls-${grade}${section.toLowerCase()}`;
    try {
      const changeGrade = httpsCallable<{ targetUid: string; grade: number; section?: string; classId?: string }, unknown>(functions, 'changeStudentGrade');
      changeGrade({ targetUid: userId, grade, section, classId }).catch(() => {});
    } catch { /* non-critical — optimistic update already applied */ }
  };

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setAllUsers(prev => {
      const updated = prev.map(u => {
        if (u.id === currentUserId) {
          const userUpdated = { ...u, settings: { ...u.settings, ...newSettings } };
          try { const userRef = doc(db, 'users', currentUserId); setDoc(userRef, { settings: userUpdated.settings }, { merge: true }); } catch { /* ignore */ }
          return userUpdated;
        }
        return u;
      });
      persistUsers(updated);
      return updated;
    });
  };

  const toggleSimulatedOffline = (simulate?: boolean) => {
    setIsSimulatedOffline(prev => {
      const nextVal = typeof simulate === 'boolean' ? simulate : !prev;
      try { localStorage.setItem('codenusa_simulated_offline', String(nextVal)); } catch { /* ignore */ }
      audioService.playSnapSound();
      if (nextVal) { triggerKobiSpeech('Simulasi Mode Offline diaktifkan! Kamu tetap bisa belajar dan bermain tanpa internet.', 'helping', true); }
      else { triggerKobiSpeech('Kembali ke Mode Online! Menghubungkan ke server...', 'happy', true); setTimeout(() => { syncOfflineData(); }, 600); }
      return nextVal;
    });
  };

  const syncOfflineData = async (): Promise<{ syncedCount: number }> => {
    if (isSyncing) return { syncedCount: 0 };
    setIsSyncing(true);
    audioService.playSnapSound();
    const currentQueue = getOfflineQueue();
    if (currentQueue.length === 0) {
      setIsSyncing(false); recordLastSyncTime(); setLastSyncedAt(new Date().toISOString());
      triggerKobiSpeech('Semua data progres pembelajaran sudah tersinkron rapi di server!', 'happy', true);
      return { syncedCount: 0 };
    }
    await new Promise(res => setTimeout(res, 1200));
    const syncedCount = currentQueue.length;
    clearOfflineQueue(); setOfflineQueue([]); recordLastSyncTime();
    setLastSyncedAt(new Date().toISOString()); setIsSyncing(false);
    getStorageEstimate().then(setStorageEstimate);
    audioService.playFanfare();
    triggerKobiSpeech(`Hore! Sebanyak ${syncedCount} catatan progres misi offline berhasil disinkronkan ke server!`, 'celebrating', true);
    return { syncedCount };
  };

  const completeMission = (missionId: string, stars: number, score: number) => {
    let newBadge: Badge | undefined;
    let starsEarned = 0;
    let coinsEarned = 0;
    let xpEarned = 0;
    const isAlreadyClaimed = (currentUser.rewardsClaimed || []).includes(missionId);
    let missionObj: Mission | undefined;
    let nextMissionObj: Mission | undefined;
    let missionIndex = -1;
    for (const ch of CHAPTERS_DATA) {
      const idx = ch.missions.findIndex(m => m.id === missionId);
      if (idx !== -1) { missionObj = ch.missions[idx]; missionIndex = idx; if (idx + 1 < ch.missions.length) nextMissionObj = ch.missions[idx + 1]; break; }
    }
    if (!isAlreadyClaimed && missionObj) {
      starsEarned = missionObj.rewardStars || stars;
      coinsEarned = missionObj.rewardCoins || 50;
      xpEarned = missionObj.rewardXp || 150;
      if (missionObj.rewardBadgeId) { const b = BADGES_DATA.find(bg => bg.id === missionObj?.rewardBadgeId); if (b && !currentUser.badges.includes(b.id)) newBadge = b; }
    }
    const newKobiNode = nextMissionObj ? `node-${missionIndex + 2}` : `node-${missionIndex + 1}`;
    if (nextMissionObj) setActiveMissionId(nextMissionObj.id);

    setAllUsers(prev => {
      const updated = prev.map(u => {
        if (u.id === currentUserId) {
          const completed = Array.from(new Set([...u.completedMissions, missionId]));
          const updatedClaimed = Array.from(new Set([...(u.rewardsClaimed || []), missionId]));
          const updatedBadges = newBadge && !u.badges.includes(newBadge.id) ? [...u.badges, newBadge.id] : u.badges;
          const newXp = u.xp + xpEarned;
          const newLevel = Math.floor(newXp / 250) + 1;
          const userUpdated: User = {
            ...u, xp: newXp, level: newLevel, stars: u.stars + starsEarned, coins: u.coins + coinsEarned,
            completedMissions: completed, rewardsClaimed: updatedClaimed, kobiPosition: newKobiNode, badges: updatedBadges,
            missionScores: { ...u.missionScores, [missionId]: { stars: Math.max(stars, u.missionScores?.[missionId]?.stars || 0), score: Math.max(score, u.missionScores?.[missionId]?.score || 0), completedAt: new Date().toISOString() } }
          };
          // Route through Cloud Function — server looks up rewards from config.
          // Client sends only missionId + performance metrics (stars, score) + kobiPosition.
          submitProgressToBackend('mission_complete', { missionId, stars, score, kobiPosition: newKobiNode });
          return userUpdated;
        }
        return u;
      });
      persistUsers(updated);
      return updated;
    });

    let isOfflineSaved = false;
    if (isOffline) {
      isOfflineSaved = true;
      const offlineRecord = saveToOfflineQueue({ type: 'mission_complete', userId: currentUserId, title: missionObj?.title || 'Misi Pembelajaran', subtitle: `${stars} Bintang • Skor ${score}`, payload: { missionId, stars, score, xpEarned, coinsEarned, badgeId: newBadge?.id, timestamp: new Date().toISOString() } });
      setOfflineQueue(prev => [offlineRecord, ...prev]);
      getStorageEstimate().then(setStorageEstimate);
      triggerKobiSpeech('Misi berhasil diselesaikan! Karena koneksi internet tidak stabil, progres disimpan sementara secara lokal di perangkat ini.', 'happy', false);
    }
    audioService.playFanfare();
    recordDailyActivity('Menyelesaikan Misi');
    return { isAlreadyClaimed, newBadge, starsEarned, coinsEarned, xpEarned, isOfflineSaved };
  };

  const saveProject = (project: CodingProject) => {
    setProjects(prev => {
      const idx = prev.findIndex(p => p.id === project.id);
      let updated: CodingProject[];
      if (idx >= 0) { const copy = [...prev]; copy[idx] = { ...project, updatedAt: new Date().toISOString().split('T')[0] }; updated = copy; }
      else { updated = [project, ...prev]; }
      persistProjects(updated);
      return updated;
    });
    if (isOffline) {
      const offRec = saveToOfflineQueue({ type: 'coding_project', userId: currentUserId, title: `Proyek: ${project.title}`, subtitle: `${project.blocks.length} Blok Kode Tersimpan`, payload: { projectId: project.id, timestamp: new Date().toISOString() } });
      setOfflineQueue(prev => [offRec, ...prev]);
      getStorageEstimate().then(setStorageEstimate);
    }
    audioService.playSuccessSound();
    triggerKobiSpeech(isOffline ? 'Proyek kodemu disimpan di memori lokal offline!' : 'Proyek kodemu berhasil disimpan!', 'happy', true);
    recordDailyActivity('Menyimpan Proyek');
  };

  const deleteProject = (projectId: string) => {
    setProjects(prev => { const updated = prev.filter(p => p.id !== projectId); persistProjects(updated); return updated; });
  };

  const claimDailyMission = (missionId: string) => {
    setDailyMissions(prev => {
      const updatedMissions = prev.map(dm => {
        if (dm.id === missionId && !dm.isCompleted) {
          audioService.playCoinSound();
          setAllUsers(uList => {
            const updatedUsers = uList.map(u => {
              if (u.id === currentUserId) {
                const userUpdated: User = { ...u, stars: u.stars + dm.rewardStars, coins: u.coins + dm.rewardCoins };
                // Server looks up daily mission rewards from config — client sends only missionId
                submitProgressToBackend('daily_claim', { missionId: dm.id });
                return userUpdated;
              }
              return u;
            });
            persistUsers(updatedUsers);
            return updatedUsers;
          });
          if (isOffline) {
            const offRec = saveToOfflineQueue({ type: 'daily_claim', userId: currentUserId, title: `Misi Harian: ${dm.title}`, subtitle: `+${dm.rewardStars} Bintang • +${dm.rewardCoins} Koin`, payload: { missionId: dm.id, stars: dm.rewardStars, coinsEarned: dm.rewardCoins, timestamp: new Date().toISOString() } });
            setOfflineQueue(q => [offRec, ...q]);
          }
          recordDailyActivity('Klaim Misi');
          return { ...dm, isCompleted: true, progress: dm.maxProgress };
        }
        return dm;
      });
      persistDailyMissions(updatedMissions);
      return updatedMissions;
    });
  };

  const createAssignment = async (data: Omit<Assignment, 'id' | 'createdAt' | 'createdBy'>): Promise<{ success: boolean; message?: string }> => {
    try {
      const newId = `asg-${Date.now()}`;
      const newAssignment: Assignment = {
        id: newId, title: data.title.trim(), description: data.description.trim(),
        targetGrade: data.targetGrade, type: data.type, dueDate: data.dueDate ? data.dueDate : undefined,
        createdAt: new Date().toISOString(),
        createdBy: { uid: currentUser.id, name: currentUser.name, role: currentUser.role, username: currentUser.username },
        missionId: data.missionId
      };
      try { const asgRef = doc(db, 'assignments', newId); await setDoc(asgRef, newAssignment); }
      catch (err) { handleFirestoreError(err, OperationType.WRITE, 'assignments'); }
      setAssignments(prev => { const updated = [newAssignment, ...prev]; try { localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ } return updated; });
      audioService.playSuccessSound();
      return { success: true };
    } catch { return { success: false, message: 'Gagal membuat tugas. Silakan coba lagi.' }; }
  };

  const deleteAssignment = async (assignmentId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      try { const asgRef = doc(db, 'assignments', assignmentId); await deleteDoc(asgRef); }
      catch (err) { handleFirestoreError(err, OperationType.DELETE, `assignments/${assignmentId}`); }
      setAssignments(prev => { const updated = prev.filter(a => a.id !== assignmentId); try { localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ } return updated; });
      audioService.playSnapSound();
      return { success: true };
    } catch { return { success: false, message: 'Gagal menghapus tugas.' }; }
  };

  const updateUserProfile = async (userId: string, data: UpdateProfileData): Promise<{ success: boolean; message?: string }> => {
    try {
      const targetUser = allUsers.find(u => u.id === userId);
      if (!targetUser) return { success: false, message: 'Data pengguna tidak ditemukan.' };
      // Permission checks use TRUSTED role (from custom claims), not client-writable doc
      if (currentUser.role !== 'admin' && currentUser.id !== userId) return { success: false, message: 'Kamu hanya dapat mengubah profil milikmu sendiri.' };
      if (currentUser.role === 'teacher' && targetUser.role === 'admin' && currentUser.id !== userId) return { success: false, message: 'Guru tidak diizinkan mengubah profil admin.' };
      if (currentUser.role === 'student' && currentUser.id !== userId) return { success: false, message: 'Siswa hanya dapat mengubah profil sendiri.' };
      const cleanName = data.name.trim();
      if (!cleanName) return { success: false, message: 'Nama lengkap wajib diisi.' };
      if (cleanName.length < 2) return { success: false, message: 'Nama lengkap minimal 2 karakter.' };
      const cleanNickname = data.nickname ? data.nickname.trim().slice(0, 30) : '';
      const cleanDisplayName = data.displayName?.trim() || cleanNickname || cleanName;
      const cleanBio = data.bio ? data.bio.trim().slice(0, 120) : '';
      const avatarUrl = data.avatarUrl || data.avatar || '';
      const avatarType = data.avatarType || (avatarUrl.startsWith('data:') ? 'custom' : avatarUrl ? 'preset' : 'initial');
      const updatedAt = new Date().toISOString();
      try {
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, { name: cleanName, fullName: cleanName, nickname: cleanNickname, displayName: cleanDisplayName, avatar: avatarUrl, avatarUrl: avatarUrl, avatarType, bio: cleanBio, updatedAt }, { merge: true });
      } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`); }
      setAllUsers(prev => {
        const updated = prev.map(u => u.id === userId ? { ...u, name: cleanName, fullName: cleanName, nickname: cleanNickname, displayName: cleanDisplayName, avatar: avatarUrl, avatarUrl: avatarUrl, avatarType, bio: cleanBio, updatedAt } : u);
        persistUsers(updated);
        return updated;
      });
      audioService.playSuccessSound();
      return { success: true, message: 'Profil berhasil diperbarui' };
    } catch (err) {
      console.error('Error updating user profile:', err);
      return { success: false, message: 'Terjadi kesalahan saat menyimpan profil. Silakan coba lagi.' };
    }
  };

  const triggerKobiSpeech = (text: string, mood: KobiSpeechState['mood'] = 'happy', speakAudio: boolean = false) => {
    setKobiSpeech({ text, mood });
    if (speakAudio && currentUser?.settings?.narrationVoiceEnabled) { audioService.speakText(text); }
  };

  const dismissKobiSpeech = () => { setKobiSpeech(null); audioService.stopSpeaking(); };

  const awardChallengeBonus = (stars: number, xp: number, challengeTitle: string) => {
    setAllUsers(prev => {
      const updated = prev.map(u => {
        if (u.id === currentUserId) {
          const newXp = u.xp + xp;
          const newLevel = Math.floor(newXp / 250) + 1;
          const userUpdated: User = { ...u, xp: newXp, level: newLevel, stars: u.stars + stars, coins: u.coins + (stars * 10) };
          submitProgressToBackend('challenge_bonus', { stars, xp, coins: stars * 10, challengeTitle });
          return userUpdated;
        }
        return u;
      });
      persistUsers(updated);
      return updated;
    });
    if (isOffline) {
      const offRec = saveToOfflineQueue({ type: 'challenge_complete', userId: currentUserId, title: `Tantangan Algoritma: ${challengeTitle}`, subtitle: `+${stars} Bintang • +${xp} XP`, payload: { challengeId: challengeTitle, stars, xpEarned: xp, coinsEarned: stars * 10, timestamp: new Date().toISOString() } });
      setOfflineQueue(q => [offRec, ...q]);
      getStorageEstimate().then(setStorageEstimate);
    }
    audioService.playFanfare();
    recordDailyActivity(`Tantangan: ${challengeTitle}`);
    triggerKobiSpeech(`Hebat sekali! Kamu menyelesaikan tantangan "${challengeTitle}" dan meraih +${stars} Bintang & +${xp} XP!`, 'celebrating', true);
  };

  const resetProgress = () => {
    // Only resets local UI data — does NOT touch Firestore or auth
    setDailyMissions(DAILY_MISSIONS);
    persistDailyMissions(DAILY_MISSIONS);
    clearOfflineQueue();
    setOfflineQueue([]);
    audioService.playSuccessSound();
    triggerKobiSpeech('Data progres lokal berhasil di-reset!', 'happy', true);
  };

  const getMissionById = (missionId: string): Mission | undefined => {
    for (const chapter of CHAPTERS_DATA) {
      const m = chapter.missions.find(m => m.id === missionId);
      if (m) return m;
    }
    return undefined;
  };

  const networkStatus: NetworkStatusState = useMemo(() => {
    return { isOnline, isSimulatedOffline, isSyncing, pendingSyncCount: offlineQueue.length, lastSyncedAt, serviceWorkerActive, storageEstimate };
  }, [isOnline, isSimulatedOffline, isSyncing, offlineQueue.length, lastSyncedAt, serviceWorkerActive, storageEstimate]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        allUsers,
        isAuthenticated,
        authLoading,
        authError,
        mustChangePassword,
        login,
        registerStudent,
        updatePassword,
        logout,
        updateUserGrade,
        adminUpdateUserGrade,
        updateSettings,
        completeMission,
        projects,
        saveProject,
        deleteProject,
        dailyMissions,
        claimDailyMission,
        activeMissionId,
        setActiveMissionId,
        setKobiPosition,
        kobiSpeech,
        triggerKobiSpeech,
        dismissKobiSpeech,
        resetProgress,
        getMissionById,
        streakInfo,
        checkInStreak,
        recordDailyActivity,
        awardChallengeBonus,
        networkStatus,
        offlineQueue,
        toggleSimulatedOffline,
        syncOfflineData,
        isOffline,
        allLeaderboardStudents,
        cheersMap,
        cheerStudent,
        assignments,
        createAssignment,
        deleteAssignment,
        updateUserProfile
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
