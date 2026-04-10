import { expect } from 'chai'
import { describe, it } from 'mocha'
import { getSpeciesList, getSpeciesDetailsById } from '../helpers/api-call.js'
import { TEST_KEEPER_DATA_API_URL } from '../helpers/api-endpoints.js'

describe('Species API Test', function () {
  this.timeout(60000)

  it('should return a list of species', async () => {
    const responseSpeciesList = await getSpeciesList(TEST_KEEPER_DATA_API_URL)
    expect(responseSpeciesList.status).to.equal(200)

    const data = responseSpeciesList.data

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

  it('should return species details by ID', async () => {
    const responseSpeciesList = await getSpeciesList(TEST_KEEPER_DATA_API_URL)
    expect(responseSpeciesList.status).to.equal(200)

    const data = responseSpeciesList.data
    const values = Array.isArray(data) ? data[0]?.values : data.values

    expect(values).to.be.an('array')
    expect(values.length).to.be.greaterThan(0)

    const speciesId = values[0].id

    const responseSpeciesDetailsById = await getSpeciesDetailsById(
      TEST_KEEPER_DATA_API_URL,
      speciesId
    )
    expect(responseSpeciesDetailsById.status).to.equal(200)
    expect(responseSpeciesDetailsById.data.id).to.equal(speciesId)
  })

  it('should return species updated since a given lastUpdatedDate', async () => {
    const lastUpdatedTimePoint = new Date().toISOString()

    const responseSpeciesByLastUpdatedDate = await getSpeciesList(
      TEST_KEEPER_DATA_API_URL,
      { lastUpdatedDate: lastUpdatedTimePoint }
    )

    expect(responseSpeciesByLastUpdatedDate.status).to.equal(200)

    const data = responseSpeciesByLastUpdatedDate.data
    const values = Array.isArray(data) ? data[0]?.values : data.values

    if (Array.isArray(values)) {
      const threshold = new Date(lastUpdatedTimePoint)
      values.forEach((species) => {
        if (species.lastUpdatedDate) {
          expect(new Date(species.lastUpdatedDate).getTime()).to.be.at.least(
            threshold.getTime()
          )
        }
      })
    }
  })

  it('should return 404 for non-existing species ID', async () => {
    const nonExistingSpeciesId = 'non-existing-id-12345'
    try {
      await getSpeciesDetailsById(
        TEST_KEEPER_DATA_API_URL,
        nonExistingSpeciesId
      )
    } catch (error) {
      expect(error.response.status).to.equal(404)
    }
  })

  it('should return 400 for invalid parameters', async () => {
    try {
      await getSpeciesList(TEST_KEEPER_DATA_API_URL, { foo: 'invalid-value' })
    } catch (error) {
      expect(error.response.status).to.equal(400)
    }
  })
})
