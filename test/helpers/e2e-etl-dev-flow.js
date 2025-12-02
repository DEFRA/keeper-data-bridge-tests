import path from 'path'
import fs from 'fs'
import {
  uploadEncryptedFile,
  startImport as startImportApi,
  waitForImportCompletion as waitForImportCompletionApi,
  queryData,
  getImportUsingImportId,
  cleanCollection,
  cleanInternalStorageFiles
} from './api-call.js'
import { expect } from 'chai'
import { parsePipeCsvFile } from './csv-utils.js'
import { assertRowsMatch } from './record-matcher.js'
import {
  TEST_KEEPER_DATA_BRIDGE_URL,
  DATA_FOLDER_PATH
} from './api-endpoints.js'

// Resolve base URL from config or env
const BASE_URL = TEST_KEEPER_DATA_BRIDGE_URL

/**
 * Finds the latest file matching the pattern
 * @param {string} fileNamePattern - Pattern like "LITP_SAMCPHHOLDING_{0}.csv"
 * @returns {string} - Actual filename with timestamp
 */
function findLatestFile(fileNamePattern) {
  const dataDir = path.join(DATA_FOLDER_PATH, 'encrypted')
  const regexPattern = fileNamePattern.replace('{0}', '(\\d{14})')
  const regex = new RegExp(`^${regexPattern}$`, 'i')

  const files = fs
    .readdirSync(dataDir)
    .filter((file) => regex.test(file))
    .sort()
    .reverse() // Sort descending to get latest timestamp

  if (files.length === 0) {
    throw new Error(`No files found matching pattern: ${fileNamePattern}`)
  }

  return files[0]
}

export async function performE2EFlow(
  fileNamePattern,
  collectionName,
  compositeKeyFields
) {
  // Find the latest file matching the pattern
  const fileName = findLatestFile(fileNamePattern)

  // clean up existing collection and storage files before running the test
  // (to ensure a clean state for the E2E test)
  await cleanCollection(BASE_URL, collectionName)
  await cleanInternalStorageFiles(BASE_URL, { sourceType: 'internal' })
  await cleanInternalStorageFiles(BASE_URL, { sourceType: 'external' })

  // Step 1: Upload the file
  const localFilePath = path.join(DATA_FOLDER_PATH, 'raw', fileName)
  const uploadResponse = await uploadEncryptedFile(
    BASE_URL,
    fileName,
    localFilePath
  )
  expect(uploadResponse.status).to.equal(200)

  // Step 2: Start the import
  const response = await startImportApi(BASE_URL)
  expect(response.status).to.equal(202)
  const importId = response.data.importId

  // Step 3: Wait for import completion
  await waitForImportCompletionApi(BASE_URL, importId, 120000, 5000)

  // Step 4: Verify import status
  const importData = await getImportUsingImportId(BASE_URL, importId)
  expect(importData.status).to.equal(200)
  expect(importData.data.status).to.equal('Completed')

  // Step 5: Query the data and perform assertions
  const queryParams = {
    $orderBy: 'UpdatedAtUtc desc'
  }
  const queryResponse = await queryData(BASE_URL, collectionName, queryParams)
  expect(queryResponse.status).to.equal(200)

  // --- use csvUtils and recordMatcher helpers ---
  const inFileName = fileName.replace(/\.csv$/i, '.in.csv')
  const inFilePath = path.join(DATA_FOLDER_PATH, 'encrypted', inFileName)
  const expectedRows = await parsePipeCsvFile(inFilePath)
  const actualRows = queryResponse.data?.data || []

  // delegate all assertions to recordMatcher helper
  assertRowsMatch(expectedRows, actualRows, compositeKeyFields)
}
