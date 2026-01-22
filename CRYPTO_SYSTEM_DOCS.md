# BlackBook Standardized Cryptographic System

## Overview

This document describes the standardized Ed25519 signature and address derivation system implemented throughout BlackBook's L1 ↔ L2 settlement infrastructure.

## 🔑 Key Components

### 1. Address Derivation (`lib/address-utils.ts`)

**L1 Address Format:**
```
L1_<40HEX> = L1_ + SHA256(pubkey)[0..20].hex().uppercase()
```

**L2 Address Format:**
```
L2_<40HEX> = L2_ + SHA256(pubkey)[0..20].hex().uppercase()
```

**Implementation:**
```typescript
import { deriveL1Address, deriveL2Address } from '@/lib/address-utils';

const publicKey = "c0e349153cbc75e9529b5f1963205cab783463c6835c826a7587e0e0903c6705";
const l1Address = deriveL1Address(publicKey);  // L1_52882D768C0F3E7932AAD1813CF8B19058D507A8
const l2Address = deriveL2Address(publicKey);  // L2_52882D768C0F3E7932AAD1813CF8B19058D507A8
```

### 2. Ed25519 Signature System (`lib/signature-utils.ts`)

**Modern Implementation:**
- Uses `@noble/ed25519` (audited, modern, TypeScript native)
- Replaces legacy `tweetnacl` dependency
- Provides consistent async/await API

**Key Functions:**
```typescript
import { createKeyPair, signMessage, verifySignature } from '@/lib/signature-utils';

// Generate keypair from seed
const keyPair = await createKeyPair(seed);

// Sign message
const signature = await signMessage("Hello World", keyPair.privateKey);

// Verify signature  
const isValid = await verifySignature(keyPair.publicKey, signature, "Hello World", timestamp);
```

### 3. Canonical Message Signing

**Format:**
```
DOMAIN\nOPERATION\nPAYLOAD_HASH\nTIMESTAMP\nNONCE
```

**Example:**
```typescript
import { signCanonicalMessage } from '@/lib/signature-utils';

const signed = await signCanonicalMessage(
  'BLACKBOOK_L1',      // Domain
  'transfer',          // Operation  
  'abc123...',         // Payload hash
  privateKey           // Private key
);
```

### 4. Server-Side Verification (`lib/server-signature-utils.ts`)

**API Request Verification:**
```typescript
import { verifyApiRequest } from '@/lib/server-signature-utils';

const verification = await verifyApiRequest(request, 'BLACKBOOK_L1');
if (!verification.isValid) {
  throw new Error(verification.error);
}
```

## 🏗 Integration Points

### 1. Wallet Operations (`lib/blackbook-wallet.ts`)

**Updated Functions:**
- `createWallet()` - Uses async `createKeyPair()`
- `derivePrivateKeyOnDemand()` - Uses async signature verification  
- `signTransfer()` - Uses modern Ed25519 signing
- All address derivation uses standardized `deriveL1Address()`

### 2. Settlement Protocol (`sdk/settlement-sdk.js`)

**Compatible with gRPC Protocol:**
- L1Settlement service operations
- Domain separation: `BLACKBOOK_L1{request_path}`
- Timestamp validation and replay protection
- Ed25519 signature verification

### 3. L2 Markets Integration (`lib/l2-markets.ts`)

**Authentication Flow:**
```typescript
// Fixed to use async signMessage
const signature = await signMessage(messageBytes, wallet.secretKey);
```

## 🔐 Security Features

### 1. Timestamp Validation
- 5-minute tolerance window
- Protects against replay attacks
- Server-side enforcement

### 2. Nonce Protection  
- UUID-based nonces prevent replay
- In-memory tracking with cleanup
- Production should use Redis/database

### 3. Domain Separation
- Different domains for L1/L2 operations
- Prevents cross-layer signature reuse
- Clear operation typing

### 4. Rate Limiting
- Per-public-key rate limits
- Configurable windows and thresholds
- Built-in cleanup mechanisms

## 📋 Migration Checklist

### ✅ Completed
- [x] Created standardized address derivation (`address-utils.ts`)
- [x] Implemented modern Ed25519 signatures (`signature-utils.ts`)  
- [x] Added server-side verification utilities (`server-signature-utils.ts`)
- [x] Updated `blackbook-wallet.ts` to use new crypto system
- [x] Fixed async/await calls throughout codebase
- [x] Updated test files to use new utilities
- [x] Verified TypeScript compilation passes
- [x] Development server runs successfully

### 🔄 Usage Patterns

**Client-Side Signing:**
```typescript
import { signCanonicalMessage } from '@/lib/signature-utils';
import { deriveL1Address } from '@/lib/address-utils';

const keyPair = await createKeyPair(seed);
const address = deriveL1Address(keyPair.publicKey);
const signed = await signCanonicalMessage('BLACKBOOK_L1', 'transfer', hash, keyPair.privateKey);
```

**Server-Side Verification:**
```typescript
import { verifyApiRequest } from '@/lib/server-signature-utils';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const verification = await verifyApiRequest(body, 'BLACKBOOK_L1');
  
  if (!verification.isValid) {
    return NextResponse.json({ error: verification.error }, { status: 401 });
  }
  
  // Process authenticated request...
}
```

## 🚀 Settlement Protocol Readiness

The standardized crypto system is now ready for full L1 ↔ L2 settlement integration:

1. **Address Compatibility** - L1/L2 addresses use consistent SHA256(pubkey) derivation
2. **Signature Verification** - Modern Ed25519 with proper timestamp/nonce validation  
3. **Domain Separation** - Clear separation between L1 Bank and L2 Casino operations
4. **gRPC Protocol Ready** - Compatible with `settlement.proto` specification
5. **Production Security** - Rate limiting, replay protection, proper error handling

The crypto foundation is solid and persistent throughout the entire system! 🔐✨