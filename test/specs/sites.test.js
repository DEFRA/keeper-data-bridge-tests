import { expect } from 'chai'
import {
  startSamDailyScanImport,
  getSitesList,
  getSiteDetailsById,
  uploadEncryptedFile,
  startImport,
  waitForImportCompletion,
  cleanCollection,
  cleanInternalStorageFiles
} from '../helpers/api-call.js'
import { setFileProcessor } from '../helpers/e2e-etl-dev-flow.js'
import {
  TEST_KEEPER_DATA_API_URL,
  TEST_KEEPER_DATA_BRIDGE_URL
} from '../helpers/api-endpoints.js'
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

    // 1. Clean collections
    await cleanCollection(TEST_KEEPER_DATA_BRIDGE_URL, 'sam_cph_holdings')
    await cleanCollection(TEST_KEEPER_DATA_BRIDGE_URL, 'amls2_common_land')

    // 2. Clean storage files once at the beginning
    await cleanInternalStorageFiles(TEST_KEEPER_DATA_BRIDGE_URL, {
      sourceType: 'internal'
    })
    await cleanInternalStorageFiles(TEST_KEEPER_DATA_BRIDGE_URL, {
      sourceType: 'external'
    })

    // 3. Find files
    const samFileName = Array.from(processor.processedFiles.keys()).find((f) =>
      f.includes('SAMCPHHOLDING')
    )
    const commonFileName = Array.from(processor.processedFiles.keys()).find(
      (f) => f.includes('AMLS2COMMONLAND')
    )
    const portFileName = Array.from(processor.processedFiles.keys()).find((f) =>
      f.includes('AMLS2PORT')
    )

    // 4. Import SAMCPHHOLDING sequentially
    if (samFileName) {
      await uploadEncryptedFile(
        TEST_KEEPER_DATA_BRIDGE_URL,
        samFileName,
        processor.getEncryptedFile(samFileName)
      )
      const importRes = await startImport(TEST_KEEPER_DATA_BRIDGE_URL)
      expect(importRes.status).to.be.oneOf([200, 202])
      await waitForImportCompletion(
        TEST_KEEPER_DATA_BRIDGE_URL,
        importRes.data.importId
      )
    }

    // 5. Import AMLS2COMMONLAND sequentially
    if (commonFileName) {
      await uploadEncryptedFile(
        TEST_KEEPER_DATA_BRIDGE_URL,
        commonFileName,
        processor.getEncryptedFile(commonFileName)
      )
      const importRes = await startImport(TEST_KEEPER_DATA_BRIDGE_URL)
      expect(importRes.status).to.be.oneOf([200, 202])
      await waitForImportCompletion(
        TEST_KEEPER_DATA_BRIDGE_URL,
        importRes.data.importId
      )
    }

    // 6. Import AMLS2PORT sequentially
    if (portFileName) {
      await uploadEncryptedFile(
        TEST_KEEPER_DATA_BRIDGE_URL,
        portFileName,
        processor.getEncryptedFile(portFileName)
      )
      const importRes = await startImport(TEST_KEEPER_DATA_BRIDGE_URL)
      expect(importRes.status).to.be.oneOf([200, 202])
      await waitForImportCompletion(
        TEST_KEEPER_DATA_BRIDGE_URL,
        importRes.data.importId
      )
    }

    // 7. Trigger Daily Scan
    const response = await startSamDailyScanImport(TEST_KEEPER_DATA_API_URL)
    expect(response.status).to.equal(202)

    // Poll to ensure both common land data, standard site mappings, and port data are fully synced in the read-side API database
    const startTime = Date.now()
    const timeout = 60000
    let isSynced = false
    while (Date.now() - startTime < timeout) {
      const standardRes = await getSitesList(TEST_KEEPER_DATA_API_URL, {
        SiteIdentifier: '08/001/0015'
      })
      const commonRes = await getSitesList(TEST_KEEPER_DATA_API_URL, {
        SiteIdentifier: '00/000/8267'
      })
      const portRes = await getSitesList(TEST_KEEPER_DATA_API_URL, {
        SiteIdentifier: 'ABRDD'
      })
      const standardSite = standardRes.data?.values?.[0]
      const commonSite = commonRes.data?.values?.[0]
      const portSite = portRes.data?.values?.[0]
      if (
        standardSite?.associatedCommonLands?.length === 2 &&
        commonSite?.associatedMainHoldings?.length === 2 &&
        portSite?.name === 'Aberdeen Docks'
      ) {
        isSynced = true
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
    if (!isSynced) {
      // eslint-disable-next-line no-console
      console.warn(
        'Warning: Database sync check did not fully settle within the timeout period.'
      )
    }
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
        SiteIdentifier: '37/002/0002'
      }
    )
    expect(responseSiteByIdentifier.status).to.equal(200)
    expect(responseSiteByIdentifier.data).to.have.property('values')
    expect(responseSiteByIdentifier.data.values).to.be.an('array')
    expect(responseSiteByIdentifier.data.values.length).to.be.greaterThan(0)

    const site = responseSiteByIdentifier.data.values[0]
    expect(site.identifiers).to.be.an('array')
    expect(site.identifiers[0].identifier).to.equal('37/002/0002')
  })

  it('should return sites details matching site identifiers', async () => {
    const responseSitesByIdentifiers = await getSitesList(
      TEST_KEEPER_DATA_API_URL,
      {
        SiteIdentifiers: '37/002/0002,37/003/0003'
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

    expect(firstSite.identifiers[0].identifier).to.equal('37/002/0002')
    expect(secondSite.identifiers[0].identifier).to.equal('37/003/0003')
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

  it('should return site details by keeperparty id', async () => {
    // First get a generic list of sites to obtain a real party id
    const allSitesResponse = await getSitesList(TEST_KEEPER_DATA_API_URL)
    expect(allSitesResponse.status).to.equal(200)
    expect(allSitesResponse.data).to.have.property('values')
    expect(allSitesResponse.data.values).to.be.an('array')
    expect(allSitesResponse.data.values.length).to.be.greaterThan(0)

    const partyId = allSitesResponse.data.values[0].partyId

    // Then query again filtered by that party id (assuming the test data has sites linked to parties)
    const responseSitesByPartyId = await getSitesList(
      TEST_KEEPER_DATA_API_URL,
      {
        partyId
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

  it('should return site relationship data when retrieving sites', async () => {
    // site seeded in DB
    const siteIdentifier = '37/002/0002'
    const secondaryCPH = '37/002/5002'
    const cphType = 'MAIN'

    const siteResponse = await getSitesList(TEST_KEEPER_DATA_API_URL, {
      SiteIdentifier: siteIdentifier
    })
    expect(siteResponse.status).to.equal(200)
    expect(siteResponse.data.values[0].parentSiteIdentifier).to.equal(
      secondaryCPH
    )
    expect(siteResponse.data.values[0].holdingType).to.equal(cphType)
  })

  it('should return site site relationship data when retrieving site by id', async () => {
    // site seeded in DB
    const siteIdentifier = '37/002/0002'
    const secondaryCPH = '37/002/5002'
    const cphType = 'MAIN'

    // find site via sites endpoint to get siteId
    const sitesResponse = await getSitesList(TEST_KEEPER_DATA_API_URL, {
      SiteIdentifier: siteIdentifier
    })

    expect(sitesResponse.status).to.equal(200)
    const siteId = sitesResponse.data.values[0].id

    const siteResponse = await getSiteDetailsById(
      TEST_KEEPER_DATA_API_URL,
      siteId
    )
    expect(siteResponse.status).to.equal(200)
    expect(siteResponse.data.parentSiteIdentifier).to.equal(secondaryCPH)
    expect(siteResponse.data.holdingType).to.equal(cphType)
  })

  it('should return permanent land holding identifier where CPH_RELATIONSHIP_TYPE is PCPHLANDUSEDBYTCPH when retrieving sites', async () => {
    // Target site seeded in DB
    const siteIdentifier = '37/022/0022'
    const secondaryCPH = '37/022/5022'

    const siteResponse = await getSitesList(TEST_KEEPER_DATA_API_URL, {
      SiteIdentifier: siteIdentifier
    })

    expect(siteResponse.status).to.equal(200)
    const siteData = siteResponse.data.values[0]

    expect(siteData.parentSiteIdentifier).to.equal(null)
    expect(siteData.permanentLandHoldingIdentifier).to.equal(secondaryCPH)
  })

  it('should return permanent land holding identifier data when retrieving a site by id endpoint', async () => {
    const siteIdentifier = '37/022/0022'
    const secondaryCPH = '37/022/5022'

    const sitesResponse = await getSitesList(TEST_KEEPER_DATA_API_URL, {
      SiteIdentifier: siteIdentifier
    })

    expect(sitesResponse.status).to.equal(200)
    const siteId = sitesResponse.data.values[0].id

    // Request direct item endpoint
    const siteResponse = await getSiteDetailsById(
      TEST_KEEPER_DATA_API_URL,
      siteId
    )

    expect(siteResponse.status).to.equal(200)
    expect(siteResponse.data.parentSiteIdentifier).to.equal(null)
    expect(siteResponse.data.permanentLandHoldingIdentifier).to.equal(
      secondaryCPH
    )
  })

  describe('Common Land Requirements', () => {
    it('should return common land details, associatedMainHoldings, and address line 3 when site is a common land site', async () => {
      const commonLandIdentifier = '00/000/8267'

      // 1. Test via query list endpoint
      const listResponse = await getSitesList(TEST_KEEPER_DATA_API_URL, {
        SiteIdentifier: commonLandIdentifier
      })
      expect(listResponse.status).to.equal(200)
      expect(listResponse.data.values).to.be.an('array')
      expect(listResponse.data.values.length).to.be.greaterThan(0)

      const siteData = listResponse.data.values[0]
      expect(siteData.name).to.equal('Premises 22')
      expect(siteData.type.code).to.equal('CL')
      expect(siteData.type.name).to.equal('Common Land')
      expect(siteData.associatedCommonLands).to.be.an('array').of.length(0)

      // Check associatedMainHoldings
      expect(siteData.associatedMainHoldings).to.be.an('array').of.length(2)

      const holding1 = siteData.associatedMainHoldings.find(
        (h) => h.holdingIdentifier === '17/050/0003'
      )
      expect(holding1).to.be.an('object')
      expect(holding1.contiguousFlag).to.equal(true)
      expect(holding1.startDate).to.equal('18/11/2010 00:00')
      expect(holding1.endDate).to.equal('31/12/2999 00:00')

      const holding2 = siteData.associatedMainHoldings.find(
        (h) => h.holdingIdentifier === '17/050/0004'
      )
      expect(holding2).to.be.an('object')
      expect(holding2.contiguousFlag).to.equal(false)
      expect(holding2.startDate).to.equal('22/05/2026 00:00')
      expect(holding2.endDate).to.equal('31/12/2999 00:00')

      // Check address fields (including mapping to postTown)
      expect(siteData.location.address).to.be.an('object')
      expect(siteData.location.address.postTown).to.be.a('string')
      expect(siteData.location.address.postTown).to.equal('Locality22')

      // 2. Test via direct get site by id endpoint
      const detailResponse = await getSiteDetailsById(
        TEST_KEEPER_DATA_API_URL,
        siteData.id
      )
      expect(detailResponse.status).to.equal(200)

      const details = detailResponse.data
      expect(details.name).to.equal('Premises 22')
      expect(details.type.code).to.equal('CL')
      expect(details.type.name).to.equal('Common Land')
      expect(details.associatedCommonLands).to.be.an('array').of.length(0)
      expect(details.associatedMainHoldings).to.be.an('array').of.length(2)

      const dHolding1 = details.associatedMainHoldings.find(
        (h) => h.holdingIdentifier === '17/050/0003'
      )
      expect(dHolding1).to.be.an('object')
      expect(dHolding1.contiguousFlag).to.equal(true)

      const dHolding2 = details.associatedMainHoldings.find(
        (h) => h.holdingIdentifier === '17/050/0004'
      )
      expect(dHolding2).to.be.an('object')
      expect(dHolding2.contiguousFlag).to.equal(false)

      expect(details.location.address.postTown).to.equal('Locality22')
    })

    it('should return associatedCommonLands and empty associatedMainHoldings when site is a standard (non-common land) site', async () => {
      const standardIdentifier = '08/001/0015'

      // 1. Test via query list endpoint
      const listResponse = await getSitesList(TEST_KEEPER_DATA_API_URL, {
        SiteIdentifier: standardIdentifier
      })
      expect(listResponse.status).to.equal(200)
      expect(listResponse.data.values).to.be.an('array')
      expect(listResponse.data.values.length).to.be.greaterThan(0)

      const siteData = listResponse.data.values[0]
      expect(siteData.type?.code || '').to.not.equal('CL')
      expect(siteData.associatedMainHoldings).to.be.an('array').of.length(0)

      // Check associatedCommonLands
      expect(siteData.associatedCommonLands).to.be.an('array').of.length(2)

      const common1 = siteData.associatedCommonLands.find(
        (c) => c.holdingIdentifier === '00/000/5136'
      )
      expect(common1).to.be.an('object')
      expect(common1.contiguousFlag).to.equal(true)
      expect(common1.startDate).to.include('2012-02-11')
      expect(common1.endDate).to.equal('31/12/2999 00:00')

      const common2 = siteData.associatedCommonLands.find(
        (c) => c.holdingIdentifier === '00/000/5137'
      )
      expect(common2).to.be.an('object')
      expect(common2.contiguousFlag).to.equal(false)
      expect(common2.startDate).to.equal('22/05/2026 00:00')
      expect(common2.endDate).to.equal('31/12/2999 00:00')

      // Check address fields (verify they have not been overwritten by common land data)
      expect(siteData.location.address).to.be.an('object')
      expect(siteData.location.address.addressLine1).to.equal('1A-10B, 2C-20D')
      expect(siteData.location.address.addressLine2).to.equal(
        'Holding Street 27'
      )
      expect(siteData.location.address.postTown).to.equal('Town27')
      expect(siteData.location.address.county).to.equal('Locality27')
      expect(siteData.location.address.postcode).to.equal('CPH27 227')

      // 2. Test via direct get site by id endpoint
      const detailResponse = await getSiteDetailsById(
        TEST_KEEPER_DATA_API_URL,
        siteData.id
      )
      expect(detailResponse.status).to.equal(200)

      const details = detailResponse.data
      expect(details.type?.code || '').to.not.equal('CL')
      expect(details.associatedMainHoldings).to.be.an('array').of.length(0)
      expect(details.associatedCommonLands).to.be.an('array').of.length(2)

      const dCommon1 = details.associatedCommonLands.find(
        (c) => c.holdingIdentifier === '00/000/5136'
      )
      expect(dCommon1).to.be.an('object')
      expect(dCommon1.contiguousFlag).to.equal(true)

      const dCommon2 = details.associatedCommonLands.find(
        (c) => c.holdingIdentifier === '00/000/5137'
      )
      expect(dCommon2).to.be.an('object')
      expect(dCommon2.contiguousFlag).to.equal(false)

      // Check address fields (verify they have not been overwritten by common land data)
      expect(details.location.address).to.be.an('object')
      expect(details.location.address.addressLine1).to.equal('1A-10B, 2C-20D')
      expect(details.location.address.addressLine2).to.equal(
        'Holding Street 27'
      )
      expect(details.location.address.postTown).to.equal('Town27')
      expect(details.location.address.county).to.equal('Locality27')
      expect(details.location.address.postcode).to.equal('CPH27 227')
    })
  })

  describe('Port Requirements', () => {
    it.only('Fetch Port Site by its CPH', async () => {
      const cphWithPort = 'ABRDD'

      // 1. Test via query list endpoint
      const listResponse = await getSitesList(TEST_KEEPER_DATA_API_URL, {
        SiteIdentifier: cphWithPort
      })
      expect(listResponse.status).to.equal(200)
      expect(listResponse.data.values).to.be.an('array')
      expect(listResponse.data.values.length).to.be.greaterThan(0)

      const siteData = listResponse.data.values[0]
      expect(siteData.name).to.equal('Aberdeen Docks')
      expect(siteData.holdingType).to.equal('PRTN')
      expect(siteData.type).to.be.an('object')
      expect(siteData.type.code).to.equal('PO')
      expect(siteData.type.name).to.equal('Port')
      expect(siteData.identifiers).to.be.an('array')
      expect(siteData.identifiers[0].identifier).to.equal(cphWithPort)

      // 2. Query GET /api/sites/{id} endpoint
      const detailResponse = await getSiteDetailsById(
        TEST_KEEPER_DATA_API_URL,
        siteData.id
      )
      expect(detailResponse.status).to.equal(200)

      const details = detailResponse.data
      expect(details.name).to.equal('Aberdeen Docks')
      expect(details.holdingType).to.equal('PRTN')
      expect(details.type).to.be.an('object')
      expect(details.type.code).to.equal('PO')
      expect(details.type.name).to.equal('Port')
      expect(details.location).to.be.an('object')
      expect(details.location.osMapReference).to.equal('NJ944061')
      expect(details.location.address).to.be.an('object')
      expect(details.location.address.addressLine1).to.equal('Aberdeen Docks')
      expect(details.location.address.addressLine2).to.equal(
        '16 Regent Quay Aberdeen AB11 5SS'
      )
      expect(details.location.address.county).to.equal('Harbour Office')
      expect(details.location.address.postcode).to.equal('AB11 5SS')
      expect(details.location.easting).to.equal(394400)
      expect(details.location.northing).to.equal(806100)
    })
  })
})
