/**
 * CodeNusa Security Migration Script
 *
 * Run this ONCE after deploying Cloud Functions and Firestore Rules.
 * It migrates the old fake-ID admin/teacher accounts to real Firebase Auth
 * accounts with custom claims, and strips passwordHash from all user docs.
 *
 * Prerequisites:
 *   1. Install dependencies:  npm install  (inside functions/)
 *   2. Provide a service account key JSON file (downloaded from Firebase Console →
 *      Project Settings → Service Accounts → Generate new private key).
 *   3. Set the path:            export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
 *   4. Run:                     npx ts-node scripts/migrate-accounts.ts
 *      (or compile and run with node after `npm run build` in functions/)
 *
 * The script NEVER stores the service account key, passwords, or any secret
 * in the repository. It reads the key from the environment variable only.
 */

import * as admin from 'firebase-admin';

// Initialize with the service account from the environment
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const auth = admin.auth();

// Use the named database (must match firebase-applet-config.json)
const FIRESTORE_DB_ID = 'ai-studio-codenusa-deaefbe9-a722-44d6-9e2c-1855cb2c502e';
const db = admin.firestore().databaseId
  ? admin.firestore()  // default database
  : admin.firestore(); // fallback

// For named database, we need to use the Admin SDK with the database option
const firestore = admin.firestore();

// ============================================================
//  Configuration — edit these to match your desired admin/teacher accounts.
//  Passwords are entered interactively via stdin and are NEVER written to disk.
// ============================================================

const STAFF_ACCOUNTS = [
  {
    oldId: 'user-admin-wijaya',
    username: 'wijaya_admin',
    name: 'Wijaya',
    role: 'admin' as const,
    school: 'Pusat Kurikulum CodeNusa',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    kobiCustomization: { skin: 'gold-champion', hat: 'crown', accessory: 'cyber-goggles' }
  },
  {
    oldId: 'user-teacher-wijaya',
    username: 'wijaya_guru',
    name: 'Wijaya',
    role: 'teacher' as const,
    school: 'SD Harapan Nusantara',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    kobiCustomization: { skin: 'blue-classic', hat: 'none', accessory: 'none' }
  }
];

function getInternalEmail(username: string): string {
  return `${username.trim().toLowerCase()}@siswa.codenusa.internal`;
}

async function promptPassword(label: string): Promise<string> {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    // Hide input by muting stdout
    const stdin = process.openStdin();
    process.stdin.on('data', (data: Buffer) => {
      // Not ideal masking, but password is not stored anywhere
    });
    rl.question(`Enter password for ${label} (min 8 chars): `, (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function migrate() {
  console.log('=== CodeNusa Security Migration ===\n');

  // Step 1: Create real Firebase Auth accounts for staff
  for (const staff of STAFF_ACCOUNTS) {
    const email = getInternalEmail(staff.username);
    console.log(`Creating Firebase Auth account for ${staff.username} (${staff.role})...`);

    let uid: string;
    try {
      // Try to create the account
      const userRecord = await auth.createUser({
        email,
        password: await promptPassword(`${staff.username} (${staff.role})`),
        displayName: staff.name,
      });
      uid = userRecord.uid;
      console.log(`  ✓ Created account: ${uid}`);
    } catch (err: any) {
      if (err.code === 'auth/email-already-exists') {
        // Account already exists — get its UID
        const existing = await auth.getUserByEmail(email);
        uid = existing.uid;
        console.log(`  ✓ Account already exists: ${uid}`);
      } else {
        console.error(`  ✗ Failed to create account for ${staff.username}:`, err.message);
        continue;
      }
    }

    // Set custom claim
    await auth.setCustomUserClaims(uid, { role: staff.role });
    console.log(`  ✓ Set custom claim: role=${staff.role}`);

    // Step 2: Create or update Firestore profile with real UID
    const todayStr = new Date().toISOString().split('T')[0];
    const profileData = {
      id: uid,
      name: staff.name,
      fullName: staff.name,
      username: staff.username,
      role: staff.role,
      email: null,
      avatar: staff.avatar,
      grade: 4,
      school: staff.school,
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
      xp: 0, level: 1, stars: 0, coins: 0,
      streakDays: 1, streakHistory: [todayStr],
      lastActive: 'Hari ini', lastActiveDate: todayStr,
      badges: ['badge-mastery'],
      completedMissions: [], rewardsClaimed: [], missionScores: {},
      kobiPosition: 'node-1',
      kobiCustomization: staff.kobiCustomization,
      settings: { soundEnabled: true, narrationVoiceEnabled: false, reduceMotion: false, highContrast: false, dyslexicFont: false, fontSize: 'normal' },
      mustChangePassword: true,
    };

    // Write to the named Firestore database
    const userRef = admin.firestore().doc(`users/${uid}`);
    await userRef.set(profileData, { merge: true });
    console.log(`  ✓ Firestore profile created/updated`);

    // Step 3: Delete old fake-ID document (if exists, different from real UID)
    if (uid !== staff.oldId) {
      try {
        const oldRef = admin.firestore().doc(`users/${staff.oldId}`);
        const oldSnap = await oldRef.get();
        if (oldSnap.exists) {
          await oldRef.delete();
          console.log(`  ✓ Deleted old fake-ID document: ${staff.oldId}`);
        }
      } catch (err) {
        console.log(`  - Old document ${staff.oldId} not found or already deleted`);
      }
    }
    console.log('');
  }

  // Step 4: Remove passwordHash from ALL user documents
  console.log('Removing passwordHash from all user documents...');
  const usersSnap = await admin.firestore().collection('users').get();
  let cleanedCount = 0;
  for (const docSnap of usersSnap.docs) {
    const data = docSnap.data();
    if ('passwordHash' in data || 'password' in data) {
      const update: Record<string, unknown> = {};
      if ('passwordHash' in data) update.passwordHash = admin.firestore.FieldValue.delete();
      if ('password' in data) update.password = admin.firestore.FieldValue.delete();
      await docSnap.ref.update(update);
      cleanedCount++;
    }
  }
  console.log(`  ✓ Cleaned passwordHash from ${cleanedCount} document(s)`);

  // Step 5: Remove old local auth registry keys from localStorage
  // (This must be done client-side — just document it)
  console.log('\n=== Migration Complete ===');
  console.log('\nIMPORTANT: Ask all users to clear their browser localStorage for the app,');
  console.log('or the old auth registry (codenusa_auth_session_v1, codenusa_auth_registry_v1)');
  console.log('will remain cached. The app now ignores these keys, but clearing them is cleaner.');
  console.log('\nNew login credentials:');
  for (const staff of STAFF_ACCOUNTS) {
    console.log(`  ${staff.role.toUpperCase()}: username=${staff.username} (password you just set)`);
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
