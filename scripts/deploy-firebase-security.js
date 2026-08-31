/**
 * Safe Firebase Deployment for CodeNusa Security Components
 *
 * Deploys in safe order, stops on any failure.
 * Run pre-flight first: npm run firebase:preflight
 *
 * Usage:  node scripts/deploy-firebase-security.js
 */

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const PASS = '\x1b[32m✅\x1b[0m';
const FAIL = '\x1b[31m❌\x1b[0m';
const INFO = '\x1b[36mℹ\x1b[0m';

let step = 0;

function runStep(label, command) {
  step++;
  console.log(`\n${INFO} [${step}] ${label}...`);
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: root,
    });
    console.log(output);
    console.log(`${PASS} [${step}] ${label} — BERHASIL`);
    return true;
  } catch (err) {
    console.log(err.stdout || '');
    console.error(err.stderr || err.message);
    console.log(`${FAIL} [${step}] ${label} — GAGAL`);
    console.log(`\n${FAIL} Deployment dihentikan. Perbaiki error di atas lalu jalankan ulang.`);
    return false;
  }
}

console.log('\n═══════════════════════════════════════════');
console.log('  CodeNusa Firebase Security Deployment');
console.log('═══════════════════════════════════════════\n');

// Step 0: Pre-flight
if (!runStep('Pre-Flight Check', 'node scripts/firebase-preflight.js')) {
  process.exit(1);
}

// Step 1: Build Cloud Functions
if (!runStep('Build Cloud Functions', 'cd functions && npm run build')) {
  process.exit(1);
}

// Step 2: Deploy Cloud Functions
if (!runStep('Deploy Cloud Functions', 'firebase deploy --only functions')) {
  process.exit(1);
}

// Step 3: Deploy Firestore Rules
if (!runStep('Deploy Firestore Rules', 'firebase deploy --only firestore:rules')) {
  process.exit(1);
}

// Step 4: Deploy Firestore Indexes
if (!runStep('Deploy Firestore Indexes', 'firebase deploy --only firestore:indexes')) {
  process.exit(1);
}

// Step 5: Deploy Storage Rules
if (!runStep('Deploy Storage Rules', 'firebase deploy --only storage')) {
  process.exit(1);
}

console.log('\n═══════════════════════════════════════════');
console.log(`${PASS} SEMUA DEPLOYMENT BERHASIL`);
console.log('═══════════════════════════════════════════\n');
console.log('Langkah berikutnya:');
console.log('  1. Jalankan migration teacher:  npm run firebase:migrate -- --dry-run');
console.log('  2. Jika dry-run OK, jalankan:    npm run firebase:migrate');
console.log('  3. Jalankan security test:      npm run firebase:test:rules');
console.log('  4. Jalankan functions test:     npm run firebase:test:security');
console.log('');
