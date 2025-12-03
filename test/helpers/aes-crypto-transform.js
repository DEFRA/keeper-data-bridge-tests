import crypto from 'crypto'
import fs from 'fs'

class AesCryptoTransform {
  constructor() {
    this.PBE_KEY_SPEC_ITERATIONS_DEFAULT = 32
    this.PBE_KEY_SPEC_KEY_LEN_DEFAULT = 256
    this.BUFFER_SIZE = 64 * 1024
    this.PROGRESS_REPORT_INTERVAL = 1
  }

  async encryptFileAsync(
    inputFilePath,
    outputFilePath,
    password,
    salt,
    progressCallback = null,
    cancellationToken = null
  ) {
    // Handle salt parameter - can be string or Buffer
    const saltBytes =
      typeof salt === 'string'
        ? salt
          ? Buffer.from(salt, 'utf8')
          : Buffer.alloc(0)
        : salt

    if (!fs.existsSync(inputFilePath)) {
      throw new Error(`Input file not found: ${inputFilePath}`)
    }

    const stats = fs.statSync(inputFilePath)
    const totalBytes = stats.size

    const inputStream = fs.createReadStream(inputFilePath)
    const outputStream = fs.createWriteStream(outputFilePath)

    try {
      await this.encryptStreamAsync(
        inputStream,
        outputStream,
        password,
        saltBytes,
        totalBytes,
        progressCallback,
        cancellationToken
      )
    } finally {
      inputStream.destroy()
      outputStream.end()
    }
  }

  async decryptFileAsync(
    inputFilePath,
    outputFilePath,
    password,
    salt,
    progressCallback = null,
    cancellationToken = null
  ) {
    // Handle salt parameter - can be string or Buffer
    const saltBytes =
      typeof salt === 'string'
        ? salt
          ? Buffer.from(salt, 'utf8')
          : Buffer.alloc(0)
        : salt

    if (!fs.existsSync(inputFilePath)) {
      throw new Error(`Input file not found: ${inputFilePath}`)
    }

    const stats = fs.statSync(inputFilePath)
    const totalBytes = stats.size

    const inputStream = fs.createReadStream(inputFilePath)
    const outputStream = fs.createWriteStream(outputFilePath)

    try {
      await this.decryptStreamAsync(
        inputStream,
        outputStream,
        password,
        saltBytes,
        totalBytes,
        progressCallback,
        cancellationToken
      )
    } finally {
      inputStream.destroy()
      outputStream.end()
    }
  }

  async encryptStreamAsync(
    inputStream,
    outputStream,
    password,
    salt,
    totalBytes = null,
    progressCallback = null,
    cancellationToken = null
  ) {
    // Handle salt parameter - can be string or Buffer
    const saltBytes =
      typeof salt === 'string'
        ? salt
          ? Buffer.from(salt, 'utf8')
          : Buffer.alloc(0)
        : salt

    const key = this._deriveKey(password, saltBytes)

    // AES with ECB mode and PKCS7 padding
    const cipher = crypto.createCipheriv('aes-256-ecb', key, null)
    cipher.setAutoPadding(true)

    await this._processStreamAsync(
      inputStream,
      cipher,
      outputStream,
      totalBytes,
      progressCallback,
      'Encrypting',
      cancellationToken
    )
  }

  async decryptStreamAsync(
    inputStream,
    outputStream,
    password,
    salt,
    totalBytes = null,
    progressCallback = null,
    cancellationToken = null
  ) {
    // Handle salt parameter - can be string or Buffer
    const saltBytes =
      typeof salt === 'string'
        ? salt
          ? Buffer.from(salt, 'utf8')
          : Buffer.alloc(0)
        : salt

    const key = this._deriveKey(password, saltBytes)

    // AES with ECB mode and PKCS7 padding
    const decipher = crypto.createDecipheriv('aes-256-ecb', key, null)
    decipher.setAutoPadding(true)

    await this._processStreamAsync(
      inputStream,
      decipher,
      outputStream,
      totalBytes,
      progressCallback,
      'Decrypting',
      cancellationToken
    )
  }

  _deriveKey(password, salt) {
    let actualSalt = salt

    if (salt.length === 0) {
      actualSalt = Buffer.alloc(8)
    } else if (salt.length < 8) {
      actualSalt = Buffer.alloc(8)
      salt.copy(actualSalt, 0, 0, salt.length)
    }

    // Using PBKDF2 with SHA1 (matching the C# implementation)
    return crypto.pbkdf2Sync(
      password,
      actualSalt,
      this.PBE_KEY_SPEC_ITERATIONS_DEFAULT,
      this.PBE_KEY_SPEC_KEY_LEN_DEFAULT / 8,
      'sha1'
    )
  }

  async _processStreamAsync(
    inputStream,
    transformStream,
    outputStream,
    totalBytes,
    progressCallback,
    operation,
    cancellationToken
  ) {
    return new Promise((resolve, reject) => {
      let totalBytesProcessed = 0
      let lastReportedProgress = -1

      if (progressCallback) {
        progressCallback(0, `${operation} started`)
      }

      // Check for cancellation
      if (cancellationToken && cancellationToken.isCancelled) {
        reject(new Error('Operation cancelled'))
        return
      }

      inputStream.on('data', (chunk) => {
        totalBytesProcessed += chunk.length

        if (totalBytes && totalBytes > 0 && progressCallback) {
          const progressPercentage = Math.floor(
            (totalBytesProcessed * 100) / totalBytes
          )

          if (
            progressPercentage !== lastReportedProgress &&
            progressPercentage % this.PROGRESS_REPORT_INTERVAL === 0
          ) {
            progressCallback(
              progressPercentage,
              `${operation} ${progressPercentage}% - ${this._formatBytes(totalBytesProcessed)} of ${this._formatBytes(totalBytes)}`
            )
            lastReportedProgress = progressPercentage
          }
        } else if (progressCallback) {
          progressCallback(
            0,
            `${operation} - ${this._formatBytes(totalBytesProcessed)} processed`
          )
        }

        // Check for cancellation during processing
        if (cancellationToken && cancellationToken.isCancelled) {
          inputStream.destroy()
          transformStream.destroy()
          outputStream.destroy()
          reject(new Error('Operation cancelled'))
        }
      })

      inputStream.on('error', (error) => {
        reject(error)
      })

      transformStream.on('error', (error) => {
        reject(error)
      })

      outputStream.on('error', (error) => {
        reject(error)
      })

      outputStream.on('finish', () => {
        if (progressCallback) {
          progressCallback(
            100,
            `${operation} completed - ${this._formatBytes(totalBytesProcessed)} processed`
          )
        }
        resolve()
      })

      // Pipe the streams
      inputStream.pipe(transformStream).pipe(outputStream)
    })
  }

  _formatBytes(bytes) {
    const KB = 1024
    const MB = KB * 1024
    const GB = MB * 1024

    if (bytes >= GB) {
      return `${(bytes / GB).toFixed(2)} GB`
    } else if (bytes >= MB) {
      return `${(bytes / MB).toFixed(2)} MB`
    } else if (bytes >= KB) {
      return `${(bytes / KB).toFixed(2)} KB`
    } else {
      return `${bytes} bytes`
    }
  }
}

export default AesCryptoTransform
