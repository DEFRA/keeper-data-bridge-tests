import fs from 'fs'
import path from 'path'
import AesCryptoTransform from './aes-crypto-transform.js'
import { DEV_SALT_KEY } from './api-endpoints.js'

class FileProcessor {
  constructor(rawFolderPath = null) {
    this.cryptoTransform = new AesCryptoTransform()
    // Allow custom raw folder path or use default at runtime
    this.rawFolderPath =
      rawFolderPath || path.join(process.cwd(), 'test', 'data', 'raw')
    this.defaultSalt = DEV_SALT_KEY
    // In-memory storage for processed files
    this.processedFiles = new Map() // { filename: { encrypted: Buffer, unencrypted: Buffer } }
  }

  /**
   * Generates timestamp in yyyyMMddHHmmss format
   */
  generateTimestamp() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')

    return `${year}${month}${day}${hours}${minutes}${seconds}`
  }

  /**
   * Removes existing timestamp from filename
   * Assumes format: PREFIX_TIMESTAMP.csv where TIMESTAMP is 14 digits
   */
  removeTimestamp(filename) {
    // Match pattern like LITP_SAMCPHHOLDING_20251128010101.csv
    const match = filename.match(/^(.+?)_\d{14}\.csv$/i)
    if (match) {
      return match[1] // Returns prefix like "LITP_SAMCPHHOLDING"
    }
    // If no timestamp pattern found, remove .csv extension
    return filename.replace(/\.csv$/i, '')
  }

  /**
   * Clears in-memory processed files
   */
  clearProcessedFiles() {
    this.processedFiles.clear()
  }

  /**
   * Processes all CSV files from raw folder
   */
  async processAllFiles() {
    // Ensure folders exist
    if (!fs.existsSync(this.rawFolderPath)) {
      throw new Error(`Raw folder not found: ${this.rawFolderPath}`)
    }

    // Clear in-memory storage before processing
    this.clearProcessedFiles()

    // Read all CSV files from raw folder
    const files = fs
      .readdirSync(this.rawFolderPath)
      .filter((file) => file.toLowerCase().endsWith('.csv'))

    if (files.length === 0) {
      return []
    }

    const results = []

    for (const file of files) {
      try {
        const result = await this.processFile(file)
        results.push(result)
      } catch (error) {
        results.push({ file, error: error.message })
      }
    }

    return results
  }

  /**
   * Processes a single CSV file
   */
  async processFile(filename) {
    const timestamp = this.generateTimestamp()
    const basePrefix = this.removeTimestamp(filename)

    // Generate new filenames
    const inCsvFilename = `${basePrefix}_${timestamp}.in.csv`
    const encryptedFilename = `${basePrefix}_${timestamp}.csv`

    // Define paths
    const sourcePath = path.join(this.rawFolderPath, filename)

    // Step 1: Read source file into memory as unencrypted buffer
    const unencryptedBuffer = fs.readFileSync(sourcePath)

    // Step 2: Encrypt to buffer in memory
    const password = encryptedFilename
    const encryptedBuffer = await this.encryptBuffer(
      unencryptedBuffer,
      password
    )

    // Store in memory
    this.processedFiles.set(encryptedFilename, {
      encrypted: encryptedBuffer,
      unencrypted: unencryptedBuffer,
      inCsvFilename
    })

    return {
      sourceFile: filename,
      inCsvFile: inCsvFilename,
      encryptedFile: encryptedFilename,
      timestamp,
      password: encryptedFilename,
      success: true
    }
  }

  /**
   * Encrypts a buffer using AES encryption
   */
  async encryptBuffer(inputBuffer, password) {
    const { Readable, Writable } = await import('stream')
    const chunks = []

    return new Promise((resolve, reject) => {
      const inputStream = Readable.from(inputBuffer)
      const outputStream = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(chunk)
          callback()
        }
      })

      outputStream.on('finish', () => resolve(Buffer.concat(chunks)))
      outputStream.on('error', reject)

      this.cryptoTransform
        .encryptStreamAsync(
          inputStream,
          outputStream,
          password,
          this.defaultSalt,
          inputBuffer.length
        )
        .then(() => outputStream.end())
        .catch(reject)
    })
  }

  /**
   * Gets encrypted file buffer from memory
   */
  getEncryptedFile(filename) {
    const file = this.processedFiles.get(filename)
    return file?.encrypted
  }

  /**
   * Gets unencrypted file buffer from memory
   */
  getUnencryptedFile(filename) {
    const file = this.processedFiles.get(filename)
    return file?.unencrypted
  }

  /**
   * Gets .in.csv filename for a given encrypted filename
   */
  getInCsvFilename(encryptedFilename) {
    const file = this.processedFiles.get(encryptedFilename)
    return file?.inCsvFilename
  }

  /**
   * Sets custom encryption password and salt
   */
  setEncryptionSalt(salt) {
    this.defaultSalt = salt
  }
}

export default FileProcessor
