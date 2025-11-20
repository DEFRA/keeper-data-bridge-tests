import { expect } from 'chai'
import { describe, it } from 'mocha'
import { apiHealthCheck } from '../helpers/apicall.js'
import {
  keeperDataBridgeUrl,
  keeperDataAPIUrl
} from '../helpers/apiEndpoints.js'

describe('API Health Check', () => {
  it('should return status 200 for ls-keeper-data-bridge-backend health check endpoint', async () => {
    const response = await apiHealthCheck(keeperDataBridgeUrl)
    expect(response.status).to.equal(200)
  })

  it('should return status 200 for ls-keeper-data-api health check endpoint', async () => {
    const response = await apiHealthCheck(keeperDataAPIUrl)
    expect(response.status).to.equal(200)
  })
})
