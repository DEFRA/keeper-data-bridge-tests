import { describe, it, before } from 'mocha'
import {
  startSamDailyScanImport,
  getPartiesList,
  getPartyDetailsById
} from '../helpers/api-call.js'
import {
  performE2EFlow,
  setFileProcessor
} from '../helpers/e2e-etl-dev-flow.js'
import FileProcessor from '../helpers/file-processor.js'
import { expect } from 'chai'
import { TEST_KEEPER_DATA_API_URL } from '../helpers/api-endpoints.js'

describe('Parties API Test', function () {
  this.timeout(180000)

  let processor

  before(async () => {
    // Prepare and register the in-memory file processor for E2E flow
    processor = new FileProcessor()
    await processor.processAllFiles()
    setFileProcessor(processor)

    const fileNamePattern = 'LITP_SAMPARTY_{0}.csv'
    const collectionName = 'sam_party'
    const compositeKeyFields = ['PARTY_ID']
    await performE2EFlow(fileNamePattern, collectionName, compositeKeyFields)
    const response = await startSamDailyScanImport(TEST_KEEPER_DATA_API_URL)
    expect(response.status).to.equal(202)
  })

  it('should return a list of parties', async () => {
    const responsePartiesList = await getPartiesList(TEST_KEEPER_DATA_API_URL)
    expect(responsePartiesList.status).to.equal(200)
    expect(responsePartiesList.data.values.length).to.be.greaterThan(0)
  })

  it('should return party details by first name', async () => {
    const responsePartyByFirstName = await getPartiesList(
      TEST_KEEPER_DATA_API_URL,
      {
        FirstName: 'John'
      }
    )
    expect(responsePartyByFirstName.status).to.equal(200)
    expect(responsePartyByFirstName.data).to.have.property('values')
    expect(responsePartyByFirstName.data.values).to.be.an('array')
  })

  it('should return party details by last name', async () => {
    const responsePartyByLastName = await getPartiesList(
      TEST_KEEPER_DATA_API_URL,
      {
        LastName: 'Doe'
      }
    )
    expect(responsePartyByLastName.status).to.equal(200)
    expect(responsePartyByLastName.data).to.have.property('values')
    expect(responsePartyByLastName.data.values).to.be.an('array')
  })

  it('should return party details by email', async () => {
    const responsePartyByEmail = await getPartiesList(
      TEST_KEEPER_DATA_API_URL,
      {
        Email: 'john.doe@example.com'
      }
    )
    expect(responsePartyByEmail.status).to.equal(200)
    expect(responsePartyByEmail.data).to.have.property('values')
    expect(responsePartyByEmail.data.values).to.be.an('array')
  })

  it('should return 404 for non-existing party', async () => {
    try {
      await getPartiesList(TEST_KEEPER_DATA_API_URL, {
        FirstName: 'NonExistingFirstName',
        LastName: 'NonExistingLastName'
      })
    } catch (error) {
      expect(error.response.status).to.equal(404)
    }
  })

  it('should return 400 for invalid parameters', async () => {
    try {
      await getPartiesList(TEST_KEEPER_DATA_API_URL, { foo: 'invalid-value' })
    } catch (error) {
      expect(error.response.status).to.equal(400)
    }
  })

  it('should return party details by ID', async () => {
    const responsePartiesList = await getPartiesList(TEST_KEEPER_DATA_API_URL)
    const partyId = responsePartiesList.data.values[0].id

    const responsePartyDetailsById = await getPartyDetailsById(
      TEST_KEEPER_DATA_API_URL,
      partyId
    )
    expect(responsePartyDetailsById.status).to.equal(200)
    expect(responsePartyDetailsById.data.id).to.equal(partyId)
  })
})
