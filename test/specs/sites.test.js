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
  let lastUpdatedTimePoint
  before(async () => {
    // Prepare and register the in-memory file processor for E2E flow
    lastUpdatedTimePoint = new Date().toISOString()
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
        SiteIdentifier: '26/002/0002'
      }
    )
    expect(responseSiteByIdentifier.status).to.equal(200)
    expect(responseSiteByIdentifier.data).to.have.property('values')
    expect(responseSiteByIdentifier.data.values).to.be.an('array')
    expect(responseSiteByIdentifier.data.values.length).to.be.greaterThan(0)

    const site = responseSiteByIdentifier.data.values[0]
    expect(site.identifiers).to.be.an('array')
    expect(site.identifiers[0].identifier).to.equal('26/002/0002')
  })

  it('should return sites details matching site identifiers', async () => {
    const responseSitesByIdentifiers = await getSitesList(
      TEST_KEEPER_DATA_API_URL,
      {
        SiteIdentifiers: '26/002/0002,26/003/0003'
      }
    )
    expect(responseSitesByIdentifiers.status).to.equal(200)
    expect(responseSitesByIdentifiers.data).to.have.property('values')
    expect(responseSitesByIdentifiers.data.values).to.be.an('array')
    expect(responseSitesByIdentifiers.data.values.length).to.equal(2)

    const firstSite = responseSitesByIdentifiers.data.values[0]
    const secondSite = responseSitesByIdentifiers.data.values[1]

    expect(firstSite.identifiers).to.be.an('array')
    expect(secondSite.identifiers).to.be.an('array')

    expect(firstSite.identifiers[0].identifier).to.equal('26/002/0002')
    expect(secondSite.identifiers[0].identifier).to.equal('26/003/0003')
  })

  it.skip('should return sites details by type', async () => {
    const responseSitesByType = await getSitesList(TEST_KEEPER_DATA_API_URL, {
      type: 'ZO-Zoo'
    })
    expect(responseSitesByType.status).to.equal(200)
    expect(responseSitesByType.data).to.have.property('values')
    expect(responseSitesByType.data.values).to.be.an('array')
  })

  it('should return site details by site id', async () => {
    // First get a generic list of sites
    const allSitesResponse = await getSitesList(TEST_KEEPER_DATA_API_URL)
    expect(allSitesResponse.status).to.equal(200)
    expect(allSitesResponse.data).to.have.property('values')
    expect(allSitesResponse.data.values).to.be.an('array')
    expect(allSitesResponse.data.values.length).to.be.greaterThan(0)

    const siteId = allSitesResponse.data.values[0].id

    // Then call the endpoint with the siteId parameter and verify the response
    const responseSitesList = await getSitesList(TEST_KEEPER_DATA_API_URL, {
      SiteId: siteId
    })
    expect(responseSitesList.status).to.equal(200)
    expect(responseSitesList.data).to.have.property('values')
    expect(responseSitesList.data.values).to.be.an('array')
    expect(responseSitesList.data.values.length).to.be.greaterThan(0)
    expect(responseSitesList.data.values[0].id).to.equal(siteId)
  })

  it('should return sites details by site ids', async () => {
    // Get a generic list of sites to obtain multiple IDs
    const allSitesResponse = await getSitesList(TEST_KEEPER_DATA_API_URL)
    expect(allSitesResponse.status).to.equal(200)
    expect(allSitesResponse.data).to.have.property('values')
    expect(allSitesResponse.data.values).to.be.an('array')
    expect(allSitesResponse.data.values.length).to.be.greaterThan(1)

    const firstSiteId = allSitesResponse.data.values[0].id
    const secondSiteId = allSitesResponse.data.values[1].id

    // Call the list endpoint filtered by multiple site IDs
    const responseByIds = await getSitesList(TEST_KEEPER_DATA_API_URL, {
      SiteIds: `${firstSiteId},${secondSiteId}`
    })

    expect(responseByIds.status).to.equal(200)
    expect(responseByIds.data).to.have.property('values')
    expect(responseByIds.data.values).to.be.an('array')
    expect(responseByIds.data.values.length).to.be.greaterThan(1)

    const returnedIds = responseByIds.data.values.map((s) => s.id)
    expect(returnedIds).to.include(firstSiteId)
    expect(returnedIds).to.include(secondSiteId)
  })

  it.skip('should return site details by keeperparty id', async () => {
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

  it('should return site details by last updated date', async () => {
    const responseSitesByLastUpdatedDate = await getSitesList(
      TEST_KEEPER_DATA_API_URL,
      { lastUpdatedDate: lastUpdatedTimePoint }
    )
    expect(responseSitesByLastUpdatedDate.status).to.equal(200)
    expect(responseSitesByLastUpdatedDate.data).to.have.property('values')
    expect(responseSitesByLastUpdatedDate.data.values).to.be.an('array')

    const threshold = new Date(lastUpdatedTimePoint)
    responseSitesByLastUpdatedDate.data.values.forEach((site) => {
      expect(new Date(site.lastUpdatedDate).getTime()).to.be.at.least(
        threshold.getTime()
      )
    })
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
