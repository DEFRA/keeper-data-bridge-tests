import { expect } from 'chai'
import { describe, it } from 'mocha'
import {
  getIdentifierTypesList,
  getIdentifierTypeById
} from '../helpers/api-call.js'
import { TEST_KEEPER_DATA_API_URL } from '../helpers/api-endpoints.js'

describe('Identifier Types API Test', function () {
  this.timeout(60000)

  it('should return a list of identifier types', async () => {
    const response = await getIdentifierTypesList(TEST_KEEPER_DATA_API_URL)
    expect(response.status).to.equal(200)

    const data = response.data

    if (Array.isArray(data)) {
      expect(data.length).to.be.greaterThan(0)
      const first = data[0]
      expect(first).to.have.property('values')
      expect(first.values).to.be.an('array')
      expect(first.values.length).to.be.greaterThan(0)
    } else {
      expect(data).to.have.property('values')
      expect(data.values).to.be.an('array')
      expect(data.values.length).to.be.greaterThan(0)
    }
  })

  it('should return identifier type items with required fields', async () => {
    const response = await getIdentifierTypesList(TEST_KEEPER_DATA_API_URL)
    expect(response.status).to.equal(200)

    const data = response.data
    const values = Array.isArray(data) ? data[0]?.values : data.values

    expect(values).to.be.an('array')
    expect(values.length).to.be.greaterThan(0)

    values.forEach((item) => {
      expect(item).to.have.property('id')
      expect(item).to.have.property('code')
      expect(item).to.have.property('name')
    })
  })

  it('should return identifier type details by ID', async () => {
    const listResponse = await getIdentifierTypesList(TEST_KEEPER_DATA_API_URL)
    expect(listResponse.status).to.equal(200)

    const data = listResponse.data
    const values = Array.isArray(data) ? data[0]?.values : data.values

    expect(values).to.be.an('array')
    expect(values.length).to.be.greaterThan(0)

    const identifierTypeId = values[0].id

    const detailResponse = await getIdentifierTypeById(
      TEST_KEEPER_DATA_API_URL,
      identifierTypeId
    )
    expect(detailResponse.status).to.equal(200)
    expect(detailResponse.data).to.have.property('id', identifierTypeId)
    expect(detailResponse.data).to.have.property('code')
    expect(detailResponse.data).to.have.property('name')
  })

  it('should return identifier types updated since a given lastUpdatedDate', async () => {
    const pastDate = new Date(
      Date.now() - 10 * 365 * 24 * 60 * 60 * 1000
    ).toISOString()

    const response = await getIdentifierTypesList(TEST_KEEPER_DATA_API_URL, {
      lastUpdatedDate: pastDate
    })

    expect(response.status).to.equal(200)

    const data = response.data
    const values = Array.isArray(data) ? data[0]?.values : data.values

    if (Array.isArray(values)) {
      const threshold = new Date(pastDate)
      values.forEach((item) => {
        if (item.lastUpdatedDate) {
          expect(new Date(item.lastUpdatedDate).getTime()).to.be.at.least(
            threshold.getTime()
          )
        }
      })
    }
  })

  it('should return empty list when lastUpdatedDate is in the future', async () => {
    const futureDate = new Date(
      Date.now() + 10 * 365 * 24 * 60 * 60 * 1000
    ).toISOString()

    const response = await getIdentifierTypesList(TEST_KEEPER_DATA_API_URL, {
      lastUpdatedDate: futureDate
    })

    expect(response.status).to.equal(200)

    const data = response.data
    const values = Array.isArray(data) ? data[0]?.values : data.values

    if (Array.isArray(values)) {
      expect(values.length).to.equal(0)
    } else if (data) {
      expect(data.count).to.equal(0)
    }
  })

  it('should return 404 for a non-existing identifier type ID', async () => {
    const nonExistingId = 'non-existing-id-12345'
    try {
      await getIdentifierTypeById(TEST_KEEPER_DATA_API_URL, nonExistingId)
    } catch (error) {
      expect(error.response.status).to.equal(404)
    }
  })
})
