/**
 * Cloud Functions Security Test Harness — CodeNusa
 *
 * Tests deployed Cloud Functions with different auth contexts.
 * Requires Firebase project deployed and test accounts.
 *
 * Setup:
 *   Set environment variables for test accounts (PowerShell):
 *     $env:TEST_STUDENT_EMAIL="teststudent@siswa.codenusa.internal"
 *     $env:TEST_STUDENT_PASSWORD="TestPass123!"
 *     $env:TEST_TEACHER_EMAIL="testteacher@siswa.codenusa.internal"
 *     $env:TEST_TEACHER_PASSWORD="TestPass123!"
 *     $env:TEST_ADMIN_EMAIL="testadmin@siswa.codenusa.internal"
 *     $env:TEST_ADMIN_PASSWORD="TestPass123!"
 *
 * Usage:
 *   node scripts/test/functions-security.test.js
 *
 * NOTE: Test accounts must be created first via admin panel or createStaffAccount.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFunctions, httpsCallable, Functions } from 'firebase/functions';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');

// Read Firebase config from firebase-applet-config.json
const fbConfig = JSON.parse(readFileSync(resolve(root, 'firebase-applet-config.json'), 'utf-8'));
const app = initializeApp({
  apiKey: fbConfig.apiKey,
  authDomain: fbConfig.authDomain,
  projectId: fbConfig.projectId,
  storageBucket: fbConfig.storageBucket,
  appId: fbConfig.appId,
  messagingSenderId: fbConfig.messagingSenderId,
});

const auth = getAuth(app);
const functions = getFunctions(app, 'asia-southeast1');

const PASS = '\x1b[32m✅\x1b[0m';
const FAIL = '\x1b[31m❌\x1b[0m';
const SKIP = '\x1b[33m⏭\x1b[0m';

let passed = 0, failed = 0, skipped = 0;

function log(name, status, detail = '') {
  const icon = status === 'pass' ? PASS : status === 'fail' ? FAIL : SKIP;
  console.log(`${icon} ${name}${detail ? ' — ' + detail : ''}`);
  if (status === 'pass') passed++;
  else if (status === 'fail') failed++;
  else skipped++;
}

async function tryCall(fnName, data, expectError = null) {
  const fn = httpsCallable(functions, fnName);
  try {
    const result = await fn(data);
    if (expectError) {
      log(`${fnName}: expected error but got success`, 'fail');
      return null;
    }
    return result.data;
  } catch (err) {
    if (expectError && err.code?.includes(expectError)) {
      return 'expected-error';
    }
    if (expectError) {
      log(`${fnName}: got ${err.code}, expected ${expectError}`, 'fail');
      return null;
    }
    throw err;
  }
}

async function main() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  CodeNusa Cloud Functions Security Test');
  console.log('═══════════════════════════════════════════\n');

  const studentEmail = process.env.TEST_STUDENT_EMAIL;
  const studentPass = process.env.TEST_STUDENT_PASSWORD;
  const teacherEmail = process.env.TEST_TEACHER_EMAIL;
  const teacherPass = process.env.TEST_TEACHER_PASSWORD;
  const adminEmail = process.env.TEST_ADMIN_EMAIL;
  const adminPass = process.env.TEST_ADMIN_PASSWORD;

  if (!studentEmail || !adminEmail) {
    console.log('Set test account env vars first (see script header for PowerShell commands).\n');
    process.exit(1);
  }

  // ============================================================
  //  UNAUTHENTICATED TESTS
  // ============================================================
  console.log('─── Unauthenticated ───');

  await test('submitProgress (unauth) → DENY', async () => {
    const r = await tryCall('submitProgress', { type: 'mission_complete', payload: {} }, 'unauthenticated');
    return r === 'expected-error';
  });

  await test('createStaffAccount (unauth) → DENY', async () => {
    const r = await tryCall('createStaffAccount', {}, 'unauthenticated');
    return r === 'expected-error';
  });

  await test('setUserRole (unauth) → DENY', async () => {
    const r = await tryCall('setUserRole', {}, 'unauthenticated');
    return r === 'expected-error';
  });

  await test('disableUser (unauth) → DENY', async () => {
    const r = await tryCall('disableUser', {}, 'unauthenticated');
    return r === 'expected-error';
  });

  // ============================================================
  //  STUDENT TESTS
  // ============================================================
  console.log('\n─── Student ───');

  await signInWithEmailAndPassword(auth, studentEmail, studentPass);
  console.log(`  Logged in as student: ${auth.currentUser?.uid}`);

  await test('submitProgress: fake xpEarned=999999 → ignored', async () => {
    // Client sends only missionId — xpEarned should be ignored
    const r = await tryCall('submitProgress', {
      type: 'mission_complete',
      payload: { missionId: 'm-g4-c1-m1', stars: 3, score: 100, xpEarned: 999999 },
    });
    // If mission already claimed, result.alreadyClaimed should be true
    return r !== null;
  });

  await test('submitProgress: fake userId → ignored', async () => {
    const r = await tryCall('submitProgress', {
      type: 'mission_complete',
      payload: { missionId: 'm-g4-c1-m1', userId: 'some-other-uid' },
    });
    return r !== null;
  });

  await test('submitProgress: invalid missionId → not-found', async () => {
    const r = await tryCall('submitProgress', {
      type: 'mission_complete',
      payload: { missionId: '__fake_mission__' },
    }, 'not-found');
    return r === 'expected-error';
  });

  await test('submitProgress: challenge with fake rewards → ignored', async () => {
    const r = await tryCall('submitProgress', {
      type: 'challenge_bonus',
      payload: { challengeId: 'ch-easy-1', xp: 999999, stars: 999, coins: 999 },
    });
    return r !== null;
  });

  await test('submitProgress: invalid challengeId → not-found', async () => {
    const r = await tryCall('submitProgress', {
      type: 'challenge_bonus',
      payload: { challengeId: '__fake_challenge__' },
    }, 'not-found');
    return r === 'expected-error';
  });

  await test('createStaffAccount (student) → DENY', async () => {
    const r = await tryCall('createStaffAccount', {
      username: 'test_hacker', name: 'Hacker', password: 'Password123!', role: 'admin',
    }, 'permission-denied');
    return r === 'expected-error';
  });

  await test('setUserRole (student) → DENY', async () => {
    const r = await tryCall('setUserRole', { uid: 'fake', role: 'admin' }, 'permission-denied');
    return r === 'expected-error';
  });

  await test('disableUser (student) → DENY', async () => {
    const r = await tryCall('disableUser', { uid: 'fake' }, 'permission-denied');
    return r === 'expected-error';
  });

  await test('assignTeacherClasses (student) → DENY', async () => {
    const r = await tryCall('assignTeacherClasses', { uid: 'fake', classIds: [] }, 'permission-denied');
    return r === 'expected-error';
  });

  await signOut(auth);

  // ============================================================
  //  TEACHER TESTS (if teacher account available)
  // ============================================================
  if (teacherEmail && teacherPass) {
    console.log('\n─── Teacher ───');

    await signInWithEmailAndPassword(auth, teacherEmail, teacherPass);
    console.log(`  Logged in as teacher: ${auth.currentUser?.uid}`);

    await test('createStaffAccount (teacher) → DENY', async () => {
      const r = await tryCall('createStaffAccount', {
        username: 'test_t_hacker', name: 'THacker', password: 'Password123!', role: 'teacher',
      }, 'permission-denied');
      return r === 'expected-error';
    });

    await test('setUserRole (teacher) → DENY', async () => {
      const r = await tryCall('setUserRole', { uid: 'fake', role: 'admin' }, 'permission-denied');
      return r === 'expected-error';
    });

    await test('disableUser (teacher) → DENY', async () => {
      const r = await tryCall('disableUser', { uid: 'fake' }, 'permission-denied');
      return r === 'expected-error';
    });

    await signOut(auth);
  } else {
    console.log('\n─── Teacher (skipped — no teacher test account) ───');
  }

  // ============================================================
  //  ADMIN TESTS
  // ============================================================
  if (adminEmail && adminPass) {
    console.log('\n─── Admin ───');

    await signInWithEmailAndPassword(auth, adminEmail, adminPass);
    console.log(`  Logged in as admin: ${auth.currentUser?.uid}`);

    await test('submitProgress (admin) → ALLOW', async () => {
      const r = await tryCall('submitProgress', {
        type: 'streak_checkin', payload: {},
      });
      return r !== null;
    });

    await test('disableUser: self-disable → DENY', async () => {
      const r = await tryCall('disableUser', {
        uid: auth.currentUser?.uid,
      }, 'invalid-argument');
      return r === 'expected-error';
    });

    await signOut(auth);
  } else {
    console.log('\n─── Admin (skipped — no admin test account) ───');
  }

  // ============================================================
  //  Summary
  // ============================================================
  console.log('\n═══════════════════════════════════════════');
  console.log(`${PASS} Passed: ${passed}   ${FAIL} Failed: ${failed}   ${SKIP} Skipped: ${skipped}`);
  console.log('═══════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

async function test(name, fn) {
  try {
    const result = await fn();
    log(name, result ? 'pass' : 'fail');
  } catch (err) {
    log(name, 'fail', err.message?.slice(0, 120) || String(err));
  }
}

main().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
