export type UserRole = 'student' | 'teacher' | 'admin';

export type ClassGrade = 1 | 2 | 3 | 4 | 5 | 6;

export type ClassSection = 'A' | 'B' | 'C' | string;

export type AvatarType = 'preset' | 'custom' | 'initial';

export interface AccessibilitySettings {
  soundEnabled: boolean;
  narrationVoiceEnabled: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  dyslexicFont: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
}

export interface User {
  id: string;
  name: string;
  fullName?: string;
  nickname?: string;
  displayName?: string;
  username: string;
  role: UserRole;
  avatar: string;
  avatarUrl?: string;
  avatarType?: AvatarType;
  bio?: string;
  updatedAt?: string;
  mustChangePassword?: boolean;
  email?: string | null;
  grade: ClassGrade;
  gradeLevel?: ClassGrade;
  section?: string; // 'A' | 'B' | 'C' | 'Belum Ditentukan'
  classId?: string; // 'cls-1a', 'cls-4b', etc.
  className?: string; // 'Kelas 1A', 'Kelas 4B', etc.
  school: string;
  accountStatus?: 'active' | 'inactive';
  createdAt?: string;
  xp: number;
  level: number;
  stars: number;
  coins: number;
  streakDays: number;
  streakHistory?: string[]; // array of ISO date strings YYYY-MM-DD
  lastActive: string;
  lastActiveDate?: string; // YYYY-MM-DD
  badges: string[]; // Badge IDs
  completedMissions: string[]; // Mission IDs
  rewardsClaimed?: string[]; // Mission IDs whose main rewards (stars, coins, XP) have been claimed
  kobiPosition?: string; // Node ID where Kobi currently stands on the map
  missionScores: Record<string, { stars: number; score: number; completedAt: string }>;
  kobiCustomization: {
    skin: string;
    hat: string;
    accessory: string;
  };
  settings: AccessibilitySettings;
}

export type AssignmentType = 'mission' | 'practice' | 'project' | 'quiz';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  targetGrade: ClassGrade | 'all';
  targetClassId?: string; // 'all', 'all-1', 'cls-1a', etc.
  targetClassName?: string; // 'Semua Kelas', 'Kelas 1A', etc.
  type: AssignmentType;
  dueDate?: string;
  createdAt: string;
  createdBy: {
    uid: string;
    name: string;
    role: UserRole;
    username: string;
  };
  missionId?: string;
}

export interface StreakInfo {
  currentStreak: number;
  bestStreak: number;
  isTodayActive: boolean;
  activeDaysThisWeek: { dayName: string; date: string; active: boolean; isToday: boolean }[];
  milestones: { days: number; title: string; reward: string; completed: boolean }[];
}

export interface LearningWorld {
  id: string;
  grade: ClassGrade;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  illustrationUrl: string;
  totalChapters: number;
  unlockedAtGrade: ClassGrade;
  order: number;
}

export type MissionNodeStatus = 'locked' | 'unstarted' | 'active' | 'completed' | 'perfect' | 'bonus';

export interface Mission {
  id: string;
  chapterId: string;
  worldId: string;
  grade: ClassGrade;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  status: MissionNodeStatus;
  rewardXp: number;
  rewardStars: number;
  rewardCoins: number;
  rewardBadgeId?: string;
  skillsGained: string[];
  lesson: Lesson;
}

export interface Chapter {
  id: string;
  worldId: string;
  grade: ClassGrade;
  chapterNumber: number;
  title: string;
  subtitle: string;
  description: string;
  missions: Mission[];
}

export type ActivityType = 
  | 'drag_drop' 
  | 'sequence_order' 
  | 'quiz_card' 
  | 'algorithm_maze' 
  | 'spot_bug' 
  | 'matching_pairs'
  | 'mini_coding';

export interface DragDropItem {
  id: string;
  label: string;
  icon?: string;
  category: string;
}

export interface DropZone {
  id: string;
  acceptsCategory: string;
  label: string;
  description?: string;
  icon?: string;
}

export interface SequenceStep {
  id: string;
  label: string;
  icon?: string;
  correctIndex: number;
}

export interface QuizChoice {
  id: string;
  text: string;
  icon?: string;
  isCorrect: boolean;
  feedback: string;
}

export interface MazeGridCell {
  x: number;
  y: number;
  type: 'empty' | 'wall' | 'start' | 'goal' | 'battery' | 'coin';
}

export interface MazeConfig {
  gridSize: number; // e.g., 4x4 or 5x5
  start: { x: number; y: number; dir: 'up' | 'down' | 'left' | 'right' };
  goal: { x: number; y: number };
  walls: { x: number; y: number }[];
  collectibles: { x: number; y: number; id: string; collected?: boolean }[];
  maxCommands: number;
}

export interface InteractiveActivity {
  id: string;
  type: ActivityType;
  title: string;
  instruction: string;
  kobiPrompt: string;
  kobiHints: string[]; // 3 levels of hints
  
  // Specific activity configurations
  dragDropData?: {
    items: DragDropItem[];
    zones: DropZone[];
  };
  sequenceData?: {
    steps: SequenceStep[];
  };
  quizData?: {
    question: string;
    options: QuizChoice[];
  };
  mazeData?: MazeConfig;
  spotBugData?: {
    codeSnippets: { id: string; line: string; isBug: boolean; fixHint: string }[];
    goalText: string;
  };
  matchingData?: {
    leftItems: { id: string; text: string; matchId: string; icon?: string }[];
    rightItems: { id: string; text: string; matchId: string; icon?: string }[];
  };
}

export interface Lesson {
  id: string;
  title: string;
  chapterTitle: string;
  mainConceptTitle: string;
  mainConceptText: string;
  highlightWords: string[];
  narrationText: string;
  illustrationUrl: string;
  realLifeExample: {
    title: string;
    description: string;
    icon: string;
  };
  kobiNote: string;
  activities: InteractiveActivity[];
}

export type BlockCategory = 'motion' | 'looks' | 'sound' | 'control' | 'events' | 'logic';

export interface CodeBlockTemplate {
  id: string;
  opcode: string;
  category: BlockCategory;
  name: string;
  color: string;
  borderColor: string;
  shape: 'cap' | 'notch' | 'c-block' | 'hat';
  inputs: {
    name: string;
    type: 'number' | 'text' | 'select';
    defaultValue: string | number;
    options?: string[];
  }[];
  defaultParams: Record<string, string | number>;
  codeSnippet: string;
}

export interface WorkspaceBlock {
  instanceId: string;
  templateId: string;
  opcode: string;
  category: BlockCategory;
  name: string;
  shape: 'cap' | 'notch' | 'c-block' | 'hat';
  params: Record<string, string | number>;
  children?: WorkspaceBlock[]; // For repeat loops
}

export interface CodingProject {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  grade: ClassGrade;
  createdAt: string;
  updatedAt: string;
  blocks: WorkspaceBlock[];
  sprite: {
    name: string;
    type: 'kobi' | 'cat' | 'rocket' | 'alien';
    x: number;
    y: number;
    size: number;
    direction: number;
    visible: boolean;
  };
  stageBackground: string;
  isPublished?: boolean;
}

export type StudioDifficulty = 'easy' | 'medium' | 'hard';

export interface StudioChallengeCriterion {
  id: string;
  description: string;
  check: 'min_blocks' | 'has_opcode' | 'has_sound' | 'has_rotation' | 'has_coordinate' | 'has_speech' | 'has_size_change' | 'has_wait';
  param?: string | number;
}

export interface StudioAlgorithmChallenge {
  id: string;
  difficulty: StudioDifficulty;
  title: string;
  badgeLabel: string;
  description: string;
  conceptFocus: string;
  targetGoal: string;
  criteria: StudioChallengeCriterion[];
  starterBlocks?: WorkspaceBlock[];
  hint: string;
  rewardStars: number;
  rewardXp: number;
  targetCoordinate?: { x: number; y: number; label: string };
}

export interface Badge {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  category: 'hardware' | 'logic' | 'coding' | 'security' | 'streak' | 'mastery';
  rarity: 'bronze' | 'silver' | 'gold' | 'diamond';
  requiredXp?: number;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardStars: number;
  rewardCoins: number;
  isCompleted: boolean;
  progress: number;
  maxProgress: number;
  actionUrl: string;
}

export interface TeacherStudentProgress {
  id: string;
  name: string;
  avatar: string;
  grade: ClassGrade;
  completedMissionsCount: number;
  totalMissions: number;
  stars: number;
  lastActive: string;
  averageScore: number;
  needsHelp: boolean;
  helpTopic?: string;
  recentProject?: string;
  notes?: string;
}

export interface SchoolClass {
  id: string;
  gradeLevel: ClassGrade;
  section: string; // 'A' | 'B' | 'C' | string
  displayName: string; // 'Kelas 1A', 'Kelas 1B', etc.
  academicYear: string; // '2026/2027'
  teacherIds: string[];
  studentCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Backward compatibility fields
  grade?: ClassGrade;
  name?: string;
  activeTopic?: string;
  averageProgress?: number;
  teacherId?: string;
}

export type Classroom = SchoolClass;

export type OfflineRecordType =
  | 'mission_complete'
  | 'coding_project'
  | 'challenge_complete'
  | 'streak_checkin'
  | 'daily_claim';

export interface OfflineProgressRecord {
  id: string;
  type: OfflineRecordType;
  userId: string;
  title: string;
  subtitle: string;
  payload: {
    missionId?: string;
    stars?: number;
    score?: number;
    xpEarned?: number;
    coinsEarned?: number;
    badgeId?: string;
    projectId?: string;
    challengeId?: string;
    timestamp: string;
  };
  createdAt: string;
  synced: boolean;
  syncAttempts: number;
}

export interface NetworkStatusState {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  lastSyncedAt: string | null;
  serviceWorkerActive: boolean;
  storageEstimate?: {
    usedBytes: number;
    quotaBytes: number;
    percentage: number;
  };
}

export type LeaderboardScope = 'global' | 'school' | 'grade';
export type LeaderboardTimeframe = 'all_time' | 'monthly' | 'weekly';
export type LeaderboardSortBy = 'stars' | 'xp' | 'streak';

export interface LeaderboardStudent {
  id: string;
  name: string;
  nickname?: string;
  username: string;
  avatar: string;
  avatarType?: AvatarType;
  grade: ClassGrade;
  school: string;
  stars: number;
  monthlyStars: number;
  weeklyStars: number;
  xp: number;
  level: number;
  streakDays: number;
  badgesCount: number;
  favoriteTopic?: string;
  isCurrentUser?: boolean;
  cheerCount?: number;
}

