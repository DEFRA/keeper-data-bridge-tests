import { expect } from 'chai'
import { describe, it } from 'mocha'
import { checkHealthEndPoint } from '../helpers/apicall.js'
import {
  KEEPER_DATA_BRIDGE_URL,
  KEEPER_DATA_API_URL
} from '../helpers/apiEndpoints.js'

describe('API Health Check', () => {
  it('should return status 200 for ls-keeper-data-bridge-backend health check endpoint', async () => {
    const response = await checkHealthEndPoint(KEEPER_DATA_BRIDGE_URL)
    expect(response.status).to.equal(200)
  })

  it('should return status 200 for ls-keeper-data-api health check endpoint', async () => {
    const response = await checkHealthEndPoint(KEEPER_DATA_API_URL)
    expect(response.status).to.equal(200)
  })
})
