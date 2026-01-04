import crypto from 'crypto'

// Try to get key from environment, fallback to generating one (not recommended for production)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || (() => {
  console.warn('⚠️  WARNING: ENCRYPTION_KEY not found in environment. Using temporary key.')
  console.warn('⚠️  Please set ENCRYPTION_KEY in .env or Admin API Settings!')
  return crypto.randomBytes(32).toString('hex')
})()

const ENCRYPTION_IV_LENGTH = 16

/**
 * Encrypt sensitive data (e.g., tax ID, bank account)
 */
export function encrypt(text: string): string {
  if (!text) return ''
  
  const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH)
  const key = Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32) // Ensure 32 bytes
  
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  // Return format: iv:encryptedData
  return iv.toString('hex') + ':' + encrypted
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return ''
  
  try {
    const parts = encryptedText.split(':')
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format')
    }
    
    const iv = Buffer.from(parts[0], 'hex')
    const encryptedData = parts[1]
    const key = Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32) // Ensure 32 bytes
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    return ''
  }
}

/**
 * Hash sensitive data (one-way, for comparison only)
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex')
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}
