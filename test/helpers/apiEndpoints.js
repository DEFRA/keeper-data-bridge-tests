export const KEEPER_DATA_BRIDGE_URL = `https://ls-keeper-data-bridge-backend.${process.env.ENVIRONMENT}.cdp-int.defra.cloud`
export const KEEPER_DATA_API_URL = `https://ls-keeper-data-api.${process.env.ENVIRONMENT}.cdp-int.defra.cloud`
export const KEEPER_DATA_BRIDGE_EPHEMERAL_URL = `https://ephemeral-protected.api.dev.cdp-int.defra.cloud/ls-keeper-data-bridge-backend`
export const KEEPER_DATA_API_EPHEMERAL_URL = `https://ephemeral-protected.api.dev.cdp-int.defra.cloud/ls-keeper-data-api`
export const KEEPER_DATA_BRIDGE_DEV_URL = `https://ls-keeper-data-bridge-backend.dev.cdp-int.defra.cloud`
export const API_KEY = 'F5xpl5FOlALPeYH41Dsl1iQ8QIc7CkJe'
export const AUTHORIZATION_DEV_KEY =
  'cQG11tkBL8Xd9GTCkOjZn8-0ReAnw0cdfRDfuPr8E8nb9xdRJaKz8lEe5qUDYOP0'
export const AUTHORIZATION_TEST_KEY =
  'fnCmW0bc_PraXU0B4XkDi4lQ2i1jSemsaQRR076oZw_bD9iSKnqeyt8qF8GxGNb5'
export const HEALTH_ENDPOINT = '/health'
export const IMPORT_DATA_ENDPOINT = '/api/Import'
export const QUERY_DATA_ENDPOINT = '/api/query/'
export const START_IMPORT_ENDPOINT = '/api/Import/start'
export const UPLOAD_FILE_ENDPOINT = '/api/ExternalCatalogue/upload'
export const DELETE_COLLECTION_ENDPOINT = '/api/Import/collections/'
export const DELETE_INTERNAL_STORAGE_FILES_ENDPOINT =
  '/api/Import/internal-storage'
export const TEST_KEEPER_DATA_BRIDGE_URL = KEEPER_DATA_BRIDGE_EPHEMERAL_URL

// Derive environment from environment variables
export async function getEnvironment() {
  const env = (
    process.env.Environment !== undefined && process.env.Environment !== null
      ? process.env.Environment
      : 'dev'
  ).toLowerCase()
  console.log(`Detected environment: ${env}`)
  return env
}
