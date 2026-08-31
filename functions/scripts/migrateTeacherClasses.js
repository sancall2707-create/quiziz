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
 *   - Run from the functions/ directory
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
 *     node scripts/migrateTeacherClasses.js
 *
 *   # Dry run (no changes)
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
 *     node scripts/migrateTeacherClasses.js --dry-run
 *
 *   # Assign specific class IDs to ALL teachers
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
 *     node scripts/migrateTeacherClasses.js --class-ids=cls-4a,cls-4b
 *
 *   # Assign to a specific teacher only
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
 *     node scripts/migrateTeacherClasses.js --uid=TEACHER_UID --class-ids=cls-4a
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

if (DRY_RUN) console.log('=== DRY RUN — no changes will be made ===\n');

admin.initializeApp();
const auth = admin.auth();
const firestore = getFirestore(FIRESTORE_DB_ID);

async function migrate() {
  console.log('Scanning Auth users for teachers...\n');

  let updated = 0;
  let skipped = 0;
  let admins = 0;
  let students = 0;
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

      // Skip if targeting a specific UID
      if (TARGET_UID && user.uid !== TARGET_UID) continue;

      // Skip if teacherClassIds already exists and is an array
      if (Array.isArray(claims.teacherClassIds) && !FORCE_CLASS_IDS) {
        console.log(
          `[SKIP] Teacher ${user.uid} (${user.email || 'no email'}) already has teacherClassIds: [${claims.teacherClassIds.join(', ')}]`
        );
        skipped++;
        continue;
      }

      // Determine classIds to set
      const classIds = FORCE_CLASS_IDS || [];

      console.log(
        `[UPDATE] Teacher ${user.uid} (${user.email || 'no email'}) → teacherClassIds: [${classIds.join(', ')}]`
      );

      if (!DRY_RUN) {
        // Preserve ALL existing claims, only add/update teacherClassIds
        const newClaims = { ...claims, teacherClassIds: classIds };
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
      }

      updated++;
    }

    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  console.log('\n=== Migration Summary ===');
  console.log(`Teachers updated:  ${updated}`);
  console.log(`Teachers skipped: ${skipped}`);
  console.log(`Admins (ignored): ${admins}`);
  console.log(`Students (ignored): ${students}`);
  console.log(DRY_RUN ? '(DRY RUN — no changes made)' : '✅ Changes applied successfully.');
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
