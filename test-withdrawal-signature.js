/**
 * Test withdrawal signature verification with Alice's wallet
 */

const nacl = require('tweetnacl');

// Alice's test wallet credentials
const ALICE = {
  privateKey: '52882d768c0f3e7932aad1813cf8b19058d507a8f42de7f8ea6b3d79c47c4b1618f2c2e3bcb7a4b5329cfed4bd79bf17df4d47aa1888a6b3d1a1450fb53a8a24',
  publicKey: '18f2c2e3bcb7a4b5329cfed4bd79bf17df4d47aa1888a6b3d1a1450fb53a8a24',
  address: 'L2_52882D768C0F3E7932AAD1813CF8B19058D507A8'
};

const CHAIN_ID_L2 = 2;

// Create test withdrawal payload
const timestamp = Math.floor(Date.now() / 1000);
const nonce = `${Date.now()}_test_nonce`;

const payload = {
  action: 'WITHDRAW_REQUEST',
  nonce,
  payload: {
    amount: 5,
    from_address: ALICE.address
  },
  timestamp
};

// Sort keys alphabetically (same as SDK)
function sortKeysAlphabetically(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortKeysAlphabetically);
  
  const sorted = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = sortKeysAlphabetically(obj[key]);
  });
  return sorted;
}

const sortedPayload = sortKeysAlphabetically(payload);
const message = JSON.stringify(sortedPayload);

console.log('📝 Test Withdrawal Signature');
console.log('─────────────────────────────────────────');
console.log('Payload:', payload);
console.log('Sorted:', sortedPayload);
console.log('Message:', message);
console.log('Message length:', message.length);

// Create domain-separated message (prepend chain ID byte)
const chainIdByte = Buffer.from([CHAIN_ID_L2]);
const messageBuffer = Buffer.from(message, 'utf-8');
const domainSeparated = Buffer.concat([chainIdByte, messageBuffer]);

console.log('\n🔐 Domain Separation:');
console.log('Chain ID byte:', chainIdByte.toString('hex'));
console.log('Message bytes (first 50):', messageBuffer.toString('hex').substring(0, 100));
console.log('Domain separated (first 50):', domainSeparated.toString('hex').substring(0, 100));
console.log('Domain separated length:', domainSeparated.length);

// Build secret key (32 bytes private + 32 bytes public)
const secretKey = new Uint8Array(64);
secretKey.set(Buffer.from(ALICE.privateKey, 'hex'), 0);
secretKey.set(Buffer.from(ALICE.publicKey, 'hex'), 32);

// Sign with domain separation
const signature = nacl.sign.detached(new Uint8Array(domainSeparated), secretKey);
const signatureHex = Buffer.from(signature).toString('hex');

console.log('\n✅ Signature Created:');
console.log('Public key:', ALICE.publicKey);
console.log('Signature:', signatureHex);
console.log('Signature length:', signatureHex.length);

// Verify the signature
const publicKey = new Uint8Array(Buffer.from(ALICE.publicKey, 'hex'));
const isValid = nacl.sign.detached.verify(
  new Uint8Array(domainSeparated),
  signature,
  publicKey
);

console.log('\n🔍 Verification:');
console.log('Is valid:', isValid ? '✅ YES' : '❌ NO');

if (!isValid) {
  console.error('\n❌ Signature verification FAILED!');
  process.exit(1);
}

// Create the API request
const apiRequest = {
  from_address: ALICE.address,
  amount: 5,
  public_key: ALICE.publicKey,
  signature: signatureHex,
  timestamp,
  nonce
};

console.log('\n📤 API Request:');
console.log(JSON.stringify(apiRequest, null, 2));

console.log('\n✅ Test completed successfully!');
console.log('\nYou can now send this request to /api/bridge/withdraw');
