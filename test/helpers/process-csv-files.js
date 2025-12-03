import FileProcessor from './file-processor.js'

// Run if executed directly
import { fileURLToPath } from 'url'

async function main() {
  try {
    const processor = new FileProcessor()
    await processor.processAllFiles()
  } catch (error) {
    process.exit(1)
  }
}
const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
  main()
}

export { main }
