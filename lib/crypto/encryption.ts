import crypto from 'crypto'

/**
 * Encryption Utility for sensitive data (e.g., supplier credentials)
 * Uses AES-256-CBC encryption
 */

const ALGORITHM = 'aes-256-cbc'
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  throw new Error(
    'ENCRYPTION_KEY must be set in environment variables and be 64 characters (32 bytes hex)'
  )
}

// Convert hex string to buffer
const KEY = Buffer.from(ENCRYPTION_KEY, 'hex')

/**
 * Encrypt a string value
 * @param text - Plain text to encrypt
 * @returns Object with encrypted text and IV
 */
export function encrypt(text: string): { encrypted: string; iv: string } {
  try {
    // Generate random initialization vector
    const iv = crypto.randomBytes(16)
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
    
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
    // Convert IV from hex
    const ivBuffer = Buffer.from(iv, 'hex')
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, ivBuffer)
    
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
