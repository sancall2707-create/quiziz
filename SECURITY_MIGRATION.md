# CodeNusa Security Migration Guide

## Overview

This document describes the security architecture after the Firebase auth overhaul, the Cloud Functions created, the Firestore/Storage rules, the migration procedure, and the deployment steps you must perform.

---

## Arsitektur Autentikasi (Post-Fix)

| Aspek | Sebelum | Sesudah |
|---|---|---|
| Sumber status login | `localStorage` (`codenusa_auth_session_v1`) | Firebase Auth `onAuthStateChanged` |
| Verifikasi password | Hash SHA-256 lokal + Firebase Auth fallback | Firebase Auth saja |
| Penyimpanan password | `passwordHash` di Firestore, localStorage, source | **Tidak ada** — Firebase Auth mengelola kredensial |
| Sumber role | Field `role` di dokumen Firestore (dapat dimanipulasi klien) | Firebase custom claims (`request.auth.token.role`) |
| Profile lookup | Fallback ke `allUsers[0]` atau akun admin | Fetch by Firebase UID; error jika tidak ditemukan |
| Membuka dashboard admin | Edit `localStorage` cukup | Tidak mungkin — role dari custom claims |
| Update XP/stars/coins | `setDoc` langsung dari klien | Cloud Function `submitProgress` (Admin SDK) |

### Alur Login
1. User memasukkan username + password
2. Frontend konstruksi email internal: `username@siswa.codenusa.internal`
3. Firebase Auth `signInWithEmailAndPassword` memverifikasi kredensial
4. `onAuthStateChanged` memicu → ambil `getIdTokenResult()` untuk custom claims (role)
5. Fetch profil Firestore `users/{uid}` — jika tidak ada, tampilkan error dan sign out (tidak ada fallback)
6. `authLoading = false` → redirect ke dashboard sesuai role terpercaya

### Alur Registrasi Siswa
1. Validasi form (username, password min 8, grade)
2. `createUserWithEmailAndPassword(auth, internalEmail, password)` — Firebase Auth membuat akun
3. Firestore `users/{uid}` dibuat oleh klien (rules mengizinkan create untuk diri sendiri dengan role=student)
4. Cloud Function `onUserCreate` (auth trigger) menetapkan custom claim `role: 'student'`
5. `onAuthStateChanged` memicu → login otomatis

### Role Terpercaya
- **Student**: claim `role: 'student'` (ditetapkan oleh `onUserCreate` trigger) atau `null` (default)
- **Teacher**: claim `role: 'teacher'` (ditetapkan oleh Cloud Function `createStaffAccount`)
- **Admin**: claim `role: 'admin'` (ditetapkan oleh Cloud Function `createStaffAccount`)
- Role **TIDAK** pernah dipercaya dari field `role` di dokumen Firestore, form, state React, atau localStorage

---

## File yang Diubah

### Kode Frontend
| File | Perubahan |
|---|---|
| `src/services/authService.ts` | **Ditulis ulang sepenuhnya** — hapus `hashPassword`, `getAuthSession`, `setAuthSession`, `clearAuthSession`, `getAuthRegistry`, `saveAuthUser`, `validateCredentials`, `changeUserPassword`, `isPasswordChangeRequired`, `SEEDED_AUTH_ACCOUNTS`. Tambah `signInWithIdentifier`, `changeCurrentUserPassword`, `signOutUser`. `registerStudentFirebase` tidak lagi menyimpan `passwordHash`. |
| `src/context/AppContext.tsx` | **Ditulis ulang sepenuhnya** — `onAuthStateChanged` sebagai sumber login, `authLoading`/`authError`, role dari custom claims, hapus `DEMO_USER_IDS`, `switchUser`, `CURRENT_USER_KEY`, seeding `INITIAL_SYSTEM_USERS`. Progress writes (XP, stars, coins, badges, streak) melalui Cloud Function `submitProgress`. |
| `src/lib/firebase.ts` | Tambah `getFunctions` → `export const functions`. |
| `src/types.ts` | Tambah `mustChangePassword?: boolean` ke interface `User`. |
| `src/App.tsx` | Tambah `AuthLoadingScreen` dan `AuthErrorScreen` — mencegah redirect/flash sebelum Firebase selesai memeriksa sesi. |
| `src/components/layout/RoleGuard.tsx` | Tambah `authLoading` check — spinner saat auth belum selesai. |
| `src/components/layout/Header.tsx` | Hapus `switchUser` dan `handleSwitchAccount` (tidak aman — bisa switch ke user lain tanpa auth). |
| `src/utils/imageUpload.ts` | Ubah path upload dari `avatars/{userId}_{ts}.jpg` → `avatars/{userId}/{ts}.jpg` (cocok dengan storage rules). |
| `src/data/mockData.ts` | Tidak diubah — `INITIAL_SYSTEM_USERS` tetap untuk referensi tapi tidak lagi digunakan untuk auth fallback. |
| `vite.config.ts` | Tambah `allowedHosts: true` untuk preview hostname. |
| `tsconfig.json` | Exclude `functions/`, `scripts/` dari root type check. |

### Security Rules
| File | Perubahan |
|---|---|
| `firestore.rules` | **Ditulis ulang** — deny-by-default, role-based via custom claims, validasi field, tolak `passwordHash`. |
| `storage.rules` | **Baru** — avatar-only, login required, MIME image only, max 2 MB, owner-only write. |

### Cloud Functions (baru)
| File | Perubahan |
|---|---|
| `functions/package.json` | Dependencies: `firebase-admin`, `firebase-functions`. |
| `functions/tsconfig.json` | TypeScript config untuk Cloud Functions. |
| `functions/src/index.ts` | 5 Cloud Functions (lihat di bawah). |

### Deployment & Migration
| File | Perubahan |
|---|---|
| `firebase.json` | Config untuk deploy rules + functions. |
| `scripts/migrate-accounts.ts` | Script migrasi one-time: buat akun admin/guru, set claims, hapus `passwordHash`. |

---

## Firestore Rules (Final)

Lihat `firestore.rules`. Ringkasan:

- **Deny-by-default** — `match /{document=**} { allow read, write: if false; }`
- **users/{userId}**:
  - READ: own profile, admin (all), teacher (all students)
  - CREATE: student creates own doc on registration (role must be 'student', no passwordHash)
  - UPDATE (self): only `name, fullName, nickname, displayName, avatar*, bio, settings, kobiCustomization, kobiPosition, mustChangePassword` — **BLOK** role, xp, level, stars, coins, badges, grade, classId, username, email
  - UPDATE (admin): any user doc (no passwordHash)
  - DELETE: admin only
- **assignments/{assignmentId}**:
  - READ: all authenticated
  - CREATE: staff only, `createdBy.uid` must match caller
  - UPDATE: staff only
  - DELETE: staff, creator or admin
- **classes/{classId}**:
  - READ: admin, teacher (assigned), student (own class)
  - WRITE: admin only

## Storage Rules (Final)

Lihat `storage.rules`. Ringkasan:

- `avatars/{userId}/{fileName}`: read public, write owner-only (auth.uid == userId), image MIME only, max 2 MB
- Everything else: deny

---

## Cloud Functions yang Dibuat

| Function | Tipe | Akses | Fungsi |
|---|---|---|---|
| `setStudentClaimOnCreate` | Auth trigger (`onUserCreate`) | Otomatis | Set custom claim `role: 'student'` untuk setiap user baru |
| `submitProgress` | Callable | Login required | Tulis field terproteksi (xp, stars, coins, level, badges, streak, grade) — bypass rules via Admin SDK |
| `createStaffAccount` | Callable | **Admin only** | Buat akun admin/teacher + set custom claims + buat profil Firestore |
| `setUserRole` | Callable | **Admin only** | Ubah role user via custom claims |
| `disableUser` | Callable | **Admin only** | Nonaktifkan akun di Firebase Auth |

---

## Langkah Deployment (URUTAN WAJIB)

### 1. Deploy Cloud Functions
```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### 2. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 3. Deploy Storage Rules
```bash
firebase deploy --only storage:rules
```

### 4. Jalankan Migrasi Akun Admin/Guru
```bash
# Download service account key dari Firebase Console:
# Project Settings → Service Accounts → Generate new private key
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"

# Install firebase-admin di root (sementara)
npm install firebase-admin

# Jalankan script migrasi
npx ts-node scripts/migrate-accounts.ts
# Script akan meminta password untuk akun admin dan teacher secara interaktif
```

**Migrasi melakukan:**
1. Buat akun Firebase Auth untuk admin (`wijaya_admin`) dan teacher (`wijaya_guru`)
2. Set custom claims (`role: 'admin'`, `role: 'teacher'`)
3. Buat profil Firestore dengan UID asli
4. Hapus dokumen lama dengan ID palsu (`user-admin-wijaya`, `user-teacher-wijaya`)
5. Hapus field `passwordHash` dari SEMUA dokumen user
6. Set `mustChangePassword: true` — admin/guru wajib ganti password saat pertama login

### 5. Verifikasi
- Login sebagai admin dengan username `wijaya_admin` + password yang baru
- Login sebagai teacher dengan username `wijaya_guru` + password yang baru
- Registrasi siswa baru — harus masuk ke `/student/home`
- Logout — harus kembali ke `/login`

---

## Pengujian yang Diverifikasi

| Test | Status |
|---|---|
| `npm run lint` (`tsc --noEmit`) | ✅ Pass — 0 error |
| `npm run build` (`vite build`) | ✅ Pass — built in 5.25s |
| App render (login page) | ✅ Pass — loading screen → redirect ke `/login` |
| Console errors | ✅ Pass — tidak ada error runtime |
| Edit localStorage tidak buka dashboard admin | ✅ (arsitektur) — `onAuthStateChanged` adalah sumber tunggal, localStorage tidak dibaca untuk auth |
| Logout Firebase menutup route | ✅ (arsitektur) — `signOut(auth)` → `onAuthStateChanged` → `isAuthenticated = false` → RoleGuard redirect |
| Tidak ada `passwordHash` di kode baru | ✅ — dihapus dari authService, AppContext, dan rules menolak field |
| Login setiap role | ⏳ Memerlukan deployment Cloud Functions + migrasi akun |
| Rules memblokir akses | ⏳ Memerlukan deployment rules |

---

## Risiko & Pekerjaan Manual Tersisa

1. **Cloud Functions belum dideploy** — progress tracking (XP, stars, coins) tidak persist ke Firestore sampai `submitProgress` dideploy. Local state tetap update (optimistic), tapi tidak tersimpan di server.

2. **Akun admin/teacher belum dibuat** — akun lama (`user-admin-wijaya`, `user-teacher-wijaya`) menggunakan hash password lokal yang sudah dihapus. Akun baru harus dibuat via migrasi script atau Cloud Function `createStaffAccount`.

3. **Leaderboard siswa** — siswa hanya bisa baca profil sendiri (rules). Leaderboard menampilkan data mock (`GLOBAL_LEADERBOARD_STUDENTS`) + diri sendiri. Untuk leaderboard penuh, buat Cloud Function `getLeaderboard` yang agregasi data publik siswa.

4. **Teacher class filtering** — saat ini teacher bisa baca semua siswa. Untuk membatasi ke kelas tertentu, tambahkan `teacherClassIds` ke custom claims dan update rules.

5. **Region Cloud Functions** — kode menggunakan region default (`us-central1`). Ubah di `src/lib/firebase.ts` (`getFunctions(app, 'asia-southeast1')`) dan `functions/src/index.ts` jika diperlukan.

6. **Service account key** — jangan pernah simpan di repository. Hanya gunakan via `GOOGLE_APPLICATION_CREDENTIALS` environment variable.
