/**
 * Firebase Pre-Flight Check for CodeNusa
 *
 * Verifies that the environment is ready for Firebase deployment.
 * Run this BEFORE any deploy command.
 *
 * Usage:  node scripts/firebase-preflight.js
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const EXPECTED_PROJECT = 'copper-yew-zt8c4';
const EXPECTED_DB = 'ai-studio-codenusa-deaefbe9-a722-44d6-9e2c-1855cb2c502e';

const PASS = '\x1b[32m✅\x1b[0m';
const FAIL = '\x1b[31m❌\x1b[0m';
const WARN = '\x1b[33m⚠\x1b[0m';
const INFO = '\x1b[36mℹ\x1b[0m';

let errors = 0;
let warnings = 0;

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`${PASS} ${label}`);
  } else {
    console.log(`${FAIL} ${label}${detail ? ' — ' + detail : ''}`);
    errors++;
  }
}

function warn(label, detail = '') {
  console.log(`${WARN} ${label}${detail ? ' — ' + detail : ''}`);
  warnings++;
}

console.log('\n═══════════════════════════════════════════');
console.log('  CodeNusa Firebase Pre-Flight Check');
console.log('═══════════════════════════════════════════\n');

// 1. Firebase CLI available
let firebaseVersion = '';
try {
  firebaseVersion = execSync('firebase --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  check('Firebase CLI tersedia', true, `(v${firebaseVersion})`);
} catch {
  check('Firebase CLI tersedia', false, 'Jalankan: npm install -g firebase-tools');
  console.log('\nFirebase CLI tidak ditemukan. Install dengan: npm install -g firebase-tools');
  process.exit(1);
}

// 2. Firebase CLI authenticated
try {
  const loginList = execSync('firebase login:list', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  if (loginList.includes('No authorized accounts')) {
    check('Firebase CLI terautentikasi', false, 'Jalankan: firebase login');
  } else {
    check('Firebase CLI terautentikasi', true);
  }
} catch {
  check('Firebase CLI terautentikasi', false, 'Jalankan: firebase login');
  errors++;
}

// 3. Active Firebase project
let activeProject = '';
try {
  activeProject = execSync('firebase use', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  const match = activeProject.match(/copper-yew-zt8c4/);
  check('Active project sesuai CodeNusa', !!match, activeProject || 'tidak ada project aktif');
} catch {
  check('Active project sesuai CodeNusa', false, 'Jalankan: firebase use copper-yew-zt8c4');
  errors++;
}

// 4. .firebaserc
const firebasercPath = resolve(root, '.firebaserc');
check('.firebaserc tersedia', existsSync(firebasercPath));

if (existsSync(firebasercPath)) {
  try {
    const rc = JSON.parse(readFileSync(firebasercPath, 'utf-8'));
    const projId = rc.projects?.default;
    check('.firebaserc project ID sesuai', projId === EXPECTED_PROJECT, `ditemukan: ${projId}`);
  } catch {
    check('.firebaserc valid JSON', false);
  }
}

// 5. firebase.json
const firebaseJsonPath = resolve(root, 'firebase.json');
check('firebase.json tersedia', existsSync(firebaseJsonPath));

if (existsSync(firebaseJsonPath)) {
  try {
    const fj = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'));
    check('firebase.json: firestore.rules', !!fj.firestore?.rules);
    check('firebase.json: firestore.indexes', !!fj.firestore?.indexes, fj.firestore?.indexes ? '' : 'tambahkan "indexes": "firestore.indexes.json"');
    check('firebase.json: firestore.database', !!fj.firestore?.database);
    check('firebase.json: storage.rules', !!fj.storage?.rules);
    check('firebase.json: functions.source', !!fj.functions?.source);
    if (fj.firestore?.database) {
      check('Firestore database ID sesuai', fj.firestore.database === EXPECTED_DB, `ditemukan: ${fj.firestore.database}`);
    }
  } catch {
    check('firebase.json valid JSON', false);
  }
}

// 6. Deployment files
const files = ['firestore.rules', 'firestore.indexes.json', 'storage.rules'];
for (const f of files) {
  check(`${f} tersedia`, existsSync(resolve(root, f)));
}

// 7. Functions dependencies
check('functions/node_modules tersedia', existsSync(resolve(root, 'functions/node_modules')),
  existsSync(resolve(root, 'functions/node_modules')) ? '' : 'Jalankan: cd functions && npm install');

// 8. Functions build
console.log('\n' + INFO + ' Memeriksa Functions build...');
try {
  execSync('cd functions && npm run build', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  check('Cloud Functions build berhasil', true);
} catch (err) {
  check('Cloud Functions build berhasil', false, err.stderr?.slice(0, 200) || 'build error');
  errors++;
}

// 9. Identity Platform readiness
warn('PERLU VERIFIKASI MANUAL: Pastikan Identity Platform / Auth Blocking Functions aktif di Firebase Console.');
warn('  Firebase Console → Authentication → Settings → Identity Platform');
warn('  Blocking function beforeUserCreated membutuhkan capability ini.');

// Summary
console.log('\n═══════════════════════════════════════════');
if (errors === 0) {
  console.log(`${PASS} Pre-Flight: ${warnings} peringatan, 0 error`);
  console.log('  Siap untuk deployment.\n');
  process.exit(0);
} else {
  console.log(`${FAIL} Pre-Flight: ${errors} error, ${warnings} peringatan`);
  console.log('  Perbaiki error di atas sebelum deployment.\n');
  process.exit(1);
}
