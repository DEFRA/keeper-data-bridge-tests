import fs from 'fs'
import path from 'path'
import AesCryptoTransform from './aes-crypto-transform.js'
import { DATA_FOLDER_PATH, DEV_SALT_KEY } from './api-endpoints.js'

class FileProcessor {
  constructor() {
    this.cryptoTransform = new AesCryptoTransform()
    this.rawFolderPath = path.join(DATA_FOLDER_PATH, 'raw')
    this.dataFolderPath = path.join(DATA_FOLDER_PATH, 'encrypted')
    this.defaultSalt = DEV_SALT_KEY
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
   * Clears all files in the encrypted/output folder
   */
  clearEncryptedFolder() {
    if (fs.existsSync(this.dataFolderPath)) {
      const files = fs.readdirSync(this.dataFolderPath)
      for (const file of files) {
        const filePath = path.join(this.dataFolderPath, file)
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath)
        }
      }
    }
  }

  /**
   * Processes all CSV files from raw folder
   */
  async processAllFiles() {
    // Ensure folders exist
    if (!fs.existsSync(this.rawFolderPath)) {
      throw new Error(`Raw folder not found: ${this.rawFolderPath}`)
    }
    if (!fs.existsSync(this.dataFolderPath)) {
      fs.mkdirSync(this.dataFolderPath, { recursive: true })
    }

    // Clear encrypted folder before processing
    this.clearEncryptedFolder()

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
    const inCsvPath = path.join(this.dataFolderPath, inCsvFilename)
    const encryptedPath = path.join(this.dataFolderPath, encryptedFilename)

    // Step 1: Copy to .in.csv (unencrypted reference copy)
    fs.copyFileSync(sourcePath, inCsvPath)

    // Step 2: Encrypt the file to .csv using filename as password
    const password = encryptedFilename // Use output filename as password
    await this.cryptoTransform.encryptFileAsync(
      sourcePath,
      encryptedPath,
      password,
      this.defaultSalt
    )

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
   * Sets custom encryption password and salt
   */
  setEncryptionSalt(salt) {
    this.defaultSalt = salt
  }
}

export default FileProcessor
