export interface AvatarPreset {
  id: string;
  name: string;
  category: 'kobi' | 'student' | 'teacher' | 'hero';
  url: string;
  description: string;
}

export const CODENUSA_AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'preset-kobi-explorer',
    name: 'Kobi Penjelajah',
    category: 'kobi',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    description: 'Maskot robot Kobi siap menjelajahi dunia pemrograman!'
  },
  {
    id: 'preset-kobi-cyber',
    name: 'Kobi Cyber Bot',
    category: 'kobi',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=200&auto=format&fit=crop&q=80',
    description: 'Robot Kobi dengan helm futuristik pelindung siber.'
  },
  {
    id: 'preset-kobi-champion',
    name: 'Kobi Juara Emas',
    category: 'kobi',
    url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=200&auto=format&fit=crop&q=80',
    description: 'Kobi dengan aura juara emas penuh prestasi.'
  },
  {
    id: 'preset-student-boy-1',
    name: 'Coder Cilik Satria',
    category: 'student',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    description: 'Siswa cerdas penuh rasa ingin tahu.'
  },
  {
    id: 'preset-student-girl-1',
    name: 'Coder Cilik Maya',
    category: 'student',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    description: 'Siswi kreatif perancang program masa depan.'
  },
  {
    id: 'preset-student-boy-2',
    name: 'Coder Cilik Bima',
    category: 'student',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    description: 'Siswa tangguh pemecah teka-teki logika.'
  },
  {
    id: 'preset-student-girl-2',
    name: 'Coder Cilik Kirana',
    category: 'student',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
    description: 'Siswi ceria pembuat animasi dan game interaktif.'
  },
  {
    id: 'preset-teacher-mentor',
    name: 'Guru Inspiratif',
    category: 'teacher',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    description: 'Pendidik berdedikasi membimbing generasi digital.'
  },
  {
    id: 'preset-tech-master',
    name: 'Master Algoritma',
    category: 'hero',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    description: 'Pakar teknologi dan arsitektur kurikulum informatika.'
  }
];
