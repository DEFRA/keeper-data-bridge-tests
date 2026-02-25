export const KEEPER_DATA_BRIDGE_URL = `https://ls-keeper-data-bridge-backend.${process.env.ENVIRONMENT}.cdp-int.defra.cloud`
export const KEEPER_DATA_API_URL = `https://ls-keeper-data-api.${process.env.ENVIRONMENT}.cdp-int.defra.cloud`
export const KEEPER_DATA_BRIDGE_EPHEMERAL_URL = `https://ephemeral-protected.api.dev.cdp-int.defra.cloud/ls-keeper-data-bridge-backend`
export const KEEPER_DATA_API_EPHEMERAL_URL = `https://ephemeral-protected.api.dev.cdp-int.defra.cloud/ls-keeper-data-api`
export const KEEPER_DATA_BRIDGE_DEV_URL = `https://ls-keeper-data-bridge-backend.dev.cdp-int.defra.cloud`
export const KEEPER_DATA_API_DEV_URL = `https://ls-keeper-data-api.dev.cdp-int.defra.cloud`
export const API_KEY = '3kLAlfWEba6MIoyPHhU1A63Mofty6h4h'
export const DEV_SALT_KEY = 'begoibNa99wwIYdFuPFt9rxpM5R45n'
export const AUTHORIZATION_DEV_KEY =
  'cQG11tkBL8Xd9GTCkOjZn8-0ReAnw0cdfRDfuPr8E8nb9xdRJaKz8lEe5qUDYOP0'
export const AUTHORIZATION_TEST_KEY =
  'fnCmW0bc_PraXU0B4XkDi4lQ2i1jSemsaQRR076oZw_bD9iSKnqeyt8qF8GxGNb5'
export const AUTHORIZATION_DEV_KEY_API =
  'QXBpS2V5Ol9waXY5ISQ3V2wjSE9DZW5vcFJJcyplIWk='
export const AUTHORIZATION_TEST_KEY_API =
  'QXBpS2V5OiZyJFNXZVpMQ2ltNzhBMGFuNy1sbnUkckU='
export const HEALTH_ENDPOINT = '/health'
export const IMPORT_DATA_ENDPOINT = '/api/Import'
export const QUERY_DATA_ENDPOINT = '/api/query/'
export const START_IMPORT_ENDPOINT = '/api/Import/start'
export const UPLOAD_FILE_ENDPOINT = '/api/ExternalCatalogue/upload'
export const DELETE_COLLECTION_ENDPOINT = '/api/Import/collections/'
export const DELETE_INTERNAL_STORAGE_FILES_ENDPOINT =
  '/api/Import/internal-storage'
export const TEST_KEEPER_DATA_BRIDGE_URL = KEEPER_DATA_BRIDGE_DEV_URL // KEEPER_DATA_BRIDGE_DEV_URL / KEEPER_DATA_BRIDGE_EPHEMERAL_URL
export const TEST_KEEPER_DATA_API_URL = KEEPER_DATA_API_DEV_URL // KEEPER_DATA_API_DEV_URL / KEEPER_DATA_API_EPHEMERAL_URL
export const DATA_FOLDER_PATH = '../data/'
export const COUNTRIES_LIST_ENDPOINT = '/api/countries'
export const PARTIES_LIST_ENDPOINT = '/api/parties'
export const SITES_LIST_ENDPOINT = '/api/sites'
export const CTS_DAILY_SCAN_ENDPOINT = '/api/import/startCtsDailyScan'
export const SAM_DAILY_SCAN_ENDPOINT = '/api/import/startSamDailyScan'
