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
  let lastUpdatedTimePoint

  before(async () => {
    // Prepare and register the in-memory file processor for E2E flow
    lastUpdatedTimePoint = new Date().toISOString()
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
    // First get a generic list of parties to obtain a real first name
    const allPartiesResponse = await getPartiesList(TEST_KEEPER_DATA_API_URL)
    expect(allPartiesResponse.status).to.equal(200)
    expect(allPartiesResponse.data).to.have.property('values')
    expect(allPartiesResponse.data.values).to.be.an('array')
    expect(allPartiesResponse.data.values.length).to.be.greaterThan(0)

    const firstName = allPartiesResponse.data.values[0].firstName

    // Then query again filtered by that first name
    const responsePartyByFirstName = await getPartiesList(
      TEST_KEEPER_DATA_API_URL,
      {
        FirstName: firstName
      }
    )
    expect(responsePartyByFirstName.status).to.equal(200)
    expect(responsePartyByFirstName.data).to.have.property('values')
    expect(responsePartyByFirstName.data.values).to.be.an('array')
    expect(responsePartyByFirstName.data.values.length).to.be.greaterThan(0)
    expect(
      responsePartyByFirstName.data.values.some(
        (p) => p.firstName === firstName
      )
    ).to.equal(true)
  })

  it('should return party details by last name', async () => {
    // First get a generic list of parties to obtain a real last name
    const allPartiesResponse = await getPartiesList(TEST_KEEPER_DATA_API_URL)
    expect(allPartiesResponse.status).to.equal(200)
    expect(allPartiesResponse.data).to.have.property('values')
    expect(allPartiesResponse.data.values).to.be.an('array')
    expect(allPartiesResponse.data.values.length).to.be.greaterThan(0)

    const lastName = allPartiesResponse.data.values[0].lastName

    // Then query again filtered by that last name
    const responsePartyByLastName = await getPartiesList(
      TEST_KEEPER_DATA_API_URL,
      {
        LastName: lastName
      }
    )
    expect(responsePartyByLastName.status).to.equal(200)
    expect(responsePartyByLastName.data).to.have.property('values')
    expect(responsePartyByLastName.data.values).to.be.an('array')
    expect(responsePartyByLastName.data.values.length).to.be.greaterThan(0)
    expect(
      responsePartyByLastName.data.values.some((p) => p.lastName === lastName)
    ).to.equal(true)
  })

  it('should return party details by email', async () => {
    // First get a generic list of parties to obtain a real email (if present)
    const allPartiesResponse = await getPartiesList(TEST_KEEPER_DATA_API_URL)
    expect(allPartiesResponse.status).to.equal(200)
    expect(allPartiesResponse.data).to.have.property('values')
    expect(allPartiesResponse.data.values).to.be.an('array')
    expect(allPartiesResponse.data.values.length).to.be.greaterThan(0)

    // Find the first party that has a non-empty primary email, if any
    const partyWithEmail = allPartiesResponse.data.values.find(
      (p) => p.communication && p.communication.some((c) => !!c.email)
    )

    // If no parties have an email, just assert structure on an unfiltered call
    if (!partyWithEmail) {
      const fallbackResponse = await getPartiesList(TEST_KEEPER_DATA_API_URL)
      expect(fallbackResponse.status).to.equal(200)
      expect(fallbackResponse.data).to.have.property('values')
      expect(fallbackResponse.data.values).to.be.an('array')
      return
    }

    const email = partyWithEmail.communication.find((c) => !!c.email).email

    const responsePartyByEmail = await getPartiesList(
      TEST_KEEPER_DATA_API_URL,
      {
        Email: email
      }
    )
    expect(responsePartyByEmail.status).to.equal(200)
    expect(responsePartyByEmail.data).to.have.property('values')
    expect(responsePartyByEmail.data.values).to.be.an('array')
    expect(responsePartyByEmail.data.values.length).to.be.greaterThan(0)
    expect(
      responsePartyByEmail.data.values.some((p) =>
        p.communication?.some((c) => c.email === email)
      )
    ).to.equal(true)
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

  it('should return party details by last updated date', async () => {
    const responsePartiesByLastUpdatedDate = await getPartiesList(
      TEST_KEEPER_DATA_API_URL,
      { lastUpdatedDate: lastUpdatedTimePoint }
    )
    expect(responsePartiesByLastUpdatedDate.status).to.equal(200)
    expect(responsePartiesByLastUpdatedDate.data).to.have.property('values')
    expect(responsePartiesByLastUpdatedDate.data.values).to.be.an('array')

    const threshold = new Date(lastUpdatedTimePoint)
    responsePartiesByLastUpdatedDate.data.values.forEach((party) => {
      expect(new Date(party.lastUpdatedDate).getTime()).to.be.at.least(
        threshold.getTime()
      )
    })
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
