/**
 * Server-side Signature Verification Utilities
 * For use in Next.js API routes and server components
 * Provides secure signature verification with timestamp and replay protection
 */

import { verifySignature, createCanonicalMessage } from './signature-utils';

// ═══════════════════════════════════════════════════════════════
// SERVER-SIDE VERIFICATION
// ═══════════════════════════════════════════════════════════════

/**
 * Standard signature verification for API requests
 * @param request - The incoming request body
 * @param expectedDomain - Expected domain prefix (e.g., "BLACKBOOK_L1")
 * @returns Object with verification status and user info
 */
export async function verifyApiRequest(request: {
  public_key: string;
  signature: string;
  timestamp: number;
  nonce: string;
  operation_type: string;
  payload_hash: string;
}, expectedDomain: string = 'BLACKBOOK_L1'): Promise<{
  isValid: boolean;
  publicKey: string;
  address?: string;
  error?: string;
}> {
  try {
    const { public_key, signature, timestamp, nonce, operation_type, payload_hash } = request;
    
    // Validate required fields
    if (!public_key || !signature || !timestamp || !nonce || !operation_type || !payload_hash) {
      return {
        isValid: false,
        publicKey: public_key || '',
        error: 'Missing required fields'
      };
    }
    
    // Create the canonical message that was signed
    const message = createCanonicalMessage(
      expectedDomain,
      operation_type,
      payload_hash,
      timestamp,
      nonce
    );
    
    // Verify the signature
    await verifySignature(public_key, signature, message, timestamp);
    
    return {
      isValid: true,
      publicKey: public_key
    };
    
  } catch (error) {
    return {
      isValid: false,
      publicKey: request.public_key || '',
      error: error instanceof Error ? error.message : 'Verification failed'
    };
  }
}

/**
 * Verify settlement operation signatures
 * @param request - Settlement request with L2 operator signature
 * @param expectedL2PublicKey - Expected L2 operator public key
 * @returns Verification result
 */
export async function verifySettlementRequest(request: {
  l2_public_key: string;
  l2_signature: string;
  timestamp: number;
  nonce: string;
  operation_type: string;
  payload_hash: string;
  request_path: string;
}, expectedL2PublicKey: string): Promise<{
  isValid: boolean;
  error?: string;
}> {
  try {
    const { 
      l2_public_key, 
      l2_signature, 
      timestamp, 
      nonce, 
      operation_type, 
      payload_hash,
      request_path 
    } = request;
    
    // Verify L2 operator public key
    if (l2_public_key !== expectedL2PublicKey) {
      return {
        isValid: false,
        error: 'Invalid L2 operator public key'
      };
    }
    
    // Create the domain-specific message that was signed
    const domainPrefix = `BLACKBOOK_L1${request_path}`;
    const message = createCanonicalMessage(
      domainPrefix,
      operation_type,
      payload_hash,
      timestamp,
      nonce
    );
    
    // Verify the L2 operator's signature
    await verifySignature(l2_public_key, l2_signature, message, timestamp);
    
    return { isValid: true };
    
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Settlement verification failed'
    };
  }
}

/**
 * Verify user betting signatures with payload validation
 * @param request - Betting request with user signature
 * @param expectedPayload - Expected payload fields for validation
 * @returns Verification result with user identity
 */
export async function verifyBettingRequest(request: {
  public_key: string;
  signature: string;
  timestamp: number;
  nonce: string;
  operation_type: string;
  payload_hash: string;
  payload_fields: Record<string, any>;
}, expectedPayload?: Partial<Record<string, any>>): Promise<{
  isValid: boolean;
  publicKey: string;
  payloadFields: Record<string, any>;
  error?: string;
}> {
  try {
    const { 
      public_key, 
      signature, 
      timestamp, 
      nonce, 
      operation_type, 
      payload_hash,
      payload_fields 
    } = request;
    
    // Validate payload if expected values provided
    if (expectedPayload) {
      for (const [key, expectedValue] of Object.entries(expectedPayload)) {
        if (payload_fields[key] !== expectedValue) {
          return {
            isValid: false,
            publicKey: public_key,
            payloadFields: payload_fields,
            error: `Invalid payload field: ${key}`
          };
        }
      }
    }
    
    // Create canonical message for verification
    const message = createCanonicalMessage(
      'BLACKBOOK_L2',
      operation_type,
      payload_hash,
      timestamp,
      nonce
    );
    
    // Verify signature
    await verifySignature(public_key, signature, message, timestamp);
    
    return {
      isValid: true,
      publicKey: public_key,
      payloadFields: payload_fields
    };
    
  } catch (error) {
    return {
      isValid: false,
      publicKey: request.public_key || '',
      payloadFields: request.payload_fields || {},
      error: error instanceof Error ? error.message : 'Betting verification failed'
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// RATE LIMITING & SECURITY
// ═══════════════════════════════════════════════════════════════

// Simple in-memory rate limiting (production should use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for a public key
 * @param publicKey - User's public key
 * @param maxRequests - Max requests per window (default: 100)
 * @param windowMs - Time window in milliseconds (default: 1 minute)
 * @returns True if within rate limit
 */
export function checkRateLimit(
  publicKey: string, 
  maxRequests: number = 100, 
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const key = publicKey.toLowerCase();
  
  const existing = rateLimitMap.get(key);
  
  if (!existing || now > existing.resetTime) {
    // First request or window expired
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }
  
  if (existing.count >= maxRequests) {
    return false;
  }
  
  existing.count++;
  return true;
}

/**
 * Clear old rate limit entries
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Express/Next.js middleware for signature verification
 * @param expectedDomain - Expected signing domain
 * @param rateLimitConfig - Optional rate limiting config
 * @returns Middleware function
 */
export function createSignatureMiddleware(
  expectedDomain: string = 'BLACKBOOK_L1',
  rateLimitConfig?: { maxRequests: number; windowMs: number }
) {
  return async (request: any) => {
    // Check rate limit first
    if (rateLimitConfig && request.public_key) {
      const withinLimit = checkRateLimit(
        request.public_key,
        rateLimitConfig.maxRequests,
        rateLimitConfig.windowMs
      );
      
      if (!withinLimit) {
        throw new Error('Rate limit exceeded');
      }
    }
    
    // Verify signature
    const verification = await verifyApiRequest(request, expectedDomain);
    
    if (!verification.isValid) {
      throw new Error(verification.error || 'Invalid signature');
    }
    
    return verification;
  };
}