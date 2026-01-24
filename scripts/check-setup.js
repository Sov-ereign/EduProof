/**
 * Setup verification script
 * Checks if all dependencies and configurations are ready
 */

import { existsSync } from 'fs';
import { readFileSync } from 'fs';

console.log('🔍 Checking EduProof Setup...\n');

const checks = [];

// Check Node.js version
const nodeVersion = process.version;
const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
if (nodeMajor >= 18) {
  checks.push({ name: 'Node.js version', status: '✅', detail: nodeVersion });
} else {
  checks.push({ name: 'Node.js version', status: '❌', detail: `${nodeVersion} (Need 18+)` });
}

// Check package.json
if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
  checks.push({ name: 'package.json', status: '✅', detail: `v${pkg.version}` });
} else {
  checks.push({ name: 'package.json', status: '❌', detail: 'Missing' });
}

// Check contract
if (existsSync('contracts/src/lib.rs')) {
  checks.push({ name: 'Smart Contract', status: '✅', detail: 'Found' });
} else {
  checks.push({ name: 'Smart Contract', status: '❌', detail: 'Missing' });
}

// Check stellar config
if (existsSync('src/lib/stellar.ts')) {
  const stellarContent = readFileSync('src/lib/stellar.ts', 'utf-8');
  if (stellarContent.includes('CONTRACT_ID')) {
    checks.push({ name: 'Stellar Config', status: '✅', detail: 'Found' });
  } else {
    checks.push({ name: 'Stellar Config', status: '⚠️', detail: 'Contract ID may need update' });
  }
} else {
  checks.push({ name: 'Stellar Config', status: '❌', detail: 'Missing' });
}

// Check .env
if (existsSync('.env.local') || existsSync('.env')) {
  checks.push({ name: 'Environment Config', status: '✅', detail: 'Found' });
} else {
  checks.push({ name: 'Environment Config', status: '⚠️', detail: 'Optional - using defaults' });
}

// Display results
checks.forEach(check => {
  console.log(`${check.status} ${check.name}: ${check.detail}`);
});

const failed = checks.filter(c => c.status === '❌').length;
const warnings = checks.filter(c => c.status === '⚠️').length;

console.log('\n' + '='.repeat(50));
if (failed === 0 && warnings === 0) {
  console.log('✅ All checks passed! Ready to deploy.');
} else if (failed === 0) {
  console.log('⚠️  Some warnings - review above');
} else {
  console.log(`❌ ${failed} issue(s) found - fix before deploying`);
}

