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
  COUNTRIES_LIST_ENDPOINT,
  PARTIES_LIST_ENDPOINT
} from './api-endpoints.js'
import FormData from 'form-data'
import fs from 'fs'

// Authorization keys per environment
const AUTH_KEYS = {
  dev: AUTHORIZATION_DEV_KEY,
  test: AUTHORIZATION_TEST_KEY
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

const AUTHORIZATION_KEY = getAuthorizationKey()

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
      Authorization: 'ApiKey ' + AUTHORIZATION_KEY
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
        Authorization: 'ApiKey ' + AUTHORIZATION_KEY
      }
    }
  )
  return response
}

export async function getPartiesList(url, queryParams = {}) {
  const response = await axios.get(url + PARTIES_LIST_ENDPOINT, {
    headers: {
      'x-api-key': API_KEY,
      Authorization: 'ApiKey ' + AUTHORIZATION_KEY
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
        Authorization: 'ApiKey ' + AUTHORIZATION_KEY
      }
    }
  )
  return response
}

export async function getSitesList(url, queryParams = {}) {
  const response = await axios.get(url + SITES_LIST_ENDPOINT, {
    headers: {
      'x-api-key': API_KEY,
      Authorization: 'ApiKey ' + AUTHORIZATION_KEY
    },
    params: queryParams
  })
  return response
}

export async function getSiteDetailsById(url, siteId) {
  const response = await axios.get(`${url + SITES_LIST_ENDPOINT}/${siteId}`, {
    headers: {
      'x-api-key': API_KEY,
      Authorization: 'ApiKey ' + AUTHORIZATION_KEY
    }
  })
  return response
}
