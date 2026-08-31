import {
  User,
  LearningWorld,
  Chapter,
  Badge,
  DailyMission,
  CodeBlockTemplate,
  TeacherStudentProgress,
  Classroom,
  LeaderboardStudent
} from '../types';

export const INITIAL_SYSTEM_USERS: User[] = [
  {
    id: 'user-admin-wijaya',
    name: 'Wijaya',
    username: 'wijaya_admin',
    role: 'admin',
    email: 'wijaya.admin@codenusa.id',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    grade: 4,
    school: 'Pusat Kurikulum CodeNusa',
    xp: 0,
    level: 1,
    stars: 0,
    coins: 0,
    streakDays: 1,
    lastActive: 'Hari ini',
    badges: ['badge-mastery'],
    completedMissions: [],
    missionScores: {},
    kobiCustomization: { skin: 'gold-champion', hat: 'crown', accessory: 'cyber-goggles' },
    settings: {
      soundEnabled: true,
      narrationVoiceEnabled: false,
      reduceMotion: false,
      highContrast: false,
      dyslexicFont: false,
      fontSize: 'normal'
    }
  },
  {
    id: 'user-teacher-wijaya',
    name: 'Wijaya',
    username: 'wijaya_guru',
    role: 'teacher',
    email: 'wijaya.guru@codenusa.id',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    grade: 4,
    school: 'SD Harapan Nusantara',
    xp: 0,
    level: 1,
    stars: 0,
    coins: 0,
    streakDays: 1,
    lastActive: 'Hari ini',
    badges: ['badge-mastery'],
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
  }
];

export const DEMO_USERS = INITIAL_SYSTEM_USERS;

export const LEARNING_WORLDS: LearningWorld[] = [
  {
    id: 'world-grade-1',
    grade: 1,
    name: 'Dunia Bentuk & Perangkat',
    subtitle: 'Kelas 1 SD',
    description: 'Kenali bagian-bagian komputer, bentuk pola, dan instruksi sederhana langkah demi langkah.',
    icon: 'shapes',
    color: '#00855b',
    bgGradient: 'from-emerald-50 to-teal-100',
    borderColor: '#4edea3',
    illustrationUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyj8lZwwDi2t5sr8p3ij6x0dKWP8B9uiRqTZH-vDCoyALULjYsnxz3AzNLoXGUKxvLajISS7k0wtpn_s-k2ZFjrSMepwB9EFMjY5fe_BkorxXGodQcdzLa3lekK-ZsJLi_AVcNl5B7OUIkhAOZFdFTjhXZFadsnBS5cbzWikqRGLdwoCUHJ2fj_eRsAfEZazSCGOrmzrd-c0Lehf_QH0oROEBm9QQ4Amq2fL17rAy35AtHcIl4yGVV',
    totalChapters: 3,
    unlockedAtGrade: 1,
    order: 1
  },
  {
    id: 'world-grade-2',
    grade: 2,
    name: 'Petualangan Arah & Urutan',
    subtitle: 'Kelas 2 SD',
    description: 'Bantu Kobi bernavigasi dengan instruksi arah (maju, belok, lompat) dan aktivitas tanpa perangkat.',
    icon: 'compass',
    color: '#6b38d4',
    bgGradient: 'from-purple-50 to-indigo-100',
    borderColor: '#d0bcff',
    illustrationUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXfX-EnpbG-SugqEc4yTw41rw0F9GLMR-xFCmXHGV-bnlt6PefBaQfwwmmnhuW9qhMl8D2BPGJHgtMLjdy55czcyokupGuMtPJfkIE9kVvPFUEPYkfeS00_Oy2oP1sWg5oLE5bOxi7Ol8otM0sSg4nlJ_9VhZKlAzafFQNG3to6rb_WaOroiEZSwKe4iiOaGUiVksEb7ncAH06d3KtTBJs-Zn4ELO3sHEKU0fevfTO9fm_uprsg-vK',
    totalChapters: 3,
    unlockedAtGrade: 2,
    order: 2
  },
  {
    id: 'world-grade-3',
    grade: 3,
    name: 'Logika & Pola Algoritma',
    subtitle: 'Kelas 3 SD',
    description: 'Pecahkan teka-teki logika, temukan pola berulang, dan pelajari urutan algoritma terstruktur.',
    icon: 'cpu',
    color: '#0058be',
    bgGradient: 'from-blue-50 to-sky-100',
    borderColor: '#adc6ff',
    illustrationUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYB5SDk3Q_PII0EWfjpmLd8ZXix2OfiVjVIl7bcPaNj18ZYk9x3gOu8ce5Ihr8LKIQq65Jf94v1SuLRnvhznLrVMnpGR80QiG3dYgTMgG5yX-7a-Ltbi1E5nuhffoJPTK6FdXkwz_auw0QVb4nKWYYoRbPQHO9LXPu6oR2A51vQeN9lqLfEFzpJ2u0vArzgsLm8q0BlwwVT7hW7z9RIApZhNZkqyhhQwiek9sQPgoqvpzWDIyYXGQ_',
    totalChapters: 4,
    unlockedAtGrade: 3,
    order: 3
  },
  {
    id: 'world-grade-4',
    grade: 4,
    name: 'Kota Coding & Perulangan',
    subtitle: 'Kelas 4 SD',
    description: 'Susun blok visual Scratch, kuasai perulangan (loop), kondisi jika-maka, dan animasi interaktif!',
    icon: 'code-2',
    color: '#0058be',
    bgGradient: 'from-blue-50 to-indigo-100',
    borderColor: '#adc6ff',
    illustrationUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXfX-EnpbG-SugqEc4yTw41rw0F9GLMR-xFCmXHGV-bnlt6PefBaQfwwmmnhuW9qhMl8D2BPGJHgtMLjdy55czcyokupGuMtPJfkIE9kVvPFUEPYkfeS00_Oy2oP1sWg5oLE5bOxi7Ol8otM0sSg4nlJ_9VhZKlAzafFQNG3to6rb_WaOroiEZSwKe4iiOaGUiVksEb7ncAH06d3KtTBJs-Zn4ELO3sHEKU0fevfTO9fm_uprsg-vK',
    totalChapters: 4,
    unlockedAtGrade: 4,
    order: 4
  },
  {
    id: 'world-grade-5',
    grade: 5,
    name: 'Data & Internet Aman',
    subtitle: 'Kelas 5 SD',
    description: 'Pelajari cara internet bekerja, keamanan kata sandi, etika digital, dan pembuatan game mini.',
    icon: 'globe-lock',
    color: '#8455ef',
    bgGradient: 'from-violet-50 to-purple-100',
    borderColor: '#e9ddff',
    illustrationUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyj8lZwwDi2t5sr8p3ij6x0dKWP8B9uiRqTZH-vDCoyALULjYsnxz3AzNLoXGUKxvLajISS7k0wtpn_s-k2ZFjrSMepwB9EFMjY5fe_BkorxXGodQcdzLa3lekK-ZsJLi_AVcNl5B7OUIkhAOZFdFTjhXZFadsnBS5cbzWikqRGLdwoCUHJ2fj_eRsAfEZazSCGOrmzrd-c0Lehf_QH0oROEBm9QQ4Amq2fL17rAy35AtHcIl4yGVV',
    totalChapters: 4,
    unlockedAtGrade: 5,
    order: 5
  },
  {
    id: 'world-grade-6',
    grade: 6,
    name: 'Studio Digital & AI Dasar',
    subtitle: 'Kelas 6 SD',
    description: 'Buat proyek aplikasi mini, pelajari cara kerja kecerdasan buatan, dan praktik co-design kreatif!',
    icon: 'sparkles',
    color: '#006947',
    bgGradient: 'from-emerald-50 to-green-100',
    borderColor: '#6ffbbe',
    illustrationUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZfOXbRnQKoKo0HynidiS9N6JQRUWnjSrY9q1oSGynItkZ52S1XsBPtg5iVccSYohBMOYoStqSTHOXu68XCsgJp7gYhRYvsqpjRq-IlsLE9vYjZZlKWNuZDnH3DbiRwKQ_ScluqBQ_AuURDE8OK-hdsiIsgVPr_9UJXTIYN2_2IEiTPmuAKp8RiPy4nj5sQRpB1Vbbf6b1afv7yLdjmCl3cA0ml4SNFhE7UMJ1UnWGK2pcjhlzWCNH',
    totalChapters: 4,
    unlockedAtGrade: 6,
    order: 6
  }
];

export const CHAPTERS_DATA: Chapter[] = [
  {
    id: 'ch-g4-1',
    worldId: 'world-grade-4',
    grade: 4,
    chapterNumber: 1,
    title: 'Pulau Perangkat Digital',
    subtitle: 'Bab 1 • Mulai petualangan kodingmu!',
    description: 'Mengenal perangkat keras komputer, cara kerja mouse & keyboard, serta blok perintah pertama.',
    missions: [
      {
        id: 'm-g4-c1-m1',
        chapterId: 'ch-g4-1',
        worldId: 'world-grade-4',
        grade: 4,
        order: 1,
        title: 'Titik Mulai',
        subtitle: 'Petualangan Dimulai!',
        description: 'Perkenalan dengan robot Kobi dan aturan bermain di dunia CodeNusa.',
        icon: 'tour',
        status: 'completed',
        rewardXp: 50,
        rewardStars: 3,
        rewardCoins: 20,
        rewardBadgeId: 'badge-first-code',
        skillsGained: ['Pengenalan Platform', 'Navigasi Dasar'],
        lesson: {
          id: 'les-g4-1-1',
          title: 'Titik Mulai: Sahabat Barumu Kobi',
          chapterTitle: 'Pulau Perangkat Digital',
          mainConceptTitle: 'Halo Sahabat Coder!',
          mainConceptText: 'Kobi adalah robot pendamping belajarmu. Kobi akan membantumu memahami cara berpikir komputasional dengan gembira!',
          highlightWords: ['Kobi', 'robot pendamping', 'berpikir komputasional'],
          narrationText: 'Halo! Selamat datang di CodeNusa. Aku Kobi, robot kecil yang siap menemanimu belajar koding dan teknologi!',
          illustrationUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASL8Ya0tlN_GgiFTxe2RRjreq-bv2wfXC7kzX9yZowq26f9ApzXA95zmQ3bW5tZ1Mp5DA4vaalM95WTva7n4Ek-M8nMgTkR_5sBlzPbtqa7_85P0W0m6us3InEwkrUyDIAE2RXz3qOcSyVA_FCAq2vkR7kSy4KyV6ghDUA2K2OFLplvRftzjLpQBVWSK9BYAY72xeWJqtyC_xOXpR2TUzAXlhT4qaE9sRL4OgQXT2XAWIimvBUoiXl',
          realLifeExample: {
            title: 'Seperti Berteman di Kelas',
            description: 'Belajar koding bersama teman membuat ide-ide cemerlangmu cepat terwujud!',
            icon: 'users'
          },
          kobiNote: 'Tekan tombol di bawah untuk membuktikan kesiapanmu bertualang!',
          activities: [
            {
              id: 'act-g4-1-1-quiz',
              type: 'quiz_card',
              title: 'Siapakah Sahabat Belajarmu?',
              instruction: 'Pilih jawaban yang tepat di bawah ini.',
              kobiPrompt: 'Siapa nama robot yang akan menemanimu di CodeNusa?',
              kobiHints: [
                'Namaku berawalan huruf K.',
                'Ada 4 huruf dalam namaku: K - O - B - I.',
                'Pilih kartu robot putih biru bernama Kobi!'
              ],
              quizData: {
                question: 'Siapakah nama robot pendamping belajarmu?',
                options: [
                  { id: 'opt1', text: 'Kobi si Robot Cerdas', isCorrect: true, feedback: 'Tepat sekali! Aku Kobi, siap berpetualang bersamamu!' },
                  { id: 'opt2', text: 'Robo Monster', isCorrect: false, feedback: 'Bukan, aku bukan monster, aku robot ramah bernama Kobi.' },
                  { id: 'opt3', text: 'Kucing Oren', isCorrect: false, feedback: 'Kucing oren adalah teman sprite, tapi namaku Kobi.' }
                ]
              }
            }
          ]
        }
      },
      {
        id: 'm-g4-c1-m2',
        chapterId: 'ch-g4-1',
        worldId: 'world-grade-4',
        grade: 4,
        order: 2,
        title: 'Mouse Lincah',
        subtitle: 'Selesai',
        description: 'Belajar fungsi klik kiri, klik kanan, seret (drag), dan lepaskan (drop) dengan mouse.',
        icon: 'mouse',
        status: 'completed',
        rewardXp: 80,
        rewardStars: 3,
        rewardCoins: 30,
        skillsGained: ['Kontrol Mouse', 'Operasi Drag & Drop'],
        lesson: {
          id: 'les-g4-1-2',
          title: 'Mouse Komputer: Penunjuk Sakti',
          chapterTitle: 'Pulau Perangkat Digital',
          mainConceptTitle: 'Fungsi Mouse Komputer',
          mainConceptText: 'Mouse berguna untuk menggerakkan kursor, memilih objek dengan klik, dan memindahkan benda digital dengan klik-tahan-tarik.',
          highlightWords: ['kursor', 'klik', 'klik-tahan-tarik'],
          narrationText: 'Mouse adalah alat input yang membantu kita menunjuk gambar dan tombol di layar komputer!',
          illustrationUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyj8lZwwDi2t5sr8p3ij6x0dKWP8B9uiRqTZH-vDCoyALULjYsnxz3AzNLoXGUKxvLajISS7k0wtpn_s-k2ZFjrSMepwB9EFMjY5fe_BkorxXGodQcdzLa3lekK-ZsJLi_AVcNl5B7OUIkhAOZFdFTjhXZFadsnBS5cbzWikqRGLdwoCUHJ2fj_eRsAfEZazSCGOrmzrd-c0Lehf_QH0oROEBm9QQ4Amq2fL17rAy35AtHcIl4yGVV',
          realLifeExample: {
            title: 'Seperti Jari Telunjukmu',
            description: 'Mouse di komputer sama seperti jarimu saat menunjuk benda di meja belajarmu.',
            icon: 'pointer'
          },
          kobiNote: 'Ayo cocokkan aksi mouse dengan fungsinya!',
          activities: [
            {
              id: 'act-g4-1-2-match',
              type: 'matching_pairs',
              title: 'Pasangkan Aksi Mouse',
              instruction: 'Pilih pasangan aksi mouse dan kegunaannya yang cocok.',
              kobiPrompt: 'Cocokkan tombol dan fungsi klik yang benar.',
              kobiHints: [
                'Klik 1x biasanya untuk memilih tombol.',
                'Klik 2x (double click) untuk membuka folder atau aplikasi.',
                'Drag & drop untuk memindahkan objek ke tempat baru.'
              ],
              matchingData: {
                leftItems: [
                  { id: 'l1', text: 'Klik Kiri 1x', matchId: 'm1', icon: 'mouse' },
                  { id: 'l2', text: 'Klik Ganda (2x)', matchId: 'm2', icon: 'touch_app' },
                  { id: 'l3', text: 'Tarik & Lepas (Drag)', matchId: 'm3', icon: 'drag_indicator' }
                ],
                rightItems: [
                  { id: 'r1', text: 'Memilih atau menekan tombol', matchId: 'm1' },
                  { id: 'r2', text: 'Membuka program atau file', matchId: 'm2' },
                  { id: 'r3', text: 'Memindahkan blok kode', matchId: 'm3' }
                ]
              }
            }
          ]
        }
      },
      {
        id: 'm-g4-c1-m3',
        chapterId: 'ch-g4-1',
        worldId: 'world-grade-4',
        grade: 4,
        order: 3,
        title: 'Keyboard Ajaib',
        subtitle: 'Sempurna!',
        description: 'Mengenal tombol huruf, spasi, enter, backspace, dan panah navigasi.',
        icon: 'keyboard',
        status: 'perfect',
        rewardXp: 100,
        rewardStars: 3,
        rewardCoins: 40,
        skillsGained: ['Pengetikan Cepat', 'Tombol Khusus'],
        lesson: {
          id: 'les-g4-1-3',
          title: 'Keyboard: Papan Ketik Ajaib',
          chapterTitle: 'Pulau Perangkat Digital',
          mainConceptTitle: 'Tombol Istimewa Keyboard',
          mainConceptText: 'Keyboard memiliki tombol huruf, angka, tombol Spasi untuk memberi jarak, Enter untuk baris baru, dan Backspace untuk menghapus.',
          highlightWords: ['Spasi', 'Enter', 'Backspace', 'Panah Arah'],
          narrationText: 'Dengan keyboard, kita bisa mengetik instruksi kode dan menulis pesan rahasia untuk Kobi!',
          illustrationUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyj8lZwwDi2t5sr8p3ij6x0dKWP8B9uiRqTZH-vDCoyALULjYsnxz3AzNLoXGUKxvLajISS7k0wtpn_s-k2ZFjrSMepwB9EFMjY5fe_BkorxXGodQcdzLa3lekK-ZsJLi_AVcNl5B7OUIkhAOZFdFTjhXZFadsnBS5cbzWikqRGLdwoCUHJ2fj_eRsAfEZazSCGOrmzrd-c0Lehf_QH0oROEBm9QQ4Amq2fL17rAy35AtHcIl4yGVV',
          realLifeExample: {
            title: 'Seperti Pensil & Penghapus Digital',
            description: 'Tombol huruf adalah pensilmu, tombol Backspace adalah penghapusmu.',
            icon: 'edit'
          },
          kobiNote: 'Mari susun urutan tombol saat mengetik kata "KOBI"!',
          activities: [
            {
              id: 'act-g4-1-3-seq',
              type: 'sequence_order',
              title: 'Urutan Mengetik Kata',
              instruction: 'Susun huruf berikut agar membentuk nama sahabatmu: KOBI.',
              kobiPrompt: 'Mulai dari huruf K pertama sampai huruf I terakhir.',
              kobiHints: [
                'Huruf pertama adalah K.',
                'Huruf kedua adalah O, lalu B.',
                'Huruf terakhir adalah I.'
              ],
              sequenceData: {
                steps: [
                  { id: 's1', label: 'Huruf K', correctIndex: 0, icon: 'keyboard' },
                  { id: 's2', label: 'Huruf O', correctIndex: 1, icon: 'keyboard' },
                  { id: 's3', label: 'Huruf B', correctIndex: 2, icon: 'keyboard' },
                  { id: 's4', label: 'Huruf I', correctIndex: 3, icon: 'keyboard' }
                ]
              }
            }
          ]
        }
      },
      {
        id: 'm-g4-c1-m4',
        chapterId: 'ch-g4-1',
        worldId: 'world-grade-4',
        grade: 4,
        order: 4,
        title: 'Mengenal Perangkat Keras',
        subtitle: 'Misi Aktif',
        description: 'Bantu Kobi merakit komputer pertamanya dengan menemukan bagian-bagian yang tepat!',
        icon: 'smart_toy',
        status: 'active',
        rewardXp: 150,
        rewardStars: 3,
        rewardCoins: 50,
        rewardBadgeId: 'badge-hardware-master',
        skillsGained: ['Identifikasi Hardware', 'Koneksi Perangkat', 'Pemecahan Masalah'],
        lesson: {
          id: 'les-g4-1-4',
          title: 'Mengenal Perangkat Keras Komputer',
          chapterTitle: 'Pulau Perangkat Digital',
          mainConceptTitle: 'Kenali Alat-Alat Ini!',
          mainConceptText: 'Mouse untuk menunjuk, Keyboard untuk mengetik, Monitor untuk melihat tampilan, dan CPU/Unit Pemroses sebagai otak komputer.',
          highlightWords: ['Mouse', 'Keyboard', 'Monitor', 'CPU / Otak Komputer'],
          narrationText: 'Perangkat keras adalah bagian komputer yang bisa kita lihat dan sentuh. Setiap alat punya tugas penting tersendiri!',
          illustrationUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyj8lZwwDi2t5sr8p3ij6x0dKWP8B9uiRqTZH-vDCoyALULjYsnxz3AzNLoXGUKxvLajISS7k0wtpn_s-k2ZFjrSMepwB9EFMjY5fe_BkorxXGodQcdzLa3lekK-ZsJLi_AVcNl5B7OUIkhAOZFdFTjhXZFadsnBS5cbzWikqRGLdwoCUHJ2fj_eRsAfEZazSCGOrmzrd-c0Lehf_QH0oROEBm9QQ4Amq2fL17rAy35AtHcIl4yGVV',
          realLifeExample: {
            title: 'Tubuh Manusia & Komputer',
            description: 'Monitor seperti mata & wajah, Keyboard/Mouse seperti tangan, CPU seperti otak pintar di kepala.',
            icon: 'accessibility'
          },
          kobiNote: 'Tarik alat-alat di bawah ke tempat yang tepat untuk menghidupkan komputer Kobi!',
          activities: [
            {
              id: 'act-g4-1-4-drag',
              type: 'drag_drop',
              title: 'Tarik & Lepas!',
              instruction: 'Pindahkan alat ke tempat yang tepat untuk menjalankan komputer.',
              kobiPrompt: 'Taruh Mouse di area Mouse dan Keyboard di area Keyboard.',
              kobiHints: [
                'Lihat ikon mouse berwarna ungu untuk kotak mouse.',
                'Keyboard memiliki banyak tuts tombol persegi panjang.',
                'Seret Mouse Hijau ke kotak "Taruh Mouse Disini".'
              ],
              dragDropData: {
                items: [
                  { id: 'item-mouse', label: 'Mouse Hijau', icon: 'mouse', category: 'mouse' },
                  { id: 'item-keyboard', label: 'Keyboard Biru', icon: 'keyboard', category: 'keyboard' },
                  { id: 'item-monitor', label: 'Monitor Layar', icon: 'tv', category: 'monitor' }
                ],
                zones: [
                  { id: 'zone-mouse', acceptsCategory: 'mouse', label: 'Taruh Mouse Disini', description: 'Untuk menggerakkan kursor', icon: 'mouse' },
                  { id: 'zone-keyboard', acceptsCategory: 'keyboard', label: 'Taruh Keyboard Disini', description: 'Untuk mengetik teks', icon: 'keyboard' },
                  { id: 'zone-monitor', acceptsCategory: 'monitor', label: 'Taruh Monitor Disini', description: 'Untuk melihat gambar', icon: 'tv' }
                ]
              }
            }
          ]
        }
      },
      {
        id: 'm-g4-c1-m5',
        chapterId: 'ch-g4-1',
        worldId: 'world-grade-4',
        grade: 4,
        order: 5,
        title: 'CPU si Otak Pintar',
        subtitle: 'Terkunci',
        description: 'Pelajari unit pemroses sentral yang mengolah semua perintah kode.',
        icon: 'memory',
        status: 'locked',
        rewardXp: 180,
        rewardStars: 3,
        rewardCoins: 50,
        skillsGained: ['Pemrosesan Data', 'Alur Logika'],
        lesson: {
          id: 'les-g4-1-5',
          title: 'CPU: Otak Pengolah Data',
          chapterTitle: 'Pulau Perangkat Digital',
          mainConceptTitle: 'Bagaimana Komputer Berpikir?',
          mainConceptText: 'CPU (Central Processing Unit) menerima perintah dari keyboard dan mouse, lalu menghitung hasilnya dalam sekejap!',
          highlightWords: ['CPU', 'menghitung', 'memproses'],
          narrationText: 'CPU bekerja tanpa henti seperti komandan pintar yang mengatur jalannya semua program!',
          illustrationUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXfX-EnpbG-SugqEc4yTw41rw0F9GLMR-xFCmXHGV-bnlt6PefBaQfwwmmnhuW9qhMl8D2BPGJHgtMLjdy55czcyokupGuMtPJfkIE9kVvPFUEPYkfeS00_Oy2oP1sWg5oLE5bOxi7Ol8otM0sSg4nlJ_9VhZKlAzafFQNG3to6rb_WaOroiEZSwKe4iiOaGUiVksEb7ncAH06d3KtTBJs-Zn4ELO3sHEKU0fevfTO9fm_uprsg-vK',
          realLifeExample: {
            title: 'Koki di Dapur Restoran',
            description: 'Koki menerima pesanan bahan (input), memasak dengan cepat (proses), dan menyajikan makanan lezat (output).',
            icon: 'chef'
          },
          kobiNote: 'Selesaikan misi perangkat keras sebelumnya untuk membuka misi ini!',
          activities: []
        }
      }
    ]
  },
  {
    id: 'ch-g4-2',
    worldId: 'world-grade-4',
    grade: 4,
    chapterNumber: 2,
    title: 'Labirin Blok Perulangan',
    subtitle: 'Bab 2 • Algoritma Cerdas',
    description: 'Menyusun perintah berulang (Loop 4x) agar Kobi tidak lelah menulis kode berulang kali.',
    missions: [
      {
        id: 'm-g4-c2-m1',
        chapterId: 'ch-g4-2',
        worldId: 'world-grade-4',
        grade: 4,
        order: 1,
        title: 'Kobi Mencari Baterai',
        subtitle: 'Labirin Grid',
        description: 'Tuntun Kobi melintasi labirin untuk mengambil baterai dan mencapai garis finish.',
        icon: 'battery_charging_full',
        status: 'unstarted',
        rewardXp: 120,
        rewardStars: 3,
        rewardCoins: 40,
        skillsGained: ['Algoritma Berurutan', 'Navigasi Grid'],
        lesson: {
          id: 'les-g4-2-1',
          title: 'Algoritma Labirin: Langkah Demi Langkah',
          chapterTitle: 'Labirin Blok Perulangan',
          mainConceptTitle: 'Instruksi Arah Terarah',
          mainConceptText: 'Robot hanya bergerak jika diberi instruksi pasti: Maju 1 langkah, Belok Kanan, Belok Kiri, atau Lompat.',
          highlightWords: ['Maju', 'Belok Kanan', 'Belok Kiri', 'Instruksi Pasti'],
          narrationText: 'Yuk bantu Kobi bergerak di kotak labirin menuju baterai energi!',
          illustrationUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZfOXbRnQKoKo0HynidiS9N6JQRUWnjSrY9q1oSGynItkZ52S1XsBPtg5iVccSYohBMOYoStqSTHOXu68XCsgJp7gYhRYvsqpjRq-IlsLE9vYjZZlKWNuZDnH3DbiRwKQ_ScluqBQ_AuURDE8OK-hdsiIsgVPr_9UJXTIYN2_2IEiTPmuAKp8RiPy4nj5sQRpB1Vbbf6b1afv7yLdjmCl3cA0ml4SNFhE7UMJ1UnWGK2pcjhlzWCNH',
          realLifeExample: {
            title: 'Petunjuk Arah Jalan',
            description: 'Seperti saat kamu memberi petunjuk arah rumahmu kepada teman.',
            icon: 'map-pin'
          },
          kobiNote: 'Pilih urutan tombol langkah agar Kobi sampai ke tujuan!',
          activities: [
            {
              id: 'act-g4-2-1-maze',
              type: 'algorithm_maze',
              title: 'Labirin Kobi Pengumpul Baterai',
              instruction: 'Susun tombol aksi [Maju], [Belok Kiri], [Belok Kanan] lalu tekan Jalankan!',
              kobiPrompt: 'Bantu aku berjalan ke baterai lalu ke gerbang emas!',
              kobiHints: [
                'Maju 2 langkah ke depan terlebih dahulu.',
                'Lalu belok kanan ke arah baterai.',
                'Ambil baterai dan maju ke gerbang hijau.'
              ],
              mazeData: {
                gridSize: 4,
                start: { x: 0, y: 0, dir: 'right' },
                goal: { x: 3, y: 3 },
                walls: [{ x: 1, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }],
                collectibles: [{ x: 2, y: 0, id: 'bat1' }],
                maxCommands: 8
              }
            }
          ]
        }
      }
    ]
  }
];

export const DAILY_MISSIONS: DailyMission[] = [
  {
    id: 'dm-1',
    title: 'Login Harian',
    description: 'Masuk ke CodeNusa hari ini.',
    icon: 'check_circle',
    rewardStars: 10,
    rewardCoins: 15,
    isCompleted: true,
    progress: 1,
    maxProgress: 1,
    actionUrl: '/beranda'
  },
  {
    id: 'dm-2',
    title: 'Baca 1 Materi',
    description: 'Selesaikan satu bacaan teori.',
    icon: 'menu_book',
    rewardStars: 20,
    rewardCoins: 25,
    isCompleted: false,
    progress: 0,
    maxProgress: 1,
    actionUrl: '/materi/m-g4-c1-m4'
  },
  {
    id: 'dm-3',
    title: 'Main Puzzle',
    description: 'Susun 1 blok kode puzzle.',
    icon: 'extension',
    rewardStars: 50,
    rewardCoins: 50,
    isCompleted: false,
    progress: 0,
    maxProgress: 1,
    actionUrl: '/studio'
  },
  {
    id: 'dm-4',
    title: 'Kuis Rahasia',
    description: 'Selesaikan materi hari ini dulu.',
    icon: 'lock',
    rewardStars: 0,
    rewardCoins: 0,
    isCompleted: false,
    progress: 0,
    maxProgress: 1,
    actionUrl: '/petualangan'
  }
];

export const CODE_BLOCK_TEMPLATES: CodeBlockTemplate[] = [
  // Motion
  {
    id: 'blk-move',
    opcode: 'motion_movesteps',
    category: 'motion',
    name: 'gerak [STEPS] langkah',
    color: '#0058be',
    borderColor: '#004395',
    shape: 'notch',
    inputs: [
      { name: 'STEPS', type: 'number', defaultValue: 10 }
    ],
    defaultParams: { STEPS: 10 },
    codeSnippet: 'sprite.move(STEPS);'
  },
  {
    id: 'blk-turn-right',
    opcode: 'motion_turnright',
    category: 'motion',
    name: 'putar ↻ [DEGREES] derajat',
    color: '#0058be',
    borderColor: '#004395',
    shape: 'notch',
    inputs: [
      { name: 'DEGREES', type: 'number', defaultValue: 15 }
    ],
    defaultParams: { DEGREES: 15 },
    codeSnippet: 'sprite.turn(DEGREES);'
  },
  {
    id: 'blk-turn-left',
    opcode: 'motion_turnleft',
    category: 'motion',
    name: 'putar ↺ [DEGREES] derajat',
    color: '#0058be',
    borderColor: '#004395',
    shape: 'notch',
    inputs: [
      { name: 'DEGREES', type: 'number', defaultValue: 15 }
    ],
    defaultParams: { DEGREES: 15 },
    codeSnippet: 'sprite.turn(-DEGREES);'
  },
  {
    id: 'blk-goto-xy',
    opcode: 'motion_gotoxy',
    category: 'motion',
    name: 'pergi ke x: [X] y: [Y]',
    color: '#0058be',
    borderColor: '#004395',
    shape: 'notch',
    inputs: [
      { name: 'X', type: 'number', defaultValue: 0 },
      { name: 'Y', type: 'number', defaultValue: 0 }
    ],
    defaultParams: { X: 0, Y: 0 },
    codeSnippet: 'sprite.setPosition(X, Y);'
  },

  // Looks
  {
    id: 'blk-say-for-sec',
    opcode: 'looks_sayforsecs',
    category: 'looks',
    name: 'katakan [MESSAGE] selama [SECS] detik',
    color: '#6b38d4',
    borderColor: '#5516be',
    shape: 'notch',
    inputs: [
      { name: 'MESSAGE', type: 'text', defaultValue: 'Halo Teman-Teman!' },
      { name: 'SECS', type: 'number', defaultValue: 2 }
    ],
    defaultParams: { MESSAGE: 'Halo Teman-Teman!', SECS: 2 },
    codeSnippet: 'sprite.say(MESSAGE, SECS);'
  },
  {
    id: 'blk-change-size',
    opcode: 'looks_changesizeby',
    category: 'looks',
    name: 'ubah ukuran sebesar [SIZE]',
    color: '#6b38d4',
    borderColor: '#5516be',
    shape: 'notch',
    inputs: [
      { name: 'SIZE', type: 'number', defaultValue: 10 }
    ],
    defaultParams: { SIZE: 10 },
    codeSnippet: 'sprite.changeSize(SIZE);'
  },

  // Sound
  {
    id: 'blk-play-sound',
    opcode: 'sound_play',
    category: 'sound',
    name: 'mainkan suara [SOUND]',
    color: '#00855b',
    borderColor: '#005236',
    shape: 'notch',
    inputs: [
      { name: 'SOUND', type: 'select', defaultValue: 'Chime Sukses', options: ['Chime Sukses', 'Koin Emas', 'Robot Kobi', 'Meow'] }
    ],
    defaultParams: { SOUND: 'Chime Sukses' },
    codeSnippet: 'audio.play(SOUND);'
  },

  // Events
  {
    id: 'blk-when-flag-clicked',
    opcode: 'event_whenflagclicked',
    category: 'events',
    name: 'ketika ⚑ diklik',
    color: '#f59e0b',
    borderColor: '#d97706',
    shape: 'cap',
    inputs: [],
    defaultParams: {},
    codeSnippet: 'onStart(() => {'
  },

  // Control / Loops
  {
    id: 'blk-repeat',
    opcode: 'control_repeat',
    category: 'control',
    name: 'ulangi [TIMES] kali',
    color: '#ea580c',
    borderColor: '#c2410c',
    shape: 'c-block',
    inputs: [
      { name: 'TIMES', type: 'number', defaultValue: 4 }
    ],
    defaultParams: { TIMES: 4 },
    codeSnippet: 'for(let i=0; i<TIMES; i++) {'
  },
  {
    id: 'blk-wait',
    opcode: 'control_wait',
    category: 'control',
    name: 'tunggu [SECS] detik',
    color: '#ea580c',
    borderColor: '#c2410c',
    shape: 'notch',
    inputs: [
      { name: 'SECS', type: 'number', defaultValue: 1 }
    ],
    defaultParams: { SECS: 1 },
    codeSnippet: 'await sleep(SECS);'
  }
];

export const BADGES_DATA: Badge[] = [
  {
    id: 'badge-hardware-master',
    title: 'Master Perangkat Keras',
    subtitle: 'Hardware Specialist',
    description: 'Berhasil mengenali semua komponen fisik komputer dan fungsi utamanya.',
    icon: 'military_tech',
    color: '#FFD700',
    category: 'hardware',
    rarity: 'gold',
    requiredXp: 500
  },
  {
    id: 'badge-first-code',
    title: 'Langkah Pertama Coder',
    subtitle: 'Hello CodeNusa',
    description: 'Menyelesaikan misi perkenalan pertama di pulau petualangan.',
    icon: 'rocket_launch',
    color: '#4edea3',
    category: 'coding',
    rarity: 'bronze',
    requiredXp: 50
  },
  {
    id: 'badge-logic-pioneer',
    title: 'Pelopor Logika',
    subtitle: 'Pattern Thinker',
    description: 'Menemukan pola urutan dan menyusun algoritma terarah tanpa kesalahan.',
    icon: 'psychology',
    color: '#8455ef',
    category: 'logic',
    rarity: 'silver',
    requiredXp: 800
  },
  {
    id: 'badge-streak-3',
    title: 'Api Semangat 3 Hari',
    subtitle: '3-Day Streak',
    description: 'Belajar dan login di CodeNusa selama 3 hari berturut-turut.',
    icon: 'local_fire_department',
    color: '#f97316',
    category: 'streak',
    rarity: 'bronze',
    requiredXp: 200
  },
  {
    id: 'badge-streak-7',
    title: 'Api Pembelajar Sepekan',
    subtitle: '7-Day Streak Master',
    description: 'Belajar konsisten selama 7 hari berturut-turut tanpa terputus.',
    icon: 'local_fire_department',
    color: '#ea580c',
    category: 'streak',
    rarity: 'silver',
    requiredXp: 500
  },
  {
    id: 'badge-streak-14',
    title: 'Pendekar Informatika 14 Hari',
    subtitle: '14-Day Coding Champion',
    description: 'Menjaga streak belajar selama 14 hari penuh di CodeNusa.',
    icon: 'local_fire_department',
    color: '#dc2626',
    category: 'streak',
    rarity: 'gold',
    requiredXp: 1000
  },
  {
    id: 'badge-loop-wizard',
    title: 'Penyihir Perulangan',
    subtitle: 'Loop Master',
    description: 'Menguasai blok perulangan dan membuat animasi berputar tanpa henti.',
    icon: 'autorenew',
    color: '#0058be',
    category: 'coding',
    rarity: 'gold',
    requiredXp: 1200
  },
  {
    id: 'badge-ai-explorer',
    title: 'Penjelajah Kecerdasan Buatan',
    subtitle: 'AI Visionary',
    description: 'Mengenal konsep machine learning sederhana dan etika teknologi digital.',
    icon: 'sparkles',
    color: '#06b6d4',
    category: 'mastery',
    rarity: 'diamond',
    requiredXp: 2500
  }
];

export const TEACHER_STUDENTS: TeacherStudentProgress[] = [
  {
    id: 'user-raka',
    name: 'Raka Pratama',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5-LBB1VegifWDRWAvniulyAt3Xc1t1oH6rYn0DwtraSPv3v4NDNq-efVEZkF1GbAcUq6B5bqe2aAX4yKL0vBPj2iNEB3CPkb4A_r73AQOv0Ja8KJx_GeRaS3CZgTE-t7Nl14OG0LxX2KC0BB0ZB7wEql2ZfFn0jPxWqWytNf4OQnGSav8fLQOx9duBdzEq4rHBKP4NNayW_Pfu6ZburdvcNXVrQi6RgBaISPA0VuCkdS8KWa5eR0h',
    grade: 4,
    completedMissionsCount: 3,
    totalMissions: 5,
    stars: 120,
    lastActive: 'Hari ini, 09:15',
    averageScore: 98,
    needsHelp: false,
    recentProject: 'Kobi Menari Ceria',
    notes: 'Pemahaman konsep perangkat keras dan arah sangat cepat.'
  },
  {
    id: 'stu-dina',
    name: 'Dina Anindya',
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
    grade: 4,
    completedMissionsCount: 4,
    totalMissions: 5,
    stars: 145,
    lastActive: 'Hari ini, 10:02',
    averageScore: 95,
    needsHelp: false,
    recentProject: 'Panggung Bintang',
    notes: 'Sangat aktif dalam kuis bergambar.'
  },
  {
    id: 'stu-fajar',
    name: 'Fajar Nugraha',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    grade: 4,
    completedMissionsCount: 1,
    totalMissions: 5,
    stars: 35,
    lastActive: '3 hari lalu',
    averageScore: 68,
    needsHelp: true,
    helpTopic: 'Labirin Perulangan (Loop)',
    recentProject: 'Gerak Maju',
    notes: 'Memerlukan bimbingan pada konsep belok kanan vs belok kiri di grid.'
  },
  {
    id: 'stu-citra',
    name: 'Citra Kirana',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    grade: 4,
    completedMissionsCount: 2,
    totalMissions: 5,
    stars: 70,
    lastActive: 'Kemarin',
    averageScore: 82,
    needsHelp: false,
    recentProject: 'Tebak Huruf',
    notes: 'Progres stabil.'
  }
];

import { INITIAL_CLASSES } from './classData';
export { INITIAL_CLASSES };
export const CLASSROOMS_DATA: Classroom[] = INITIAL_CLASSES;

export const GLOBAL_LEADERBOARD_STUDENTS: LeaderboardStudent[] = [
  {
    id: 'lb-1',
    name: 'Nadia Azzahra',
    username: 'nadia_code_queen',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    grade: 5,
    school: 'SD Bintang Cendekia Bandung',
    stars: 340,
    monthlyStars: 85,
    weeklyStars: 28,
    xp: 6800,
    level: 22,
    streakDays: 14,
    badgesCount: 8,
    favoriteTopic: 'Game Dev & Logika Loop',
    cheerCount: 42
  },
  {
    id: 'lb-2',
    name: 'Kenzo Alvaro',
    username: 'kenzo_robotika',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    grade: 6,
    school: 'SD Harapan Bangsa Surabaya',
    stars: 315,
    monthlyStars: 78,
    weeklyStars: 24,
    xp: 6200,
    level: 20,
    streakDays: 11,
    badgesCount: 7,
    favoriteTopic: 'Kecerdasan Buatan (AI)',
    cheerCount: 35
  },
  {
    id: 'lb-3',
    name: 'Budi Santoso',
    username: 'budi_master',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    grade: 6,
    school: 'SD Harapan Nusantara',
    stars: 260,
    monthlyStars: 62,
    weeklyStars: 21,
    xp: 5120,
    level: 18,
    streakDays: 7,
    badgesCount: 6,
    favoriteTopic: 'Perangkat Keras & Jaringan',
    cheerCount: 29
  },
  {
    id: 'lb-4',
    name: 'Zahra Putri Ramadhani',
    username: 'zahra_pixel',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    grade: 4,
    school: 'SD Merdeka Belajar Jakarta',
    stars: 235,
    monthlyStars: 58,
    weeklyStars: 19,
    xp: 4800,
    level: 16,
    streakDays: 9,
    badgesCount: 5,
    favoriteTopic: 'Animasi & CODESign',
    cheerCount: 22
  },
  {
    id: 'lb-5',
    name: 'Dina Anindya',
    username: 'dina_anindya',
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
    grade: 4,
    school: 'SD Harapan Nusantara',
    stars: 185,
    monthlyStars: 46,
    weeklyStars: 16,
    xp: 3750,
    level: 14,
    streakDays: 5,
    badgesCount: 4,
    favoriteTopic: 'Blok Visual & Loop',
    cheerCount: 18
  },
  {
    id: 'lb-6',
    name: 'Alif Kurniawan',
    username: 'alif_explorer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    grade: 3,
    school: 'SD Nusa Bangsa Yogyakarta',
    stars: 165,
    monthlyStars: 42,
    weeklyStars: 15,
    xp: 3300,
    level: 13,
    streakDays: 6,
    badgesCount: 4,
    favoriteTopic: 'Pola Algoritma & Arah',
    cheerCount: 15
  },
  {
    id: 'lb-7',
    name: 'Siti Rahmawati',
    username: 'rahma_smart',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    grade: 5,
    school: 'SD Pertiwi Denpasar',
    stars: 150,
    monthlyStars: 39,
    weeklyStars: 12,
    xp: 3050,
    level: 12,
    streakDays: 4,
    badgesCount: 3,
    favoriteTopic: 'Etika Digital & Internet',
    cheerCount: 14
  },
  {
    id: 'lb-8',
    name: 'Dimas Aditya',
    username: 'dimas_coder',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    grade: 4,
    school: 'SD Tunas Harapan Medan',
    stars: 135,
    monthlyStars: 34,
    weeklyStars: 10,
    xp: 2900,
    level: 11,
    streakDays: 4,
    badgesCount: 3,
    favoriteTopic: 'Studio Coding Proyek',
    cheerCount: 11
  },
  {
    id: 'lb-9',
    name: 'Citra Kirana',
    username: 'citra_k',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    grade: 4,
    school: 'SD Harapan Nusantara',
    stars: 110,
    monthlyStars: 28,
    weeklyStars: 9,
    xp: 2400,
    level: 10,
    streakDays: 3,
    badgesCount: 2,
    favoriteTopic: 'Perangkat Keras',
    cheerCount: 8
  },
  {
    id: 'lb-10',
    name: 'Fauzan Malik',
    username: 'fauzan_m',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    grade: 2,
    school: 'SD Cendana Makassar',
    stars: 95,
    monthlyStars: 24,
    weeklyStars: 8,
    xp: 1950,
    level: 8,
    streakDays: 3,
    badgesCount: 2,
    favoriteTopic: 'Navigasi Robot Kobi',
    cheerCount: 9
  },
  {
    id: 'lb-11',
    name: 'Alya Salsabila',
    username: 'alya_bintang',
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
    grade: 1,
    school: 'SD Harapan Nusantara',
    stars: 65,
    monthlyStars: 18,
    weeklyStars: 6,
    xp: 1200,
    level: 5,
    streakDays: 2,
    badgesCount: 2,
    favoriteTopic: 'Bentuk & Warna Komputer',
    cheerCount: 7
  },
  {
    id: 'lb-12',
    name: 'Fajar Nugraha',
    username: 'fajar_n',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    grade: 4,
    school: 'SD Harapan Nusantara',
    stars: 45,
    monthlyStars: 12,
    weeklyStars: 4,
    xp: 900,
    level: 4,
    streakDays: 1,
    badgesCount: 1,
    favoriteTopic: 'Arah dan Gerak Kobi',
    cheerCount: 5
  }
];
