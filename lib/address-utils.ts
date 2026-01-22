/**
 * BlackBook Address Derivation Utilities
 * Standardized L1/L2 address generation from Ed25519 public keys
 * 
 * L1 Address = L1_ + SHA256(pubkey)[0..20].hex().uppercase()
 * L2 Address = L2_ + SHA256(pubkey)[0..20].hex().uppercase() (same hash, different prefix)
 */

import { createHash } from 'crypto';

/**
 * Derive L1 address from Ed25519 public key
 * @param publicKeyHex - Public key as hex string (64 chars) or Uint8Array
 * @returns L1 address in format: L1_<40HEX>
 */
export function deriveL1Address(publicKeyHex: string | Uint8Array): string {
  // Convert to Buffer for hashing
  let pubkeyBytes: Buffer;
  if (typeof publicKeyHex === 'string') {
    pubkeyBytes = Buffer.from(publicKeyHex, 'hex');
  } else {
    pubkeyBytes = Buffer.from(publicKeyHex);
  }
  
  // SHA256 hash of public key bytes
  const hash = createHash('sha256').update(pubkeyBytes).digest();
  
  // Take first 20 bytes and convert to uppercase hex
  return `L1_${hash.slice(0, 20).toString('hex').toUpperCase()}`;
}

/**
 * Derive L2 address from Ed25519 public key
 * Uses same hash as L1 but with L2_ prefix for cross-layer compatibility
 * @param publicKeyHex - Public key as hex string (64 chars) or Uint8Array
 * @returns L2 address in format: L2_<40HEX>
 */
export function deriveL2Address(publicKeyHex: string | Uint8Array): string {
  // Convert to Buffer for hashing
  let pubkeyBytes: Buffer;
  if (typeof publicKeyHex === 'string') {
    pubkeyBytes = Buffer.from(publicKeyHex, 'hex');
  } else {
    pubkeyBytes = Buffer.from(publicKeyHex);
  }
  
  // SHA256 hash of public key bytes (same as L1)
  const hash = createHash('sha256').update(pubkeyBytes).digest();
  
  // Take first 20 bytes and convert to uppercase hex
  return `L2_${hash.slice(0, 20).toString('hex').toUpperCase()}`;
}

/**
 * Get address prefix (L1_ or L2_) from address string
 * @param address - Address to parse
 * @returns 'L1' | 'L2' | null
 */
export function getAddressType(address: string): 'L1' | 'L2' | null {
  if (address.startsWith('L1_')) return 'L1';
  if (address.startsWith('L2_')) return 'L2';
  return null;
}

/**
 * Validate address format
 * @param address - Address to validate
 * @returns true if valid L1_ or L2_ address
 */
export function validateAddress(address: string): boolean {
  // Must start with L1_ or L2_ followed by exactly 40 hex characters
  const addressRegex = /^(L1_|L2_)[0-9A-F]{40}$/;
  return addressRegex.test(address);
}

/**
 * Convert L1 address to L2 address (same hash, different prefix)
 * @param l1Address - L1 address to convert
 * @returns L2 address with same hash
 */
export function l1ToL2Address(l1Address: string): string {
  if (!l1Address.startsWith('L1_')) {
    throw new Error('Invalid L1 address format');
  }
  return l1Address.replace('L1_', 'L2_');
}

/**
 * Convert L2 address to L1 address (same hash, different prefix)
 * @param l2Address - L2 address to convert
 * @returns L1 address with same hash
 */
export function l2ToL1Address(l2Address: string): string {
  if (!l2Address.startsWith('L2_')) {
    throw new Error('Invalid L2 address format');
  }
  return l2Address.replace('L2_', 'L1_');
}

/**
 * Extract address hash (remove L1_/L2_ prefix)
 * @param address - L1 or L2 address
 * @returns 40-character hex hash
 */
export function getAddressHash(address: string): string {
  if (address.startsWith('L1_') || address.startsWith('L2_')) {
    return address.slice(3);
  }
  throw new Error('Invalid address format');
}