// Test Transfer: Alice sends 15 BB to Bob
// Uses real wallet credentials and blockchain API

import nacl from 'tweetnacl';

const L1_API = 'http://localhost:8080';

// Alice's credentials (from TEST_ACCOUNTS.txt)
const ALICE = {
  address: 'L1_52882D768C0F3E7932AAD1813CF8B19058D507A8',
  publicKey: '18f2c2e3bcb7a4b5329cfed4bd79bf17df4d47aa1888a6b3d1a1450fb53a8a24',
  privateKey: 'c0e349153cbc75e9529b5f1963205cab783463c6835c826a7587e0e0903c6705',
};

// Bob's address
const BOB = {
  address: 'L1_5DB4B525FB40D6EA6BFD24094C2BC24984BAC433',
};

const AMOUNT = 15;

// Convert hex string to Uint8Array
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// Convert Uint8Array to hex string
function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sendTransfer() {
  console.log('🚀 Testing L1 Transfer');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`From:   ${ALICE.address}`);
  console.log(`To:     ${BOB.address}`);
  console.log(`Amount: ${AMOUNT} BB`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check Alice's balance
  console.log('📊 Checking Alice\'s balance...');
  const balanceRes = await fetch(`${L1_API}/balance/${ALICE.address}`);
  const balanceData = await balanceRes.json();
  console.log(`   Current balance: ${balanceData.balance} BB\n`);

  if (balanceData.balance < AMOUNT) {
    console.error('❌ Insufficient balance!');
    process.exit(1);
  }

  // Create transaction payload
  const txPayload = {
    from: ALICE.address,
    to: BOB.address,
    amount: AMOUNT,
    timestamp: Date.now(),
  };

  console.log('📝 Transaction payload:', txPayload);

  // Sign transaction
  console.log('\n🔐 Signing transaction...');
  const message = JSON.stringify(txPayload);
  const messageBytes = new TextEncoder().encode(message);
  
  const privateKeyBytes = hexToBytes(ALICE.privateKey);
  const publicKeyBytes = hexToBytes(ALICE.publicKey);
  
  // Ed25519 needs 64-byte key (32 private + 32 public)
  const fullPrivateKey = new Uint8Array(64);
  fullPrivateKey.set(privateKeyBytes, 0);
  fullPrivateKey.set(publicKeyBytes, 32);
  
  const signature = nacl.sign.detached(messageBytes, fullPrivateKey);
  const signatureHex = bytesToHex(signature);
  
  console.log(`   Signature: ${signatureHex.substring(0, 32)}...`);

  // Send signed transaction
  const signedRequest = {
    from: ALICE.address,
    to: BOB.address,
    amount: AMOUNT,
    signature: signatureHex,
    pubkey: ALICE.publicKey,
    timestamp: txPayload.timestamp,
  };

  console.log('\n📡 Sending transaction to blockchain...');
  
  try {
    const response = await fetch(`${L1_API}/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signedRequest),
    });

    const result = await response.json();
    
    console.log('\n📥 Response:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ Transfer successful!');
      console.log(`   TX ID: ${result.tx_id}`);
      
      // Check new balances
      console.log('\n💰 New balances:');
      const aliceNewBalance = await fetch(`${L1_API}/balance/${ALICE.address}`).then(r => r.json());
      const bobNewBalance = await fetch(`${L1_API}/balance/${BOB.address}`).then(r => r.json());
      
      console.log(`   Alice: ${aliceNewBalance.balance} BB (was ${balanceData.balance} BB)`);
      console.log(`   Bob:   ${bobNewBalance.balance} BB`);
    } else {
      console.error('\n❌ Transfer failed!');
      console.error(`   Error: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('\n❌ Network error:', error.message);
  }
}

sendTransfer().catch(console.error);
