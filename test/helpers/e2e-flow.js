import path from 'path'
import {
  uploadEncryptedFile,
  startImport as startImportApi,
  waitForImportCompletion as waitForImportCompletionApi,
  queryData,
  getImportUsingImportId
} from './apicall.js'
import { expect } from 'chai'
import { parsePipeCsvFile } from './csvUtils.js'
import { assertRowsMatch } from './recordMatcher.js'
import { TEST_KEEPER_DATA_BRIDGE_URL} from './apiEndpoints.js'

// Resolve base URL from config or env
const BASE_URL = TEST_KEEPER_DATA_BRIDGE_URL

export async function performE2EFlow(fileName, collectionName, compositeKeyFields) {

  // clean up existing collection and internal storage files before running the test
  // (to ensure a clean state for the E2E test)
  // Note: Error handling is minimal here; in a real-world scenario, consider more robust error management    
  await cleanCollection(BASE_URL, collectionName)
  await cleanInternalStorageFiles(BASE_URL)

    // Step 1: Upload the file
  const localFilePath = path.join('../data', fileName)
  console.log(`Uploading file from path: ${localFilePath}`)
  const uploadResponse = await uploadEncryptedFile(BASE_URL, fileName, localFilePath)
  expect(uploadResponse.status).to.equal(200)
  console.log(`File ${fileName} uploaded successfully.`)

  // Step 2: Start the import
  const response = await startImportApi(BASE_URL)
  expect(response.status).to.equal(202)
  const importId = response.data.importId
  console.log(`Import started with ID: ${importId}`)

  // Step 3: Wait for import completion
  await waitForImportCompletionApi(BASE_URL, importId, 120000, 5000)
  console.log(`Import with ID: ${importId} completed.`)

  // Step 4: Verify import status
  const importData = await getImportUsingImportId(BASE_URL, importId)
  expect(importData.status).to.equal(200)
  expect(importData.data.status).to.equal('Completed')
  console.log(`Import status: ${importData.data.status}`)

  // Step 5: Query the data and perform assertions
  const queryParams = {
    $orderBy: 'UpdatedAtUtc desc'
  }
  const queryResponse = await queryData(BASE_URL, collectionName, queryParams)
  expect(queryResponse.status).to.equal(200)
  console.log('Query Response Data:', queryResponse.data)

  // --- use csvUtils and recordMatcher helpers ---
  const inFileName = fileName.replace(/\.csv$/i, '.in.csv')
  const inFilePath = path.join('../../data', inFileName)
  console.log(`Reading expected data from: ${inFilePath}`)
  const expectedRows = await parsePipeCsvFile(inFilePath)
  const actualRows = queryResponse.data?.data || []

  // delegate all assertions to recordMatcher helper
  assertRowsMatch(expectedRows, actualRows, compositeKeyFields)
}