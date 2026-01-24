/**
 * Test script to verify EduProof setup
 * Run with: node scripts/test-flow.js
 */

import { CONTRACT_ID, RPC_URL, HORIZON_URL, NETWORK_PASSPHRASE } from '../src/lib/stellar.ts';

console.log('🧪 EduProof Configuration Test\n');
console.log('Contract ID:', CONTRACT_ID || '⚠️  Not set - deploy contract first');
console.log('RPC URL:', RPC_URL);
console.log('Horizon URL:', HORIZON_URL);
console.log('Network:', NETWORK_PASSPHRASE === 'Test SDF Network ; September 2015' ? 'Testnet ✅' : 'Mainnet ⚠️');
console.log('\n✅ Configuration check complete!');

