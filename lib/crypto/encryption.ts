import crypto from 'crypto'

/**
 * Encryption Utility for sensitive data (e.g., supplier credentials)
 * Uses AES-256-CBC encryption
 */

const ALGORITHM = 'aes-256-cbc'

/**
 * Get encryption key from environment
 * IMPORTANT: Read at runtime, not at module load time!
 */
function getEncryptionKey(): string {
  if (!process.env.ENCRYPTION_KEY) {
    console.error('⚠️  CRITICAL: ENCRYPTION_KEY not found in environment!')
    throw new Error('ENCRYPTION_KEY must be set in environment variables')
  }
  
  if (process.env.ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 characters (32 bytes hex)')
  }
  
  return process.env.ENCRYPTION_KEY
}

/**
 * Encrypt a string value
 * @param text - Plain text to encrypt
 * @param existingIv - Optional: Use existing IV (hex string) instead of generating new one
 * @returns Object with encrypted text and IV
 */
export function encrypt(text: string, existingIv?: string): { encrypted: string; iv: string } {
  try {
    // Get encryption key at runtime
    const key = Buffer.from(getEncryptionKey(), 'hex')
    
    // Use existing IV or generate new one
    const iv = existingIv ? Buffer.from(existingIv, 'hex') : crypto.randomBytes(16)
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return {
      encrypted,
      iv: iv.toString('hex'),
    }
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt an encrypted string
 * @param encrypted - Encrypted text (hex string)
 * @param iv - Initialization vector (hex string)
 * @returns Decrypted plain text
 */
export function decrypt(encrypted: string, iv: string): string {
  try {
    // Get encryption key at runtime
    const key = Buffer.from(getEncryptionKey(), 'hex')
    
    // Convert IV from hex
    const ivBuffer = Buffer.from(iv, 'hex')
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer)
    
    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Generate a random encryption key
 * Use this once to generate ENCRYPTION_KEY for .env
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Hash a password using bcrypt-style approach
 * (Not for encryption, but for password verification)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':')
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return hash === verifyHash
}
