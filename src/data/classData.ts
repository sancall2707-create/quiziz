import { SchoolClass, ClassGrade, User } from '../types';

export const DEFAULT_ACADEMIC_YEAR = '2026/2027';

/**
 * Standard 18 Rombongan Belajar (Kelas 1A - 6C)
 */
export const INITIAL_CLASSES: SchoolClass[] = [
  // Kelas 1
  {
    id: 'cls-1a',
    gradeLevel: 1,
    section: 'A',
    displayName: 'Kelas 1A',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    teacherIds: ['user-teacher-wijaya'],
    studentCount: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    grade: 1,
    name: 'Kelas 1A',
    activeTopic: 'Bab 1: Bentuk & Perangkat Digital',
    averageProgress: 0
  },
  {
    id: 'cls-1b',
    gradeLevel: 1,
    section: 'B',
    displayName: 'Kelas 1B',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    teacherIds: ['user-teacher-wijaya'],
    studentCount: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    grade: 1,
    name: 'Kelas 1B',
    activeTopic: 'Bab 1: Bentuk & Perangkat Digital',
    averageProgress: 0
  },
  {
    id: 'cls-1c',
    gradeLevel: 1,
    section: 'C',
    displayName: 'Kelas 1C',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    teacherIds: ['user-teacher-wijaya'],
    studentCount: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    grade: 1,
    name: 'Kelas 1C',
    activeTopic: 'Bab 1: Bentuk & Perangkat Digital',
    averageProgress: 0
  },

  // Kelas 2
  {
    id: 'cls-2a',
    gradeLevel: 2,
    section: 'A',
    displayName: 'Kelas 2A',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    teacherIds: ['user-teacher-wijaya'],
    studentCount: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    grade: 2,
    name: 'Kelas 2A',
    activeTopic: 'Bab 1: Navigasi Arah Robot Kobi',
    averageProgress: 0
  },
  {
    id: 'cls-2b',
    gradeLevel: 2,
    section: 'B',
    displayName: 'Kelas 2B',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    teacherIds: ['user-teacher-wijaya'],
    studentCount: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    grade: 2,
    name: 'Kelas 2B',
    activeTopic: 'Bab 1: Navigasi Arah Robot Kobi',
    averageProgress: 0
  },
  {
    id: 'cls-2c',
    gradeLevel: 2,
    section: 'C',
    displayName: 'Kelas 2C',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    teacherIds: ['user-teacher-wijaya'],
    studentCount: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    grade: 2,
    name: 'Kelas 2C',
    activeTopic: 'Bab 1: Navigasi Arah Robot Kobi',
    averageProgress: 0
  },

  // Kelas 3
  {
    id: 'cls-3a',
    gradeLevel: 3,
    section: 'A',
    displayName: 'Kelas 3A',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    teacherIds: ['user-teacher-wijaya'],
    studentCount: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    grade: 3,
    name: 'Kelas 3A',
    activeTopic: 'Bab 1: Logika & Pola Algoritma',
    averageProgress: 0
  },
  {
    id: 'cls-3b',
    gradeLevel: 3,
    section: 'B',
    displayName: 'Kelas 3B',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    teacherIds: ['user-teacher-wijaya'],
    studentCount: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    grade: 3,
    name: 'Kelas 3B',
    activeTopic: 'Bab 1: Logika & Pola Algoritma',
    averageProgress: 0
  },
  {
    id: 'cls-3c',
    gradeLevel: 3,
    section: 'C',
    displayName: 'Kelas 3C',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    teacherIds: ['user-teacher-wijaya'],
    studentCount: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    grade: 3,
    name: 'Kelas 3C',
    activeTopic: 'Bab 1: Logika & Pola Algoritma',
    averageProgress: 0
  },

  // Kelas 4
  {
    id: 'cls-4a',
    gradeLevel: 4,
    section: 'A',
    displayName: 'Kelas 4A',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    teacherIds: ['user-teacher-wijaya'],
    studentCount: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    grade: 4,
    name: 'Kelas 4A',
    activeTopic: 'Bab 1: Perangkat Keras & Scratch',
    averageProgress: 0
  },
  {
    id: 'cls-4b',
    gradeLevel: 4,
    section: 'B',
    displayName: 'Kelas 4B',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    teacherIds: ['user-teacher-wijaya'],
    studentCount: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    grade: 4,
    name: 'Kelas 4B',
    activeTopic: 'Bab 1: Perangkat Keras & Scratch',
    averageProgress: 0
  },
  {
    id: 'cls-4c',
    gradeLevel: 4,
    section: 'C',
    displayName: 'Kelas 4C',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    teacherIds: ['user-teacher-wijaya'],
    studentCount: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    grade: 4,
    name: 'Kelas 4C',
    activeTopic: 'Bab 1: Perangkat Keras & Scratch',
    averageProgress: 0
  },

  // Kelas 5
  {
    id: 'cls-5a',
    gradeLevel: 5,
    section: 'A',
    displayName: 'Kelas 5A',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    teacherIds: ['user-teacher-wijaya'],
    studentCount: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    grade: 5,
    name: 'Kelas 5A',
    activeTopic: 'Bab 1: Data & Internet Aman',
    averageProgress: 0
  },
  {
    id: 'cls-5b',
    gradeLevel: 5,
    section: 'B',
    displayName: 'Kelas 5B',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    teacherIds: ['user-teacher-wijaya'],
    studentCount: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    grade: 5,
    name: 'Kelas 5B',
    activeTopic: 'Bab 1: Data & Internet Aman',
    averageProgress: 0
  },
  {
    id: 'cls-5c',
    gradeLevel: 5,
    section: 'C',
    displayName: 'Kelas 5C',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    teacherIds: ['user-teacher-wijaya'],
    studentCount: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    grade: 5,
    name: 'Kelas 5C',
    activeTopic: 'Bab 1: Data & Internet Aman',
    averageProgress: 0
  },

  // Kelas 6
  {
    id: 'cls-6a',
    gradeLevel: 6,
    section: 'A',
    displayName: 'Kelas 6A',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    teacherIds: ['user-teacher-wijaya'],
    studentCount: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    grade: 6,
    name: 'Kelas 6A',
    activeTopic: 'Bab 1: AI & Kecerdasan Buatan',
    averageProgress: 0
  },
  {
    id: 'cls-6b',
    gradeLevel: 6,
    section: 'B',
    displayName: 'Kelas 6B',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    teacherIds: ['user-teacher-wijaya'],
    studentCount: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    grade: 6,
    name: 'Kelas 6B',
    activeTopic: 'Bab 1: AI & Kecerdasan Buatan',
    averageProgress: 0
  },
  {
    id: 'cls-6c',
    gradeLevel: 6,
    section: 'C',
    displayName: 'Kelas 6C',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    teacherIds: ['user-teacher-wijaya'],
    studentCount: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    grade: 6,
    name: 'Kelas 6C',
    activeTopic: 'Bab 1: AI & Kecerdasan Buatan',
    averageProgress: 0
  }
];

/**
 * Format standard class display name
 * Examples: (4, 'A') -> "Kelas 4A"
 */
export function formatClassDisplayName(gradeLevel: number | ClassGrade, section?: string | null): string {
  const g = Number(gradeLevel) || 1;
  const s = section ? section.trim().toUpperCase() : '';
  if (!s || s === 'BELUM DITENTUKAN' || s === 'UNASSIGNED') {
    return `Kelas ${g} (Belum Ditentukan)`;
  }
  return `Kelas ${g}${s}`;
}

/**
 * Get display name for a user (student)
 */
export function getUserClassDisplayName(user?: Partial<User> | null): string {
  if (!user) return 'Kelas -';
  const grade = user.gradeLevel || user.grade || 1;
  const section = user.section;
  return formatClassDisplayName(grade, section);
}

/**
 * Generate standard classId
 * Example: (4, 'A') -> 'cls-4a'
 */
export function generateClassId(gradeLevel: number | ClassGrade, section: string): string {
  const cleanSection = section.trim().toLowerCase();
  return `cls-${gradeLevel}${cleanSection}`;
}

/**
 * Get available sections for a grade level
 */
export const DEFAULT_SECTIONS = ['A', 'B', 'C'] as const;
