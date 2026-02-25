import { expect } from 'chai'
import { describe, it, before } from 'mocha'
import {
  startSamDailyScanImport,
  getSitesList,
  getSiteDetailsById
} from '../helpers/api-call.js'
import {
  performE2EFlow,
  setFileProcessor
} from '../helpers/e2e-etl-dev-flow.js'
import { TEST_KEEPER_DATA_API_URL } from '../helpers/api-endpoints.js'
import FileProcessor from '../helpers/file-processor.js'

describe('sites API Test', function () {
  this.timeout(180000)

  let processor
  before(async () => {
    // Prepare and register the in-memory file processor for E2E flow
    processor = new FileProcessor()
    await processor.processAllFiles()
    setFileProcessor(processor)

    const fileNamePattern = 'LITP_SAMCPHHOLDING_{0}.csv'
    const collectionName = 'sam_cph_holdings'
    const compositeKeyFields = [
      'CPH',
      'FEATURE_NAME',
      'SECONDARY_CPH',
      'ANIMAL_SPECIES_CODE'
    ]
    await performE2EFlow(fileNamePattern, collectionName, compositeKeyFields)

    const response = await startSamDailyScanImport(TEST_KEEPER_DATA_API_URL)
    expect(response.status).to.equal(202)
  })

  it('should return a list of sites', async () => {
    const responseSitesList = await getSitesList(TEST_KEEPER_DATA_API_URL)
    expect(responseSitesList.status).to.equal(200)
    expect(responseSitesList.data).to.have.property('values')
    expect(responseSitesList.data.values).to.be.an('array')
    expect(responseSitesList.data.values.length).to.be.greaterThan(0)
  })

  it('should return site details by site identifier', async () => {
    const responseSiteByIdentifier = await getSitesList(
      TEST_KEEPER_DATA_API_URL,
      {
        siteIdentifier: '01/001/0001'
      }
    )
    expect(responseSiteByIdentifier.status).to.equal(200)
    expect(responseSiteByIdentifier.data).to.have.property('values')
    expect(responseSiteByIdentifier.data.values).to.be.an('array')
  })

  it('should return sites details matching site identifiers', async () => {
    const responseSitesByIdentifiers = await getSitesList(
      TEST_KEEPER_DATA_API_URL,
      {
        siteIdentifiers: '01/001/0001,01/001/0002'
      }
    )
    expect(responseSitesByIdentifiers.status).to.equal(200)
    expect(responseSitesByIdentifiers.data).to.have.property('values')
    expect(responseSitesByIdentifiers.data.values).to.be.an('array')
  })

  it('should return sites details by name', async () => {
    const responseSitesByName = await getSitesList(TEST_KEEPER_DATA_API_URL, {
      name: 'Test Site'
    })
    expect(responseSitesByName.status).to.equal(200)
    expect(responseSitesByName.data).to.have.property('values')
    expect(responseSitesByName.data.values).to.be.an('array')
  })

  it('should return sites details by type', async () => {
    const responseSitesByType = await getSitesList(TEST_KEEPER_DATA_API_URL, {
      type: 'ZO-Zoo'
    })
    expect(responseSitesByType.status).to.equal(200)
    expect(responseSitesByType.data).to.have.property('values')
    expect(responseSitesByType.data.values).to.be.an('array')
  })

  it('should return site details by site id', async () => {
    const responseSitesList = await getSitesList(TEST_KEEPER_DATA_API_URL, {
      siteId: '3fa85f64-5717-4562-b3fc-2c963f66afa6'
    })
    expect(responseSitesList.status).to.equal(200)
    expect(responseSitesList.data).to.have.property('values')
    expect(responseSitesList.data.values).to.be.an('array')
  })

  it('should return site details by party id', async () => {
    const responseSitesByPartyId = await getSitesList(
      TEST_KEEPER_DATA_API_URL,
      {
        partyId: '3fa85f64-5717-4562-b3fc-2c963f66afa6'
      }
    )
    expect(responseSitesByPartyId.status).to.equal(200)
    expect(responseSitesByPartyId.data).to.have.property('values')
    expect(responseSitesByPartyId.data.values).to.be.an('array')
  })

  it('should return site detaisl by last updated date', async () => {
    const responseSitesByLastUpgradeDate = await getSitesList(
      TEST_KEEPER_DATA_API_URL,
      { lastUpdatedDate: '2023-01-01T00:00:00Z' }
    )
    expect(responseSitesByLastUpgradeDate.status).to.equal(200)
    expect(responseSitesByLastUpgradeDate.data).to.have.property('values')
    expect(responseSitesByLastUpgradeDate.data.values).to.be.an('array')
  })

  it('should return site details by site id endpoint', async () => {
    const responseSitesList = await getSitesList(TEST_KEEPER_DATA_API_URL)
    const siteId = responseSitesList.data.values[0].id

    const responseSiteDetailsById = await getSiteDetailsById(
      TEST_KEEPER_DATA_API_URL,
      siteId
    )
    expect(responseSiteDetailsById.status).to.equal(200)
    expect(responseSiteDetailsById.data.id).to.equal(siteId)
  })

  it('should return 404 for non-existing site id', async () => {
    const nonExistingSiteId = 'non-existing-id-12345'
    try {
      await getSiteDetailsById(TEST_KEEPER_DATA_API_URL, nonExistingSiteId)
    } catch (error) {
      expect(error.response.status).to.equal(404)
    }
  })

  it('should return 400 for invalid parameters', async () => {
    try {
      await getSitesList(TEST_KEEPER_DATA_API_URL, { foo: 'invalid-value' })
    } catch (error) {
      expect(error.response.status).to.equal(400)
    }
  })
})
