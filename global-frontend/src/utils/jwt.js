// Decodes a JWT's payload without verifying its signature (verification happens server-side).
// Used only to read non-sensitive fields like userId for client-side filtering.
export function decodeJwtPayload(token) {
    try {
        const payload = token.split('.')[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}