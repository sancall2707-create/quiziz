import { StudioAlgorithmChallenge, StudioDifficulty } from '../types';

export const DIFFICULTY_CONFIG: Record<
  StudioDifficulty,
  {
    label: string;
    levelName: string;
    icon: string;
    badgeBg: string;
    badgeText: string;
    borderCol: string;
    activeBorder: string;
    description: string;
    recommendedGrades: string;
    targetConcepts: string[];
  }
> = {
  easy: {
    label: 'Mudah',
    levelName: 'Tingkat Pemula',
    icon: '🌱',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    badgeText: 'text-emerald-700',
    borderCol: 'border-emerald-300',
    activeBorder: 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-400',
    description: 'Fokus pada konsep dasar: Sekuensial sederhana, aksi gerak berurutan, tampilan teks, dan efek suara ramah.',
    recommendedGrades: 'Kelas 1 - 2 SD',
    targetConcepts: ['Sekuensial Langkah', 'Aksi & Respon', 'Dialog Teks & Suara']
  },
  medium: {
    label: 'Sedang',
    levelName: 'Tingkat Terampil',
    icon: '⚡',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    badgeText: 'text-amber-700',
    borderCol: 'border-amber-300',
    activeBorder: 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400',
    description: 'Fokus pada konsep menengah: Rotasi sudut derajat, navigasi koordinat sumbu X/Y, jeda waktu (delay), dan animasi ukuran.',
    recommendedGrades: 'Kelas 3 - 4 SD',
    targetConcepts: ['Koordinat Kartesius X/Y', 'Rotasi Sudut Derajat', 'Waktu Jeda (Timer)']
  },
  hard: {
    label: 'Sulit',
    levelName: 'Tingkat Mahir',
    icon: '🏆',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
    badgeText: 'text-rose-700',
    borderCol: 'border-rose-300',
    activeBorder: 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-400',
    description: 'Fokus pada konsep tingkat lanjut: Algoritma geometri multi-sisi, simulasi peluncuran komposit, navigasi multi-titik, dan kombinasi multi-blok kompleks.',
    recommendedGrades: 'Kelas 5 - 6 SD',
    targetConcepts: ['Pola Geometri Persegi', 'Kombinasi Multi-Sistem', 'Optimasi Alur Algoritma']
  }
};

export const STUDIO_CHALLENGES: StudioAlgorithmChallenge[] = [
  // ==================== TINGKAT MUDAH ====================
  {
    id: 'ch-easy-1',
    difficulty: 'easy',
    title: 'Sapaan Pagi Sang Petualang',
    badgeLabel: 'Sekuensial 1',
    description: 'Susun algoritma berurutan agar Kobi mengucapkan salam ramah, melangkah maju 30 langkah, dan membunyikan nada sukses.',
    conceptFocus: 'Sekuensial Dasar (Events, Looks, Motion, Sound)',
    targetGoal: 'Kobi menyapa dengan pesan, maju langkah, dan memainkan suara.',
    criteria: [
      {
        id: 'c1',
        description: 'Terdapat blok Mulai ⚑ (ketika bendera diklik)',
        check: 'has_opcode',
        param: 'event_whenflagclicked'
      },
      {
        id: 'c2',
        description: 'Memiliki blok Katakan Pesan (Looks)',
        check: 'has_speech'
      },
      {
        id: 'c3',
        description: 'Memiliki blok Gerak Langkah (Motion)',
        check: 'has_opcode',
        param: 'motion_movesteps'
      },
      {
        id: 'c4',
        description: 'Memiliki blok Mainkan Suara (Sound)',
        check: 'has_sound'
      },
      {
        id: 'c5',
        description: 'Minimal tersusun dari 4 blok kode',
        check: 'min_blocks',
        param: 4
      }
    ],
    starterBlocks: [
      {
        instanceId: 'st-flag',
        templateId: 'blk-when-flag-clicked',
        opcode: 'event_whenflagclicked',
        category: 'events',
        name: 'ketika ⚑ diklik',
        shape: 'cap',
        params: {}
      },
      {
        instanceId: 'st-say',
        templateId: 'blk-say-for-sec',
        opcode: 'looks_sayforsecs',
        category: 'looks',
        name: 'katakan [MESSAGE] selama [SECS] detik',
        shape: 'notch',
        params: { MESSAGE: 'Selamat pagi kawan coder!', SECS: 2 }
      }
    ],
    hint: 'Tambahkan blok "gerak langkah" dari kategori Gerakan dan blok "mainkan suara" dari kategori Suara setelah blok katakan pesan.',
    rewardStars: 2,
    rewardXp: 35
  },
  {
    id: 'ch-easy-2',
    difficulty: 'easy',
    title: 'Penjelajah Langkah Beruntun',
    badgeLabel: 'Langkah Ceria',
    description: 'Rangkai minimal 2 instruksi gerak maju berurutan untuk melatih pemahaman alur eksekusi baris per baris.',
    conceptFocus: 'Alur Eksekusi Berulang Sederhana',
    targetGoal: 'Kobi melangkah dua kali berturut-turut lalu menyapa kawan baru.',
    criteria: [
      {
        id: 'c1',
        description: 'Terdapat blok Mulai ⚑',
        check: 'has_opcode',
        param: 'event_whenflagclicked'
      },
      {
        id: 'c2',
        description: 'Memiliki minimal 2 blok Gerak Langkah',
        check: 'has_opcode',
        param: 'motion_movesteps'
      },
      {
        id: 'c3',
        description: 'Memiliki blok Katakan Pesan',
        check: 'has_speech'
      },
      {
        id: 'c4',
        description: 'Minimal tersusun dari 4 blok kode',
        check: 'min_blocks',
        param: 4
      }
    ],
    starterBlocks: [
      {
        instanceId: 'st-flag',
        templateId: 'blk-when-flag-clicked',
        opcode: 'event_whenflagclicked',
        category: 'events',
        name: 'ketika ⚑ diklik',
        shape: 'cap',
        params: {}
      },
      {
        instanceId: 'st-move1',
        templateId: 'blk-move',
        opcode: 'motion_movesteps',
        category: 'motion',
        name: 'gerak [STEPS] langkah',
        shape: 'notch',
        params: { STEPS: 20 }
      }
    ],
    hint: 'Tambahkan satu lagi blok "gerak langkah" lalu sambungkan blok "katakan pesan" di akhir.',
    rewardStars: 2,
    rewardXp: 35
  },
  {
    id: 'ch-easy-3',
    difficulty: 'easy',
    title: 'Kobi Membesar Gembira',
    badgeLabel: 'Efek Ukuran',
    description: 'Buat algoritma tampilan yang mengubah ukuran Kobi menjadi lebih besar saat menyapa dengan gembira!',
    conceptFocus: 'Manipulasi Properti Tampilan (Looks Scale)',
    targetGoal: 'Kobi membesar dan menyuarakan kegembiraan.',
    criteria: [
      {
        id: 'c1',
        description: 'Terdapat blok Mulai ⚑',
        check: 'has_opcode',
        param: 'event_whenflagclicked'
      },
      {
        id: 'c2',
        description: 'Memiliki blok Ubah Ukuran (Looks)',
        check: 'has_size_change'
      },
      {
        id: 'c3',
        description: 'Memiliki blok Katakan Pesan',
        check: 'has_speech'
      },
      {
        id: 'c4',
        description: 'Minimal tersusun dari 3 blok kode',
        check: 'min_blocks',
        param: 3
      }
    ],
    starterBlocks: [
      {
        instanceId: 'st-flag',
        templateId: 'blk-when-flag-clicked',
        opcode: 'event_whenflagclicked',
        category: 'events',
        name: 'ketika ⚑ diklik',
        shape: 'cap',
        params: {}
      }
    ],
    hint: 'Buka kategori "Tampilan", pilih blok "ubah ukuran sebesar [SIZE]", lalu pasangkan blok "katakan pesan".',
    rewardStars: 2,
    rewardXp: 40
  },

  // ==================== TINGKAT SEDANG ====================
  {
    id: 'ch-med-1',
    difficulty: 'medium',
    title: 'Patroli Titik Koordinat Nusantara',
    badgeLabel: 'Navigasi X/Y',
    description: 'Arahkan Kobi ke titik koordinat Pos Patroli (X: 80, Y: -40), beri jeda waktu tunggu 1 detik, lalu bunyikan nada tanda lapor!',
    conceptFocus: 'Sistem Koordinat Kartesius & Jeda Waktu',
    targetGoal: 'Kobi berpindah ke koordinat target, menunggu sejenak, dan membunyikan laporan.',
    targetCoordinate: { x: 80, y: -40, label: 'Pos Patroli (80, -40)' },
    criteria: [
      {
        id: 'c1',
        description: 'Memiliki blok Pergi ke Posisi X/Y (motion_gotoxy)',
        check: 'has_coordinate'
      },
      {
        id: 'c2',
        description: 'Memiliki blok Tunggu / Jeda Waktu (control_wait)',
        check: 'has_wait'
      },
      {
        id: 'c3',
        description: 'Memiliki blok Mainkan Suara (sound_play)',
        check: 'has_sound'
      },
      {
        id: 'c4',
        description: 'Minimal tersusun dari 4 blok kode',
        check: 'min_blocks',
        param: 4
      }
    ],
    starterBlocks: [
      {
        instanceId: 'st-flag',
        templateId: 'blk-when-flag-clicked',
        opcode: 'event_whenflagclicked',
        category: 'events',
        name: 'ketika ⚑ diklik',
        shape: 'cap',
        params: {}
      },
      {
        instanceId: 'st-goto',
        templateId: 'blk-goto-xy',
        opcode: 'motion_gotoxy',
        category: 'motion',
        name: 'pergi ke x: [X] y: [Y]',
        shape: 'notch',
        params: { X: 80, Y: -40 }
      }
    ],
    hint: 'Gunakan blok "tunggu [SECS] detik" dari kategori Kontrol, lalu tambahkan "mainkan suara" dari kategori Suara.',
    rewardStars: 3,
    rewardXp: 60
  },
  {
    id: 'ch-med-2',
    difficulty: 'medium',
    title: 'Tarian Putaran 360 Derajat',
    badgeLabel: 'Rotasi Sudut',
    description: 'Susun algoritma rotasi teratur menggunakan blok putar sudut kanan/kiri berurutan dengan jeda waktu dan ucapan penutup.',
    conceptFocus: 'Rotasi Derajat Geometri & Animasi Sinkron',
    targetGoal: 'Kobi berputar haluan secara teratur lalu menyapa setelah selesai.',
    criteria: [
      {
        id: 'c1',
        description: 'Memiliki minimal 2 blok Putar Sudut Derajat',
        check: 'has_rotation'
      },
      {
        id: 'c2',
        description: 'Memiliki blok Tunggu / Jeda Waktu',
        check: 'has_wait'
      },
      {
        id: 'c3',
        description: 'Memiliki blok Katakan Pesan di akhir',
        check: 'has_speech'
      },
      {
        id: 'c4',
        description: 'Minimal tersusun dari 5 blok kode',
        check: 'min_blocks',
        param: 5
      }
    ],
    starterBlocks: [
      {
        instanceId: 'st-flag',
        templateId: 'blk-when-flag-clicked',
        opcode: 'event_whenflagclicked',
        category: 'events',
        name: 'ketika ⚑ diklik',
        shape: 'cap',
        params: {}
      },
      {
        instanceId: 'st-turn1',
        templateId: 'blk-turn-right',
        opcode: 'motion_turnright',
        category: 'motion',
        name: 'putar ↻ [DEGREES] derajat',
        shape: 'notch',
        params: { DEGREES: 90 }
      }
    ],
    hint: 'Tambahkan blok putar kanan 90° kedua dan ketiga, selipkan blok tunggu, lalu akhiri dengan katakan "Tarian Putar Selesai!".',
    rewardStars: 3,
    rewardXp: 65
  },
  {
    id: 'ch-med-3',
    difficulty: 'medium',
    title: 'Penyusup Halus (Gerak & Skala)',
    badgeLabel: 'Skala & Gerak',
    description: 'Ubah ukuran Kobi menjadi lebih kecil (-20), bergerak maju 40 langkah, lalu kembalikan ukuran semula (+20) sambil membunyikan nada.',
    conceptFocus: 'Kombinasi Properti Ukuran dan Posisi',
    targetGoal: 'Kobi mengecil saat bergerak, lalu kembali membesar ke ukuran normal.',
    criteria: [
      {
        id: 'c1',
        description: 'Memiliki minimal 2 blok Ubah Ukuran',
        check: 'has_size_change'
      },
      {
        id: 'c2',
        description: 'Memiliki blok Gerak Langkah',
        check: 'has_opcode',
        param: 'motion_movesteps'
      },
      {
        id: 'c3',
        description: 'Memiliki blok Mainkan Suara',
        check: 'has_sound'
      },
      {
        id: 'c4',
        description: 'Minimal tersusun dari 5 blok kode',
        check: 'min_blocks',
        param: 5
      }
    ],
    starterBlocks: [
      {
        instanceId: 'st-flag',
        templateId: 'blk-when-flag-clicked',
        opcode: 'event_whenflagclicked',
        category: 'events',
        name: 'ketika ⚑ diklik',
        shape: 'cap',
        params: {}
      },
      {
        instanceId: 'st-size1',
        templateId: 'blk-change-size',
        opcode: 'looks_changesizeby',
        category: 'looks',
        name: 'ubah ukuran sebesar [SIZE]',
        shape: 'notch',
        params: { SIZE: -20 }
      }
    ],
    hint: 'Lanjutkan dengan blok gerak 40 langkah, blok ubah ukuran +20, dan akhiri dengan mainkan suara.',
    rewardStars: 3,
    rewardXp: 65
  },

  // ==================== TINGKAT SULIT ====================
  {
    id: 'ch-hard-1',
    difficulty: 'hard',
    title: 'Algoritma Geometri Pola Bujur Sangkar',
    badgeLabel: 'Pola Geometri',
    description: 'Bangun algoritma pembentuk pola bujur sangkar 4 sisi lengkap: 4 kali pasangan blok [Maju Langkah] dan [Putar 90 Derajat] ditutup nada kejayaan!',
    conceptFocus: 'Algoritma Pola Geometri Berulang (4 Sisi & 4 Sudut Siku-Siku)',
    targetGoal: 'Kobi menelusuri 4 sisi bujur sangkar dan kembali ke orientasi awal.',
    criteria: [
      {
        id: 'c1',
        description: 'Memiliki minimal 4 blok Gerak Langkah',
        check: 'has_opcode',
        param: 'motion_movesteps'
      },
      {
        id: 'c2',
        description: 'Memiliki minimal 4 blok Putar Sudut Derajat (90°)',
        check: 'has_rotation'
      },
      {
        id: 'c3',
        description: 'Memiliki blok Mainkan Suara di akhir',
        check: 'has_sound'
      },
      {
        id: 'c4',
        description: 'Minimal tersusun dari 9 blok kode terstruktur',
        check: 'min_blocks',
        param: 9
      }
    ],
    starterBlocks: [
      {
        instanceId: 'st-flag',
        templateId: 'blk-when-flag-clicked',
        opcode: 'event_whenflagclicked',
        category: 'events',
        name: 'ketika ⚑ diklik',
        shape: 'cap',
        params: {}
      },
      {
        instanceId: 'st-m1',
        templateId: 'blk-move',
        opcode: 'motion_movesteps',
        category: 'motion',
        name: 'gerak [STEPS] langkah',
        shape: 'notch',
        params: { STEPS: 35 }
      },
      {
        instanceId: 'st-t1',
        templateId: 'blk-turn-right',
        opcode: 'motion_turnright',
        category: 'motion',
        name: 'putar ↻ [DEGREES] derajat',
        shape: 'notch',
        params: { DEGREES: 90 }
      }
    ],
    hint: 'Ulangi pasangan blok [Gerak 35 langkah] dan [Putar 90°] sebanyak 3 kali lagi, lalu tambahkan nada suara di akhir.',
    rewardStars: 5,
    rewardXp: 100
  },
  {
    id: 'ch-hard-2',
    difficulty: 'hard',
    title: 'Simulasi Peluncuran Roket Angkasa',
    badgeLabel: 'Komposit Roket',
    description: 'Buat algoritma peluncuran kompleks: Mulai di landasan bawah (Y: -70), hitung mundur, perbesar ukuran sprite, melesat ke orbit atas (Y: 70), dan lakukan rotasi manuver!',
    conceptFocus: 'Integrasi Multi-Sistem (Koordinat, Dialog, Skala, Rotasi & Waktu)',
    targetGoal: 'Kobi meluncur dari pangkalan darat menuju orbit antariksa.',
    targetCoordinate: { x: 0, y: 70, label: 'Orbit Antariksa (0, 70)' },
    criteria: [
      {
        id: 'c1',
        description: 'Memiliki minimal 2 blok Pergi ke X/Y (Landasan & Orbit)',
        check: 'has_coordinate'
      },
      {
        id: 'c2',
        description: 'Memiliki blok Ubah Ukuran (Pembesaran Pendorong)',
        check: 'has_size_change'
      },
      {
        id: 'c3',
        description: 'Memiliki blok Putar Sudut (Manuver Haluan)',
        check: 'has_rotation'
      },
      {
        id: 'c4',
        description: 'Memiliki blok Katakan Pesan & Tunggu Waktu',
        check: 'has_speech'
      },
      {
        id: 'c5',
        description: 'Minimal tersusun dari 7 blok kode',
        check: 'min_blocks',
        param: 7
      }
    ],
    starterBlocks: [
      {
        instanceId: 'st-flag',
        templateId: 'blk-when-flag-clicked',
        opcode: 'event_whenflagclicked',
        category: 'events',
        name: 'ketika ⚑ diklik',
        shape: 'cap',
        params: {}
      },
      {
        instanceId: 'st-g1',
        templateId: 'blk-goto-xy',
        opcode: 'motion_gotoxy',
        category: 'motion',
        name: 'pergi ke x: [X] y: [Y]',
        shape: 'notch',
        params: { X: 0, Y: -70 }
      },
      {
        instanceId: 'st-say1',
        templateId: 'blk-say-for-sec',
        opcode: 'looks_sayforsecs',
        category: 'looks',
        name: 'katakan [MESSAGE] selama [SECS] detik',
        shape: 'notch',
        params: { MESSAGE: '3.. 2.. 1.. Meluncur!', SECCS: 2 }
      }
    ],
    hint: 'Tambahkan blok ubah ukuran +30, pergi ke x: 0 y: 70, putar 180 derajat, dan mainkan suara.',
    rewardStars: 5,
    rewardXp: 110
  },
  {
    id: 'ch-hard-3',
    difficulty: 'hard',
    title: 'Ekspedisi Multi-Titik Segitiga Nusantara',
    badgeLabel: 'Navigasi Multi-Titik',
    description: 'Kunjungi 3 titik koordinat berbeda secara berurutan, selipkan jeda waktu & suara di setiap pos, dan akhiri dengan pesan pencapaian ekspedisi!',
    conceptFocus: 'Algoritma Navigasi Multi-Node Berantai',
    targetGoal: 'Kobi menjelajahi ketiga pos patroli secara sistematis.',
    targetCoordinate: { x: 90, y: 50, label: 'Pos Puncak (90, 50)' },
    criteria: [
      {
        id: 'c1',
        description: 'Memiliki minimal 3 blok Pergi ke Posisi X/Y',
        check: 'has_coordinate'
      },
      {
        id: 'c2',
        description: 'Memiliki minimal 2 blok Mainkan Suara',
        check: 'has_sound'
      },
      {
        id: 'c3',
        description: 'Memiliki blok Tunggu / Jeda Waktu',
        check: 'has_wait'
      },
      {
        id: 'c4',
        description: 'Memiliki blok Katakan Pesan di akhir',
        check: 'has_speech'
      },
      {
        id: 'c5',
        description: 'Minimal tersusun dari 8 blok kode',
        check: 'min_blocks',
        param: 8
      }
    ],
    starterBlocks: [
      {
        instanceId: 'st-flag',
        templateId: 'blk-when-flag-clicked',
        opcode: 'event_whenflagclicked',
        category: 'events',
        name: 'ketika ⚑ diklik',
        shape: 'cap',
        params: {}
      },
      {
        instanceId: 'st-pos1',
        templateId: 'blk-goto-xy',
        opcode: 'motion_gotoxy',
        category: 'motion',
        name: 'pergi ke x: [X] y: [Y]',
        shape: 'notch',
        params: { X: -80, Y: -40 }
      },
      {
        instanceId: 'st-snd1',
        templateId: 'blk-play-sound',
        opcode: 'sound_play',
        category: 'sound',
        name: 'mainkan suara [SOUND]',
        shape: 'notch',
        params: { SOUND: 'Chime Sukses' }
      }
    ],
    hint: 'Tambahkan blok pergi ke titik ke-2 (X: 0, Y: 40) dan titik ke-3 (X: 90, Y: 50), selipkan suara dan pesan di titik akhir.',
    rewardStars: 5,
    rewardXp: 120
  }
];
