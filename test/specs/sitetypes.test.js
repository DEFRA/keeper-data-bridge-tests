import { expect } from 'chai'
import { describe, it } from 'mocha'
import { getSiteTypes } from '../helpers/api-call.js'
import { TEST_KEEPER_DATA_API_URL } from '../helpers/api-endpoints.js'

describe('SiteTypes API Test', function () {
  this.timeout(60000)

  it('should return a list of site types with activities', async () => {
    const responseSiteTypes = await getSiteTypes(TEST_KEEPER_DATA_API_URL)
    expect(responseSiteTypes.status).to.equal(200)

    const data = responseSiteTypes.data
    expect(Array.isArray(data)).to.equal(true)
    expect(data.length).to.be.greaterThan(0)

    const first = data[0]
    expect(first).to.have.property('type')
    expect(first.type).to.have.property('code')
    expect(first.type).to.have.property('name')

    if (first.activities !== null && first.activities !== undefined) {
      expect(first.activities).to.be.an('array')
    }
  })
})
