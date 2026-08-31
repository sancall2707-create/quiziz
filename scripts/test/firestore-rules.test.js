/**
 * Firestore Security Rules Test — CodeNusa
 *
 * Uses @firebase/rules-unit-testing with Firebase Emulator Suite.
 *
 * Prerequisites:
 *   - Java 11+ installed (for Firebase Emulator)
 *   - npm install (root, for @firebase/rules-unit-testing)
 *   - Firebase Emulator running OR run via firebase emulators:exec
 *
 * Usage:
 *   npx firebase emulators:exec "node scripts/test/firestore-rules.test.js"
 *
 * Or with emulator already running on default ports:
 *   node scripts/test/firestore-rules.test.js
 */

import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');
const rulesPath = resolve(root, 'firestore.rules');

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

async function main() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  CodeNusa Firestore Rules Test');
  console.log('═══════════════════════════════════════════\n');

  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync(rulesPath, 'utf-8') },
  });

  // ============================================================
  //  STUDENT TESTS
  // ============================================================
  console.log('─── Student ───');

  const studentA = testEnv.authenticatedContext('studentA', { role: 'student' });
  const studentB = testEnv.authenticatedContext('studentB', { role: 'student' });

  // Seed student A profile
  await studentA.firestore().doc('users/studentA').set({
    role: 'student', username: 'a', xp: 0, level: 1, stars: 0, coins: 0,
    grade: 4, classId: 'cls-4a',
  });

  // Seed student B profile
  await studentB.firestore().doc('users/studentB').set({
    role: 'student', username: 'b', xp: 0, level: 1, stars: 0, coins: 0,
    grade: 4, classId: 'cls-4b',
  });

  await test('Student: read own profile',
    assertSucceeds(studentA.firestore().doc('users/studentA').get()));

  await test('Student: update own avatar (safe field)',
    assertSucceeds(studentA.firestore().doc('users/studentA').update({ avatar: 'new.png' })));

  await test('Student: edit role → DENY',
    assertFails(studentA.firestore().doc('users/studentA').update({ role: 'admin' })));

  await test('Student: edit XP → DENY',
    assertFails(studentA.firestore().doc('users/studentA').update({ xp: 999999 })));

  await test('Student: edit stars → DENY',
    assertFails(studentA.firestore().doc('users/studentA').update({ stars: 999999 })));

  await test('Student: edit coins → DENY',
    assertFails(studentA.firestore().doc('users/studentA').update({ coins: 999999 })));

  await test('Student: edit grade → DENY',
    assertFails(studentA.firestore().doc('users/studentA').update({ grade: 6 })));

  await test('Student: edit classId → DENY',
    assertFails(studentA.firestore().doc('users/studentA').update({ classId: 'cls-6a' })));

  await test('Student: edit claimedChallenges → DENY',
    assertFails(studentA.firestore().doc('users/studentA').update({ claimedChallenges: ['fake'] })));

  await test('Student: read other student → DENY',
    assertFails(studentA.firestore().doc('users/studentB').get()));

  await test('Student: write to other student → DENY',
    assertFails(studentA.firestore().doc('users/studentB').set({ xp: 0 })));

  // ============================================================
  //  TEACHER TESTS
  // ============================================================
  console.log('\n─── Teacher ───');

  const teacher = testEnv.authenticatedContext('teacher1', { role: 'teacher', teacherClassIds: ['cls-4a'] });

  await test('Teacher: read student in own class (cls-4a) → ALLOW',
    assertSucceeds(teacher.firestore().doc('users/studentA').get()));

  await test('Teacher: read student in other class (cls-4b) → DENY',
    assertFails(teacher.firestore().doc('users/studentB').get()));

  await test('Teacher: edit student XP → DENY',
    assertFails(teacher.firestore().doc('users/studentA').update({ xp: 999 })));

  await test('Teacher: edit own role → DENY',
    assertFails(teacher.firestore().doc('users/teacher1').update({ role: 'admin' })));

  // Teacher with no classIds — should be denied all student reads
  const teacherNoClass = testEnv.authenticatedContext('teacher2', { role: 'teacher', teacherClassIds: [] });
  await test('Teacher (no class): read any student → DENY',
    assertFails(teacherNoClass.firestore().doc('users/studentA').get()));

  // Teacher with expanded classes
  const teacherExpanded = testEnv.authenticatedContext('teacher1', { role: 'teacher', teacherClassIds: ['cls-4a', 'cls-4b'] });
  await test('Teacher (expanded): read student cls-4b → ALLOW',
    assertSucceeds(teacherExpanded.firestore().doc('users/studentB').get()));

  // ============================================================
  //  ADMIN TESTS
  // ============================================================
  console.log('\n─── Admin ───');

  const admin = testEnv.authenticatedContext('admin1', { role: 'admin' });

  await test('Admin: read any user → ALLOW',
    assertSucceeds(admin.firestore().doc('users/studentA').get()));

  await test('Admin: update any user → ALLOW',
    assertSucceeds(admin.firestore().doc('users/studentA').update({ grade: 5 })));

  await test('Admin: cannot set password field → DENY',
    assertFails(admin.firestore().doc('users/studentA').update({ passwordHash: 'xxx' })));

  await test('Admin: delete user → ALLOW',
    assertSucceeds(admin.firestore().doc('users/studentB').delete()));

  // ============================================================
  //  UNAUTHENTICATED TESTS
  // ============================================================
  console.log('\n─── Unauthenticated ───');

  const anon = testEnv.unauthenticatedContext();

  await test('Unauthenticated: read users → DENY',
    assertFails(anon.firestore().doc('users/studentA').get()));

  await test('Unauthenticated: write users → DENY',
    assertFails(anon.firestore().doc('users/anon').set({ role: 'student' })));

  await test('Unauthenticated: read assignments → DENY',
    assertFails(anon.firestore().doc('assignments/test').get()));

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
  console.error('  npx firebase emulators:exec "node scripts/test/firestore-rules.test.js"');
  process.exit(1);
});
