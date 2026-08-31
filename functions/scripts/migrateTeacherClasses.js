/**
 * Migration Script: Add teacherClassIds to existing teachers
 *
 * Existing teachers created before the security hardening do NOT have
 * teacherClassIds in their custom claims. After deploying the updated
 * Firestore Rules, these teachers will be DENIED access to all students
 * (deny-by-default). This script adds teacherClassIds:[] (or specified
 * class IDs) to every teacher's custom claims and Firestore profile.
 *
 * Requirements:
 *   - Service account JSON with Firebase Admin permissions
 *   - Set GOOGLE_APPLICATION_CREDENTIALS env var
 *
 * Usage (PowerShell):
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\service-account.json"
 *   npm run firebase:migrate -- --dry-run
 *   npm run firebase:migrate
 *   npm run firebase:migrate -- --uid=TEACHER_UID --class-ids=cls-4a,cls-4b
 *
 * Usage (Linux/macOS):
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json node scripts/migrateTeacherClasses.js
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const FIRESTORE_DB_ID = 'ai-studio-codenusa-deaefbe9-a722-44d6-9e2c-1855cb2c502e';
const DRY_RUN = process.argv.includes('--dry-run');

// Parse --class-ids=cls-4a,cls-4b
const classIdsArg = process.argv.find((a) => a.startsWith('--class-ids='));
const FORCE_CLASS_IDS = classIdsArg
  ? classIdsArg.split('=')[1].split(',').map((s) => s.trim()).filter(Boolean)
  : null;

// Parse --uid=TARGET_UID
const uidArg = process.argv.find((a) => a.startsWith('--uid='));
const TARGET_UID = uidArg ? uidArg.split('=')[1] : null;

// Deduplicate class IDs
function dedupe(ids) {
  return Array.from(new Set(ids));
}

// Safety warning for non-dry-run without explicit parameters
if (!DRY_RUN && !FORCE_CLASS_IDS && !TARGET_UID) {
  console.log('⚠️  PERINGATAN: Anda akan menjalankan migration tanpa --dry-run');
  console.log('   dan tanpa parameter --class-ids atau --uid.');
  console.log('   Semua teacher tanpa teacherClassIds akan mendapat [] (kelas kosong).');
  console.log('   Teacher yang sudah memiliki teacherClassIds TIDAK akan diubah.\n');
  console.log('   Tekan Ctrl+C untuk membatalkan, atau tunggu 5 detik...\n');
  // Auto-continue after 5 seconds (non-blocking for CI)
  const waitMs = 5000;
  const start = Date.now();
  while (Date.now() - start < waitMs) {
    // Busy-wait (synchronous for simple script)
  }
  console.log('   Melanjutkan...\n');
}

if (DRY_RUN) console.log('=== DRY RUN — no changes will be made ===\n');

admin.initializeApp();
const auth = admin.auth();
const firestore = getFirestore(FIRESTORE_DB_ID);

async function migrate() {
  console.log('Scanning Auth users for teachers...\n');

  let totalTeachers = 0;
  let updated = 0;
  let skipped = 0;
  let admins = 0;
  let students = 0;
  let errors = 0;
  let noAssignment = 0;
  let nextPageToken;

  do {
    const listUsersResult = await auth.listUsers(1000, nextPageToken);

    for (const user of listUsersResult.users) {
      const claims = user.customClaims || {};
      const role = claims.role;

      if (role === 'admin') {
        admins++;
        continue;
      }
      if (role !== 'teacher') {
        students++;
        continue;
      }

      totalTeachers++;

      // Skip if targeting a specific UID
      if (TARGET_UID && user.uid !== TARGET_UID) continue;

      // Skip if teacherClassIds already exists and is an array (unless forced)
      if (Array.isArray(claims.teacherClassIds) && !FORCE_CLASS_IDS) {
        console.log(
          `[SKIP] Teacher ${user.uid} (${user.email || 'no email'}) already has teacherClassIds: [${claims.teacherClassIds.join(', ')}]`
        );
        skipped++;
        continue;
      }

      // Determine classIds to set (deduplicated)
      const classIds = dedupe(FORCE_CLASS_IDS || []);

      if (classIds.length === 0) {
        noAssignment++;
      }

      console.log(
        `[UPDATE] Teacher ${user.uid} (${user.email || 'no email'}) → teacherClassIds: [${classIds.join(', ')}]`
      );

      if (!DRY_RUN) {
        try {
          // Preserve ALL existing claims, only update teacherClassIds
          const newClaims = { ...claims, role: 'teacher', teacherClassIds: classIds };
          await auth.setCustomUserClaims(user.uid, newClaims);

          // Also update Firestore profile
          try {
            await firestore
              .collection('users')
              .doc(user.uid)
              .set({ teacherClassIds: classIds }, { merge: true });
          } catch (e) {
            console.log(`  [WARN] Firestore update failed for ${user.uid}: ${e.message}`);
          }
        } catch (e) {
          console.log(`  [ERROR] Failed to update ${user.uid}: ${e.message}`);
          errors++;
          continue;
        }
      }

      updated++;
    }

    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  console.log('\n═══════════════════════════════════════════');
  console.log('         Migration Summary');
  console.log('═══════════════════════════════════════════');
  console.log(`Total teacher ditemukan:    ${totalTeachers}`);
  console.log(`Teacher akan diubah:       ${updated}`);
  console.log(`Teacher dilewati:          ${skipped}`);
  console.log(`Teacher tanpa assignment:   ${noAssignment}`);
  console.log(`Admin (diabaikan):         ${admins}`);
  console.log(`Student (diabaikan):        ${students}`);
  console.log(`Error:                     ${errors}`);
  console.log('═══════════════════════════════════════════');
  console.log(DRY_RUN
    ? '(DRY RUN — tidak ada perubahan yang dibuat)'
    : errors > 0
      ? `⚠️  Selesai dengan ${errors} error. Periksa log di atas.`
      : '✅ Migration berhasil. Semua perubahan telah diterapkan.'
  );
  console.log('');
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
