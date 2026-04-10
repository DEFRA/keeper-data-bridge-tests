import axios from 'axios'
import {
  API_KEY,
  HEALTH_ENDPOINT,
  QUERY_DATA_ENDPOINT,
  START_IMPORT_ENDPOINT,
  IMPORT_DATA_ENDPOINT,
  UPLOAD_FILE_ENDPOINT,
  DELETE_COLLECTION_ENDPOINT,
  DELETE_INTERNAL_STORAGE_FILES_ENDPOINT,
  AUTHORIZATION_DEV_KEY,
  AUTHORIZATION_TEST_KEY,
  AUTHORIZATION_DEV_KEY_API,
  AUTHORIZATION_TEST_KEY_API,
  COUNTRIES_LIST_ENDPOINT,
  PARTIES_LIST_ENDPOINT,
  SITES_LIST_ENDPOINT,
  SPECIES_LIST_ENDPOINT,
  SITE_TYPES_ENDPOINT,
  CTS_DAILY_SCAN_ENDPOINT,
  SAM_DAILY_SCAN_ENDPOINT,
  CLEANSE_START_ANALYSIS_ENDPOINT,
  CLEANSE_DELETE_DATA_ENDPOINT,
  CLEANSE_DELETE_METADATA_ENDPOINT,
  CLEANSE_RUNS_ENDPOINT,
  CLEANSE_RUN_ENDPOINT,
  CLEANSE_ISSUES_ENDPOINT
} from './api-endpoints.js'
import FormData from 'form-data'
import fs from 'fs'

// Authorization keys per environment
const AUTH_KEYS = {
  dev: AUTHORIZATION_DEV_KEY,
  test: AUTHORIZATION_TEST_KEY
}

const AUTH_KEYS_API = {
  dev: AUTHORIZATION_DEV_KEY_API,
  test: AUTHORIZATION_TEST_KEY_API
}

// Derive authorization key based on environment
function getAuthorizationKey() {
  const env = (
    process.env.ENVIRONMENT !== undefined && process.env.ENVIRONMENT !== null
      ? process.env.ENVIRONMENT
      : 'dev'
  ).toLowerCase()
  const key = AUTH_KEYS[env] || AUTH_KEYS.dev
  return key
}

function getAuthorizationKeyApi() {
  const env = (
    process.env.ENVIRONMENT !== undefined && process.env.ENVIRONMENT !== null
      ? process.env.ENVIRONMENT
      : 'dev'
  ).toLowerCase()
  const key = AUTH_KEYS_API[env] || AUTH_KEYS_API.dev
  return key
}

const AUTHORIZATION_KEY = getAuthorizationKey()
const AUTHORIZATION_KEY_API = getAuthorizationKeyApi()

export async function checkHealthEndPoint(url) {
  const apiHealthCheckResponse = await axios.get(url + HEALTH_ENDPOINT, {
    headers: {
      'x-api-key': API_KEY,
      Authorization: 'ApiKey ' + AUTHORIZATION_KEY
    }
  })
  return apiHealthCheckResponse
}

export async function startImport(url) {
  const startImportResponse = await axios.post(
    url + START_IMPORT_ENDPOINT,
    null,
    {
      headers: {
        'x-api-key': API_KEY,
        Authorization: 'ApiKey ' + AUTHORIZATION_KEY
      },
      params: { sourceType: 'internal' }
    }
  )
  return startImportResponse
}

export async function getImportUsingImportId(url, importId) {
  const response = await axios.get(
    `${url}${IMPORT_DATA_ENDPOINT}/${importId}`,
    {
      headers: {
        'x-api-key': API_KEY,
        Authorization: 'ApiKey ' + AUTHORIZATION_KEY
      }
    }
  )
  return response
}

export async function waitForImportCompletion(
  url,
  importId,
  timeout = 60000,
  interval = 5000
) {
  const startTime = Date.now()
  while (Date.now() - startTime < timeout) {
    const response = await getImportUsingImportId(url, importId)
    const status = response.data.status

    if (status === 'Completed') {
      return response
    }

    if (status === 'Failed') {
      throw new Error(`Import with ID ${importId} failed during processing.`)
    }

    await new Promise((resolve) => setTimeout(resolve, interval))
  }
  throw new Error(
    `Import with ID ${importId} did not complete within ${timeout} ms`
  )
}

export async function queryData(url, collectionName, queryParams) {
  const response = await axios.get(url + QUERY_DATA_ENDPOINT + collectionName, {
    headers: {
      'x-api-key': API_KEY,
      Authorization: 'ApiKey ' + AUTHORIZATION_KEY
    },
    params: queryParams
  })
  return response
}

export async function uploadEncryptedFile(url, objectKey, fileBuffer) {
  const form = new FormData()

  // Accept either Buffer or file path (for backwards compatibility)
  if (Buffer.isBuffer(fileBuffer)) {
    form.append('File', fileBuffer, objectKey)
  } else {
    // Legacy: file path provided
    form.append('File', fs.createReadStream(fileBuffer))
  }

  const response = await axios.post(url + UPLOAD_FILE_ENDPOINT, form, {
    headers: {
      'x-api-key': API_KEY,
      Authorization: 'ApiKey ' + AUTHORIZATION_KEY,
      ...form.getHeaders()
    },
    params: { objectKey }
  })
  return response
}

export async function cleanCollection(url, collectionName) {
  const response = await axios.delete(
    url + DELETE_COLLECTION_ENDPOINT + collectionName,
    {
      headers: {
        'x-api-key': API_KEY,
        Authorization: 'ApiKey ' + AUTHORIZATION_KEY
      }
    }
  )
  return response
}

export async function cleanInternalStorageFiles(
  url,
  queryParams = { sourceType: 'internal' }
) {
  const response = await axios.delete(
    url + DELETE_INTERNAL_STORAGE_FILES_ENDPOINT,
    {
      headers: {
        'x-api-key': API_KEY,
        Authorization: 'ApiKey ' + AUTHORIZATION_KEY
      },
      params: queryParams
    }
  )
  return response
}

export async function getCountriesList(url, queryParams = {}) {
  const response = await axios.get(url + COUNTRIES_LIST_ENDPOINT, {
    headers: {
      'x-api-key': API_KEY,
      Authorization: 'Basic ' + AUTHORIZATION_KEY_API
    },
    params: queryParams
  })
  return response
}

export async function getCountryDetailsById(url, countryId) {
  const response = await axios.get(
    `${url + COUNTRIES_LIST_ENDPOINT}/${countryId}`,
    {
      headers: {
        'x-api-key': API_KEY,
        Authorization: 'Basic ' + AUTHORIZATION_KEY_API
      }
    }
  )
  return response
}

export async function getPartiesList(url, queryParams = {}) {
  const response = await axios.get(url + PARTIES_LIST_ENDPOINT, {
    headers: {
      'x-api-key': API_KEY,
      Authorization: 'Basic ' + AUTHORIZATION_KEY_API
    },
    params: queryParams
  })
  return response
}

export async function getPartyDetailsById(url, partyId) {
  const response = await axios.get(
    `${url + PARTIES_LIST_ENDPOINT}/${partyId}`,
    {
      headers: {
        'x-api-key': API_KEY,
        Authorization: 'Basic ' + AUTHORIZATION_KEY_API
      }
    }
  )
  return response
}

export async function getSitesList(url, queryParams = {}) {
  const response = await axios.get(url + SITES_LIST_ENDPOINT, {
    headers: {
      'x-api-key': API_KEY,
      Authorization: 'Basic ' + AUTHORIZATION_KEY_API
    },
    params: queryParams
  })
  return response
}

export async function getSpeciesList(url, queryParams = {}) {
  const response = await axios.get(url + SPECIES_LIST_ENDPOINT, {
    headers: {
      'x-api-key': API_KEY,
      Authorization: 'Basic ' + AUTHORIZATION_KEY_API
    },
    params: queryParams
  })
  return response
}

export async function getSpeciesDetailsById(url, speciesId) {
  const response = await axios.get(
    `${url + SPECIES_LIST_ENDPOINT}/${speciesId}`,
    {
      headers: {
        'x-api-key': API_KEY,
        Authorization: 'Basic ' + AUTHORIZATION_KEY_API
      }
    }
  )
  return response
}

export async function getSiteTypes(url) {
  const response = await axios.get(url + SITE_TYPES_ENDPOINT, {
    headers: {
      'x-api-key': API_KEY,
      Authorization: 'Basic ' + AUTHORIZATION_KEY_API
    }
  })
  return response
}

export async function getSiteDetailsById(url, siteId) {
  const response = await axios.get(`${url + SITES_LIST_ENDPOINT}/${siteId}`, {
    headers: {
      'x-api-key': API_KEY,
      Authorization: 'Basic ' + AUTHORIZATION_KEY_API
    }
  })
  return response
}
export async function startCtsDailyScanImport(url) {
  const startImportResponse = await axios.post(
    url + CTS_DAILY_SCAN_ENDPOINT,
    null,
    {
      headers: {
        'x-api-key': API_KEY,
        Authorization: 'Basic ' + AUTHORIZATION_KEY_API
      },
      params: { sourceType: 'CtsDailyScan' }
    }
  )
  return startImportResponse
}

export async function startSamDailyScanImport(url) {
  const startImportResponse = await axios.post(
    url + SAM_DAILY_SCAN_ENDPOINT,
    null,
    {
      headers: {
        'x-api-key': API_KEY,
        Authorization: 'Basic ' + AUTHORIZATION_KEY_API
      },
      params: { sourceType: 'SamDailyScan' }
    }
  )
  return startImportResponse
}

export async function startCleanseAnalysis(url, payload) {
  const response = await axios.post(
    url + CLEANSE_START_ANALYSIS_ENDPOINT,
    payload,
    {
      headers: {
        'x-api-key': API_KEY,
        Authorization: 'ApiKey ' + AUTHORIZATION_KEY,
        'Content-Type': 'application/json'
      }
    }
  )
  return response
}

export async function deleteCleanseData(url) {
  const response = await axios.post(url + CLEANSE_DELETE_DATA_ENDPOINT, null, {
    headers: {
      'x-api-key': API_KEY,
      Authorization: 'ApiKey ' + AUTHORIZATION_KEY
    }
  })
  return response
}

export async function deleteCleanseMetadata(url) {
  const response = await axios.post(
    url + CLEANSE_DELETE_METADATA_ENDPOINT,
    null,
    {
      headers: {
        'x-api-key': API_KEY,
        Authorization: 'ApiKey ' + AUTHORIZATION_KEY
      }
    }
  )
  return response
}

export async function getCleanseRuns(url) {
  const response = await axios.get(url + CLEANSE_RUNS_ENDPOINT, {
    headers: {
      'x-api-key': API_KEY,
      Authorization: 'ApiKey ' + AUTHORIZATION_KEY
    }
  })
  return response
}

export async function getCleanseRunDetails(url, operationId) {
  const response = await axios.get(
    url + CLEANSE_RUN_ENDPOINT.replace('{operationId}', operationId),
    {
      headers: {
        'x-api-key': API_KEY,
        Authorization: 'ApiKey ' + AUTHORIZATION_KEY
      }
    }
  )
  return response
}

export async function getCleanseIssues(url, queryParams = {}) {
  const response = await axios.get(url + CLEANSE_ISSUES_ENDPOINT, {
    headers: {
      'x-api-key': API_KEY,
      Authorization: 'ApiKey ' + AUTHORIZATION_KEY
    },
    params: queryParams
  })
  return response
}

export async function waitForCleanseCompletion(
  url,
  operationId,
  timeout = 180000
) {
  // If operationId is not provided, try to infer the latest run
  if (!operationId) {
    const runsResponse = await getCleanseRuns(url)
    const runs = runsResponse.data
    let latestRun = null

    if (Array.isArray(runs) && runs.length > 0) {
      latestRun = runs[0]
    } else if (
      runs?.values &&
      Array.isArray(runs.values) &&
      runs.values.length > 0
    ) {
      latestRun = runs.values[0]
    }

    operationId = latestRun?.operationId || latestRun?.id
    if (!operationId) {
      throw new Error(
        'Unable to determine cleanse operationId for completion check'
      )
    }
  }

  const startTime = Date.now()
  while (Date.now() - startTime < timeout) {
    let response
    try {
      response = await getCleanseRunDetails(url, operationId)
    } catch (error) {
      const statusCode = error?.response?.status

      // If the backend is still initialising the run details, transient 4xx/5xx
      // errors can occur. Log and retry until timeout instead of failing fast.
      if (statusCode === 404 || (statusCode >= 500 && statusCode < 600)) {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        continue
      }

      // For other errors, surface them to the caller
      throw error
    }

    const status = String(response.data.status || '').toLowerCase()

    if (status === 'completed') {
      return response
    }
    if (status === 'failed') {
      throw new Error(
        `Cleanse operation ${operationId} failed during processing`
      )
    }
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
  throw new Error(
    'Cleanse operation did not complete within the timeout period'
  )
}
