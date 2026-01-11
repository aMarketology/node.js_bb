import { sendTransfer } from './lib/blackbook-wallet.ts';

// Alice's credentials from TEST_ACCOUNTS.txt
const alice = {
  address: 'L1_52882D768C0F3E7932AAD1813CF8B19058D507A8',
  publicKey: Buffer.from('18f2c2e3bcb7a4b5329cfed4bd79bf17df4d47aa1888a6b3d1a1450fb53a8a24', 'hex'),
  privateKey: Buffer.from('c0e349153cbc75e9529b5f1963205cab783463c6835c826a7587e0e0903c6705', 'hex')
};

// Bob's address
const bobAddress = 'L1_5DB4B525FB40D6EA6BFD24094C2BC24984BAC433';

console.log('🚀 Testing V1 Transfer Format');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('From:   ', alice.address);
console.log('To:     ', bobAddress);
console.log('Amount: ', 15, 'BB');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  const result = await sendTransfer(
    'http://localhost:8080',
    alice,
    bobAddress,
    15
  );
  
  console.log('\n✅ Transfer Result:', JSON.stringify(result, null, 2));
  
  if (result.success) {
    console.log('\n🎉 Transfer successful!');
    console.log('Transaction ID:', result.tx_id);
  } else {
    console.log('\n❌ Transfer failed:', result.error);
  }
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error(error);
}
