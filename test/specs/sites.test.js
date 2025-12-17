import { expect } from 'chai'
import { upgrade } from '~/node_modules/undici/index'

describe('sites API Test', () => {
  before(async () => {
    const fileNamePattern = 'LITP_SAMCPHHOLDING_{0}.csv'
    const collectionName = 'sam_cph_holdings'
    const compositeKeyFields = [
      'CPH',
      'FEATURE_NAME',
      'SECONDARY_CPH',
      'ANIMAL_SPECIES_CODE'
    ]
    await performE2EFlow(fileNamePattern, collectionName, compositeKeyFields)

    const response = await startSamDailyScanImport(KEEPER_DATA_API_URL)
    expect(response.status).to.equal(200)
  })

  it('should return a list of sites', async () => {
    const responseSitesList = await getSitesList(KEEPER_DATA_API_URL)
    expect(responseSitesList.status).to.equal(200)
    expect(responseSitesList.data).to.be.an('array')
    expect(responseSitesList.data.length).to.be.greaterThan(0)
  })

  it('should return site details by site identifier', async () => {
    const responseSiteByIdentifier = await getSitesList(KEEPER_DATA_API_URL, {
      siteIdentifier: '01/001/0001'
    })
    expect(responseSiteByIdentifier.status).to.equal(200)
    expect(responseSiteByIdentifier.data).to.be.an('array')
    expect(responseSiteByIdentifier.data.length).to.be.greaterThan(0)
  })

  it('should return sites details matching site identifiers', async () => {
    const responseSitesByIdentifiers = await getSitesList(KEEPER_DATA_API_URL, {
      siteIdentifiers: '01/001/0001,01/001/0002'
    })
    expect(responseSitesByIdentifiers.status).to.equal(200)
    expect(responseSitesByIdentifiers.data).to.be.an('array')
    expect(responseSitesByIdentifiers.data.length).to.be.greaterThan(1)
  })

  it('should return sites details by name', async () => {
    const responseSitesByName = await getSitesList(KEEPER_DATA_API_URL, {
      name: 'Test Site'
    })
    expect(responseSitesByName.status).to.equal(200)
    expect(responseSitesByName.data).to.be.an('array')
    expect(responseSitesByName.data.length).to.be.greaterThan(0)
  })

  it('should return sites details by type', async () => {
    const responseSitesByType = await getSitesList(KEEPER_DATA_API_URL, {
      type: 'ZO-Zoo'
    })
    expect(responseSitesByType.status).to.equal(200)
    expect(responseSitesByType.data).to.be.an('array')
    expect(responseSitesByType.data.length).to.be.greaterThan(0)
  })

  it('should return site details by site id', async () => {
    const responseSitesList = await getSitesList(KEEPER_DATA_API_URL, {
      siteId: '3fa85f64-5717-4562-b3fc-2c963f66afa6'
    })
    expect(responseSitesList.status).to.equal(200)
    expect(responseSitesList.data.id).to.equal(
      '3fa85f64-5717-4562-b3fc-2c963f66afa6'
    )
  })

  it('should return site details by party id', async () => {
    const responseSitesByPartyId = await getSitesList(KEEPER_DATA_API_URL, {
      partyId: '3fa85f64-5717-4562-b3fc-2c963f66afa6'
    })
    expect(responseSitesByPartyId.status).to.equal(200)
    expect(responseSitesByPartyId.data).to.be.an('array')
    expect(responseSitesByPartyId.data.length).to.be.greaterThan(0)
  })

  it('should return site detaisl by last updated date', async () => {
    const responseSitesByLastUpgradeDate = await getSitesList(
      KEEPER_DATA_API_URL,
      { lastUpdatedDate: '2023-01-01T00:00:00Z' }
    )
    expect(responseSitesByLastUpgradeDate.status).to.equal(200)
    expect(responseSitesByLastUpgradeDate.data).to.be.an('array')
    expect(responseSitesByLastUpgradeDate.data.length).to.be.greaterThan(0)
  })

  it('should return site details by site id endpoint', async () => {
    const responseSitesList = await getSitesList(KEEPER_DATA_API_URL)
    const siteId = responseSitesList.data[0].id

    const responseSiteDetailsById = await getSiteDetailsById(
      KEEPER_DATA_API_URL,
      siteId
    )
    expect(responseSiteDetailsById.status).to.equal(200)
    expect(responseSiteDetailsById.data.id).to.equal(siteId)
  })

  it('should return 404 for non-existing site id', async () => {
    const nonExistingSiteId = 'non-existing-id-12345'
    try {
      await getSiteDetailsById(KEEPER_DATA_API_URL, nonExistingSiteId)
    } catch (error) {
      expect(error.response.status).to.equal(404)
    }
  })

  it('should return 400 for invalid parameters', async () => {
    try {
      await getSitesList(KEEPER_DATA_API_URL, { foo: 'invalid-value' })
    } catch (error) {
      expect(error.response.status).to.equal(400)
    }
  })
})
