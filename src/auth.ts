/**
 * Authentication and token generation utilities
 */

/**
 * Generate SHA256 hash of id + secret
 * @param id - Configuration ID
 * @param secret - Secret key
 * @returns SHA256 hash as hex string
 */
export async function generateToken(id: string, secret: string): Promise<string> {
  const data = new TextEncoder().encode(id + secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verify token for a given id and secret
 * @param id - Configuration ID
 * @param token - Token to verify
 * @param secret - Secret key
 * @returns true if token is valid
 */
export async function verifyToken(id: string, token: string, secret: string): Promise<boolean> {
  const expectedToken = await generateToken(id, secret);
  return token === expectedToken;
}

/**
 * Extract token from request headers
 * @param request - HTTP request
 * @returns token or null
 */
export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  const url = new URL(request.url);
  return url.searchParams.get('token');
}

/**
 * Extract UUID from request
 * @param request - HTTP request
 * @returns uuid or null
 */
export function extractUUID(request: Request): string | null {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  
  // Expected format: /api/config/{uuid}
  if (pathParts.length >= 3 && pathParts[0] === 'api' && pathParts[1] === 'config') {
    return pathParts[2];
  }
  
  return url.searchParams.get('uuid');
}

