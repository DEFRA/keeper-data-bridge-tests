import axios from 'axios'
import {
  API_KEY,
  HEALTH_ENDPOINT,
  QUERY_DATA_ENDPOINT,
  START_IMPORT_ENDPOINT,
  IMPORT_DATA_ENDPOINT,
  UPLOAD_FILE_ENDPOINT
} from './apiEndpoints.js'
import FormData from 'form-data'
import fs from 'fs'
import { start } from 'repl'

export async function checkHealthEndPoint(url) {
  const apiHealthCheckResponse = await axios.get(url + HEALTH_ENDPOINT, {
    headers: {
      'x-api-key': API_KEY
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
        'x-api-key': API_KEY
      }
    }
  )
  return startImportResponse
}

export async function getImportUsingImportId(url, importId) {
  const response = await axios.get(
    `${url}${IMPORT_DATA_ENDPOINT}/${importId}`,
    {
      headers: {
        'x-api-key': API_KEY
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
    if (response.data.status === 'Completed') {
      return response
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
      'x-api-key': API_KEY
    },
    params: queryParams
  })
  return response
}

export async function uploadEncryptedFile(url, objectKey) {
  const fileFromPath = '../../data/' + objectKey
  const form = new FormData()
  form.append('File', fs.createReadStream(fileFromPath))
  const response = await axios.post(url + UPLOAD_FILE_ENDPOINT, form, {
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/octet-stream'
    },
    params: { objectKey: objectKey }
  })
  return response
}

export async function cleanCollection(url, collectionName) {
  const response = await axios.delete(url + DELETE_COLLECTION_ENDPOINT + collectionName, {
    headers: {
      'x-api-key': API_KEY
    }
  })
  return response
}

export async function cleanInternalStorageFiles(url) {
  const response = await axios.delete(url + DELETE_INTERNAL_STORAGE_FILES_ENDPOINT, {
    headers: {
      'x-api-key': API_KEY
    }
  })
  return response
}