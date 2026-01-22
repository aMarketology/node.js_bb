/**
 * Standardized Ed25519 Signature Utilities
 * Provides consistent signature verification and signing across the application
 * using @noble/ed25519 for modern, audited cryptography
 */

import * as ed from '@noble/ed25519';
import { deriveL1Address, deriveL2Address } from './address-utils';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const SIGNATURE_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes

// In-memory nonce tracking for replay attack prevention
// Production should use Redis or database for distributed systems
const usedNonces = new Map<string, boolean>();

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Convert hex string to Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ═══════════════════════════════════════════════════════════════
// SIGNATURE VERIFICATION
// ═══════════════════════════════════════════════════════════════

/**
 * Verify Ed25519 signature with timestamp and replay protection
 * @param publicKeyHex - Hex encoded public key (64 chars, 32 bytes)
 * @param signatureHex - Hex encoded signature (128 chars, 64 bytes)
 * @param message - Message that was signed (as string or Uint8Array)
 * @param timestamp - Unix timestamp when signature was created
 * @returns true if signature is valid
 * @throws Error if signature is invalid, expired, or replayed
 */
export async function verifySignature(
  publicKeyHex: string,
  signatureHex: string,
  message: string | Uint8Array,
  timestamp: number
): Promise<boolean> {
  // 1. Check timestamp tolerance
  const now = Date.now();
  const signedAt = timestamp * 1000; // Convert to ms
  
  if (signedAt < now - SIGNATURE_TOLERANCE_MS) {
    throw new Error(`Signature expired: signed at ${signedAt}, now ${now}`);
  }
  if (signedAt > now + SIGNATURE_TOLERANCE_MS) {
    throw new Error(`Signature from future: signed at ${signedAt}, now ${now}`);
  }

  // 2. Check for replay attack
  const nonceKey = `${publicKeyHex}:${timestamp}`;
  if (usedNonces.has(nonceKey)) {
    throw new Error('Replay attack: nonce already used');
  }
  usedNonces.set(nonceKey, true);
  
  // Cleanup old nonces (keep last 1000)
  if (usedNonces.size > 1000) {
    const oldest = usedNonces.keys().next().value;
    if (oldest) {
      usedNonces.delete(oldest);
    }
  }

  // 3. Convert hex to bytes
  const publicKey = hexToBytes(publicKeyHex);
  const signature = hexToBytes(signatureHex);
  
  if (publicKey.length !== 32) {
    throw new Error(`Public key must be 32 bytes, got ${publicKey.length}`);
  }
  if (signature.length !== 64) {
    throw new Error(`Signature must be 64 bytes, got ${signature.length}`);
  }

  // 4. Convert message to bytes if needed
  let messageBytes: Uint8Array;
  if (typeof message === 'string') {
    messageBytes = new TextEncoder().encode(message);
  } else {
    messageBytes = message;
  }

  // 5. Verify with @noble/ed25519
  const isValid = await ed.verifyAsync(signature, messageBytes, publicKey);
  
  if (!isValid) {
    throw new Error('Invalid signature');
  }
  
  return true;
}

// ═══════════════════════════════════════════════════════════════
// SIGNATURE GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Create Ed25519 signature using @noble/ed25519
 * @param message - Message to sign (string or Uint8Array)
 * @param privateKeyHex - Hex encoded private key (64 chars, 32 bytes)
 * @returns Hex encoded signature (128 chars, 64 bytes)
 */
export async function signMessage(
  message: string | Uint8Array,
  privateKeyHex: string
): Promise<string> {
  // Convert message to bytes if needed
  let messageBytes: Uint8Array;
  if (typeof message === 'string') {
    messageBytes = new TextEncoder().encode(message);
  } else {
    messageBytes = message;
  }

  // Convert private key from hex
  const privateKey = hexToBytes(privateKeyHex);
  
  if (privateKey.length !== 32) {
    throw new Error(`Private key must be 32 bytes, got ${privateKey.length}`);
  }

  // Sign with @noble/ed25519
  const signature = await ed.signAsync(messageBytes, privateKey);
  
  return bytesToHex(signature);
}

/**
 * Generate keypair from seed using @noble/ed25519
 * @param seed - 32-byte seed for key generation
 * @returns Object with publicKey and privateKey as hex strings
 */
export async function createKeyPair(seed: Uint8Array): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  if (seed.length !== 32) {
    throw new Error(`Seed must be 32 bytes, got ${seed.length}`);
  }

  // Generate private key from seed
  const privateKey = seed;
  
  // Derive public key
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  
  return {
    publicKey: bytesToHex(publicKey),
    privateKey: bytesToHex(privateKey)
  };
}

/**
 * Generate keypair and derive L1/L2 addresses
 * @param seed - 32-byte seed for key generation
 * @returns Keypair with derived addresses
 */
export async function createKeyPairWithAddresses(seed: Uint8Array): Promise<{
  publicKey: string;
  privateKey: string;
  l1Address: string;
  l2Address: string;
}> {
  const keyPair = await createKeyPair(seed);
  
  return {
    ...keyPair,
    l1Address: deriveL1Address(keyPair.publicKey),
    l2Address: deriveL2Address(keyPair.publicKey)
  };
}

// ═══════════════════════════════════════════════════════════════
// CANONICAL MESSAGE SIGNING
// ═══════════════════════════════════════════════════════════════

/**
 * Create a canonical message for signing with domain separation
 * @param domain - Domain prefix (e.g., "BLACKBOOK_L1")
 * @param operation - Operation type (e.g., "transfer", "bet")
 * @param payloadHash - Hash of the operation payload
 * @param timestamp - Unix timestamp
 * @param nonce - Unique nonce for replay protection
 * @returns Canonical message string
 */
export function createCanonicalMessage(
  domain: string,
  operation: string,
  payloadHash: string,
  timestamp: number,
  nonce: string
): string {
  return `${domain}\n${operation}\n${payloadHash}\n${timestamp}\n${nonce}`;
}

/**
 * Sign a canonical message with Ed25519
 * @param domain - Domain prefix for message separation
 * @param operation - Operation being signed
 * @param payloadHash - Hash of operation data
 * @param privateKeyHex - Hex encoded private key
 * @param timestamp - Optional timestamp (defaults to now)
 * @param nonce - Optional nonce (defaults to random UUID)
 * @returns Signature result with all verification data
 */
export async function signCanonicalMessage(
  domain: string,
  operation: string,
  payloadHash: string,
  privateKeyHex: string,
  timestamp?: number,
  nonce?: string
): Promise<{
  message: string;
  signature: string;
  timestamp: number;
  nonce: string;
  publicKey: string;
}> {
  // Generate defaults if not provided
  timestamp = timestamp ?? Math.floor(Date.now() / 1000);
  nonce = nonce ?? crypto.randomUUID();
  
  // Create canonical message
  const message = createCanonicalMessage(domain, operation, payloadHash, timestamp, nonce);
  
  // Sign the message
  const signature = await signMessage(message, privateKeyHex);
  
  // Get public key for verification
  const privateKey = hexToBytes(privateKeyHex);
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  
  return {
    message,
    signature,
    timestamp,
    nonce,
    publicKey: bytesToHex(publicKey)
  };
}

// ═══════════════════════════════════════════════════════════════
// NONCE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Clear old nonces to prevent memory growth
 * Should be called periodically in long-running applications
 */
export function clearOldNonces(): void {
  usedNonces.clear();
}

/**
 * Get current nonce count (for monitoring)
 */
export function getNonceCount(): number {
  return usedNonces.size;
}