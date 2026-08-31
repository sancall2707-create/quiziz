/**
 * Storage Security Rules Test — CodeNusa
 *
 * Uses @firebase/rules-unit-testing with Firebase Emulator Suite.
 *
 * Usage:
 *   npx firebase emulators:exec "node scripts/test/storage-rules.test.js"
 */

import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');
const rulesPath = resolve(root, 'storage.rules');

const PROJECT_ID = 'codenusa-test';
const PASS = '\x1b[32m✅\x1b[0m';
const FAIL = '\x1b[31m❌\x1b[0m';

let passed = 0, failed = 0;

async function test(name, promise) {
  try {
    await promise;
    console.log(`${PASS} ${name}`);
    passed++;
  } catch (err) {
    console.log(`${FAIL} ${name} — ${err.message?.slice(0, 120) || 'failed'}`);
    failed++;
  }
}

function makeFileRef(storage, path, { contentType = 'image/jpeg', size = 1024 } = {}) {
  return storage.ref(path).putString('test', 'raw', {
    contentType,
    customMetadata: { size: String(size) },
  });
}

async function main() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  CodeNusa Storage Rules Test');
  console.log('═══════════════════════════════════════════\n');

  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    storage: { rules: readFileSync(rulesPath, 'utf-8') },
  });

  // ============================================================
  //  STUDENT TESTS
  // ============================================================
  console.log('─── Student Avatar Upload ───');

  const studentA = testEnv.authenticatedContext('studentA', { role: 'student' });
  const studentB = testEnv.authenticatedContext('studentB', { role: 'student' });

  await test('Student A: upload own avatar → ALLOW',
    assertSucceeds(
      studentA.storage().ref('avatars/studentA/photo.jpg').putString('test', 'raw', {
        contentType: 'image/jpeg', customMetadata: { size: '1024' },
      })
    ));

  await test('Student A: upload to studentB path → DENY',
    assertFails(
      studentA.storage().ref('avatars/studentB/photo.jpg').putString('test', 'raw', {
        contentType: 'image/jpeg', customMetadata: { size: '1024' },
      })
    ));

  await test('Student: upload non-image → DENY',
    assertFails(
      studentA.storage().ref('avatars/studentA/file.txt').putString('test', 'raw', {
        contentType: 'text/plain', customMetadata: { size: '1024' },
      })
    ));

  await test('Student: upload >2MB → DENY',
    assertFails(
      studentA.storage().ref('avatars/studentA/big.jpg').putString('test', 'raw', {
        contentType: 'image/jpeg', customMetadata: { size: String(3 * 1024 * 1024) },
      })
    ));

  await test('Student: delete own avatar → ALLOW',
    assertSucceeds(studentA.storage().ref('avatars/studentA/photo.jpg').delete()));

  await test('Student: delete other avatar → DENY',
    assertFails(studentA.storage().ref('avatars/studentB/photo.jpg').delete()));

  // ============================================================
  //  TEACHER TESTS
  // ============================================================
  console.log('\n─── Teacher Avatar ───');

  const teacher = testEnv.authenticatedContext('teacher1', { role: 'teacher', teacherClassIds: ['cls-4a'] });

  await test('Teacher: upload own avatar → ALLOW',
    assertSucceeds(
      teacher.storage().ref('avatars/teacher1/photo.jpg').putString('test', 'raw', {
        contentType: 'image/jpeg', customMetadata: { size: '1024' },
      })
    ));

  await test('Teacher: upload to student path → DENY',
    assertFails(
      teacher.storage().ref('avatars/studentA/photo.jpg').putString('test', 'raw', {
        contentType: 'image/jpeg', customMetadata: { size: '1024' },
      })
    ));

  await test('Teacher: delete student avatar → DENY',
    assertFails(teacher.storage().ref('avatars/studentA/photo.jpg').delete()));

  // ============================================================
  //  ADMIN TESTS
  // ============================================================
  console.log('\n─── Admin Avatar ───');

  const admin = testEnv.authenticatedContext('admin1', { role: 'admin' });

  await test('Admin: upload to any avatar path → ALLOW',
    assertSucceeds(
      admin.storage().ref('avatars/studentA/admin-set.jpg').putString('test', 'raw', {
        contentType: 'image/jpeg', customMetadata: { size: '1024' },
      })
    ));

  await test('Admin: delete any avatar → ALLOW',
    assertSucceeds(admin.storage().ref('avatars/studentA/admin-set.jpg').delete()));

  // ============================================================
  //  UNAUTHENTICATED TESTS
  // ============================================================
  console.log('\n─── Unauthenticated ───');

  const anon = testEnv.unauthenticatedContext();

  await test('Unauthenticated: upload → DENY',
    assertFails(
      anon.storage().ref('avatars/studentA/hack.jpg').putString('test', 'raw', {
        contentType: 'image/jpeg', customMetadata: { size: '1024' },
      })
    ));

  await test('Unauthenticated: read avatar → ALLOW (public)',
    assertSucceeds(anon.storage().ref('avatars/studentA/photo.jpg').getDownloadURL()));

  // ============================================================
  //  Summary
  // ============================================================
  console.log('\n═══════════════════════════════════════════');
  console.log(`${PASS} Passed: ${passed}   ${FAIL} Failed: ${failed}`);
  console.log('═══════════════════════════════════════════\n');

  await testEnv.cleanup();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test setup failed:', err.message);
  console.error('\nPastikan Firebase Emulator berjalan atau gunakan:');
  console.error('  npx firebase emulators:exec "node scripts/test/storage-rules.test.js"');
  process.exit(1);
});
