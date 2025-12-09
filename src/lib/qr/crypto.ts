import crypto from 'crypto';

const QR_ROTATION_INTERVAL = 10; // seconds
const ENCRYPTION_KEY = process.env.QR_ENCRYPTION_KEY || 'default-32-char-key-for-dev-only!';

export function generateSessionSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateTOTP(secret: string, timestamp?: number): string {
  const time = timestamp || Math.floor(Date.now() / 1000);
  const counter = Math.floor(time / QR_ROTATION_INTERVAL);
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(counter.toString());
  return hmac.digest('hex').substring(0, 16);
}

export function generateQRPayload(sessionId: string, secret: string): string {
  const totp = generateTOTP(secret);
  const timestamp = Date.now();
  
  const payload = JSON.stringify({ sid: sessionId, t: totp, ts: timestamp });
  
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(payload, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');
  
  return `${iv.toString('base64')}.${encrypted}.${authTag}`;
}

export function verifyQRPayload(
  encryptedPayload: string, 
  sessionSecret: string
): { valid: boolean; sessionId?: string; reason?: string } {
  try {
    const parts = encryptedPayload.split('.');
    if (parts.length !== 3) {
      return { valid: false, reason: 'Formato inválido' };
    }
    
    const [ivB64, encrypted, authTagB64] = parts;
    
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    const { sid, t, ts } = JSON.parse(decrypted);
    
    // Check timestamp (max 20 seconds tolerance)
    if (Date.now() - ts > 20000) {
      return { valid: false, reason: 'Código QR expirado' };
    }
    
    // Verify TOTP with ±1 interval window
    const currentTime = Math.floor(Date.now() / 1000);
    for (let offset = -1; offset <= 1; offset++) {
      const checkTime = currentTime + (offset * QR_ROTATION_INTERVAL);
      const expectedTotp = generateTOTP(sessionSecret, checkTime);
      if (t === expectedTotp) {
        return { valid: true, sessionId: sid };
      }
    }
    
    return { valid: false, reason: 'Token inválido' };
  } catch (error) {
    return { valid: false, reason: 'Error de verificación' };
  }
}

// Alias for backwards compatibility
export const encryptQRPayload = generateQRPayload;

export function calculateDistance(
  lat1: number, lon1: number, 
  lat2: number, lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
