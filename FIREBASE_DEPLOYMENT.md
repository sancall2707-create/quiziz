# FIREBASE DEPLOYMENT — CodeNusa Security

Dokumentasi deployment dan pengujian keamanan Firebase CodeNusa.
Semua command diutamakan untuk **Windows PowerShell**.

---

## A. Persiapan

### 1. Install Firebase CLI (jika belum)

```powershell
npm install -g firebase-tools
```

### 2. Login Firebase

```powershell
firebase login
```

### 3. Verifikasi project aktif

```powershell
firebase projects:list
firebase use
```

Project yang harus aktif: `copper-yew-zt8c4`

Jika belum aktif:

```powershell
firebase use copper-yew-zt8c4
```

### 4. Install dependencies Cloud Functions

```powershell
cd functions
npm install
cd ..
```

### 5. Install dependencies test (rules-unit-testing)

```powershell
npm install
```

---

## B. Pre-Flight Check

Sebelum deployment, jalankan pre-flight untuk memverifikasi semua siap:

```powershell
npm run firebase:preflight
```

Pre-flight memeriksa:
- Firebase CLI tersedia dan terautentikasi
- Project aktif sesuai `copper-yew-zt8c4`
- `.firebaserc`, `firebase.json` tersedia dan valid
- `firestore.rules`, `firestore.indexes.json`, `storage.rules` tersedia
- `functions/node_modules` tersedia
- Cloud Functions build berhasil

**Jika ada error: perbaiki sebelum lanjut.**

---

## C. Deployment

### Otomatis (recommended)

```powershell
npm run firebase:deploy:security
```

Script ini menjalankan deployment dalam urutan aman:
1. Pre-flight check
2. Build Cloud Functions
3. Deploy Cloud Functions
4. Deploy Firestore Rules
5. Deploy Firestore Indexes
6. Deploy Storage Rules

**Jika satu tahap gagal, deployment berhenti.**

### Manual (step-by-step)

```powershell
cd functions
npm run build
cd ..

firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
```

---

## D. Migration Teacher

Existing teacher belum memiliki `teacherClassIds` di custom claims.
Setelah deploy rules baru, teacher tanpa `teacherClassIds` tidak dapat melihat siswa apapun.

### Dry-Run (cek dulu tanpa perubahan)

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"
npm run firebase:migrate -- --dry-run
```

### Assign class kosong untuk semua teacher (aman, tidak menebak kelas)

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"
npm run firebase:migrate
```

### Assign class spesifik untuk teacher tertentu

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"
npm run firebase:migrate -- --uid=TEACHER_UID --class-ids=cls-4a,cls-4b
```

### Assign class yang sama untuk semua teacher

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"
npm run firebase:migrate -- --class-ids=cls-4a,cls-4b
```

**Service account JSON** dapat diperoleh dari:
Firebase Console → Project Settings → Service Accounts → Generate New Private Key

**Jangan menyimpan service account di repository.**

---

## E. Runtime Security Test

### 1. Firestore Rules Test (via Emulator)

Prerequisites: Java 11+ terinstall.

```powershell
# Install Java jika belum (Windows)
# winget install Microsoft.OpenJDK.21

# Jalankan test via emulator
npx firebase emulators:exec "node scripts/test/firestore-rules.test.js"
```

Test meliputi:
- Student: read own profile, edit role/xp/stars/coins/classId/claimedChallenges (DENY), read other student (DENY)
- Teacher: read student di kelas sendiri (ALLOW), read kelas lain (DENY), edit student (DENY)
- Admin: read/update any user (ALLOW), password field (DENY)
- Unauthenticated: semua DENY

### 2. Storage Rules Test (via Emulator)

```powershell
npx firebase emulators:exec "node scripts/test/storage-rules.test.js"
```

### 3. Cloud Functions Security Test (via Deployed Firebase)

Setelah deployment, buat akun test terlebih dahulu via admin panel.

Set environment variables:

```powershell
$env:TEST_STUDENT_EMAIL="teststudent@siswa.codenusa.internal"
$env:TEST_STUDENT_PASSWORD="TestPass123!"
$env:TEST_TEACHER_EMAIL="testteacher@siswa.codenusa.internal"
$env:TEST_TEACHER_PASSWORD="TestPass123!"
$env:TEST_ADMIN_EMAIL="testadmin@siswa.codenusa.internal"
$env:TEST_ADMIN_PASSWORD="TestPass123!"
```

Jalankan:

```powershell
npm run firebase:test:security
```

Test meliputi:
- Unauthenticated: semua callable functions → DENY
- Student: fake xpEarned/userId → ignored, invalid mission → not-found, createStaffAccount/setUserRole/disableUser → DENY
- Teacher: createStaffAccount/setUserRole/disableUser → DENY
- Admin: submitProgress → ALLOW, self-disable → DENY

---

## F. Rollback / Troubleshooting

### Rollback Rules ke versi sebelumnya

```powershell
# Lihat history deploy
firebase deploy:history

# Deploy rules dari file backup
firebase deploy --only firestore:rules
```

### Jika beforeUserCreated tidak berjalan

1. Pastikan Identity Platform aktif:
   Firebase Console → Authentication → Settings → Identity Platform

2. Jika belum aktif, aktifkan ( gratis untuk standard auth)

3. Redeploy functions:
   ```powershell
   firebase deploy --only functions
   ```

### Jika teacher tidak bisa melihat siswa setelah deploy

1. Jalankan migration:
   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"
   npm run firebase:migrate -- --dry-run
   ```

2. Assign class via admin panel atau:
   ```powershell
   npm run firebase:migrate -- --uid=TEACHER_UID --class-ids=cls-4a,cls-4b
   ```

3. Teacher harus logout dan login ulang agar custom claim baru terbaca.

### Jika student tidak bisa login setelah register

1. Cek Firebase Console → Functions → Logs untuk error `setStudentClaimOnCreate`
2. Pastikan blocking function deployed di region `us-central1`
3. Jika Identity Platform belum aktif, claim tidak akan ter-set
4. Sebagai fallback: gunakan `setUserRole` via admin untuk set role manual

---

## G. Verifikasi Manual

Setelah deployment, lakukan verifikasi manual:

1. **Register student baru** → cek Firebase Console → Authentication, pastikan user ada
2. **Login student** → cek custom claims via token (di console)
3. **Buka /admin sebagai student** → harus redirect
4. **Buka /teacher sebagai student** → harus redirect
5. **Login admin** → create teacher → assign class → cek teacher bisa lihat siswa
6. **Disable test user** → cek tidak bisa login
7. **Upload avatar** → cek storage rules bekerja

---

## H. Command Summary

| Command | Fungsi |
| ------- | ------ |
| `npm run firebase:preflight` | Pre-flight check sebelum deploy |
| `npm run firebase:deploy:security` | Deploy semua security components |
| `npm run firebase:migrate -- --dry-run` | Dry-run migration teacher |
| `npm run firebase:migrate` | Jalankan migration teacher |
| `npm run firebase:test:rules` | Test Firestore rules via emulator |
| `npm run firebase:test:storage` | Test Storage rules via emulator |
| `npm run firebase:test:security` | Test Cloud Functions security |
