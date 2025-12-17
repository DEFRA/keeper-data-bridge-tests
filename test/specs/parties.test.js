import { before } from 'mocha'
import { startSamDailyScanImport } from '../helpers/api-call'

describe.skip('Parties API Test', () => {
  before(async () => {
    const fileNamePattern = 'LITP_SAMPARTY_{0}.csv'
    const collectionName = 'sam_party'
    const compositeKeyFields = ['PARTY_ID']
    await performE2EFlow(fileNamePattern, collectionName, compositeKeyFields)

    const response = await startSamDailyScanImport(KEEPER_DATA_API_URL)
    expect(response.status).to.equal(200)
  })

  it('should return a list of parties', async () => {
    const responsePartiesList = await getPartiesList(KEEPER_DATA_API_URL)
    expect(responsePartiesList.status).to.equal(200)
    expect(responsePartiesList.data).to.be.an('array')
    expect(responsePartiesList.data.length).to.be.greaterThan(0)
  })

  it('should return party details by first name', async () => {
    const responsePartyByFirstName = await getPartiesList(KEEPER_DATA_API_URL, {
      firstName: 'John'
    })
    expect(responsePartyByFirstName.status).to.equal(200)
    expect(responsePartyByFirstName.data).to.be.an('array')
    expect(responsePartyByFirstName.data.length).to.be.greaterThan(0)
  })

  it('should return party details by last name', async () => {
    const responsePartyByLastName = await getPartiesList(KEEPER_DATA_API_URL, {
      lastName: 'Doe'
    })
    expect(responsePartyByLastName.status).to.equal(200)
    expect(responsePartyByLastName.data).to.be.an('array')
    expect(responsePartyByLastName.data.length).to.be.greaterThan(0)
  })

  it('should return party details by email', async () => {
    const responsePartyByEmail = await getPartiesList(KEEPER_DATA_API_URL, {
      email: 'john.doe@example.com'
    })
    expect(responsePartyByEmail.status).to.equal(200)
    expect(responsePartyByEmail.data).to.be.an('array')
    expect(responsePartyByEmail.data.length).to.be.greaterThan(0)
  })

  it('should return 404 for non-existing party', async () => {
    try {
      await getPartiesList(KEEPER_DATA_API_URL, {
        firstName: 'NonExistingFirstName',
        lastName: 'NonExistingLastName'
      })
    } catch (error) {
      expect(error.response.status).to.equal(404)
    }
  })

  it('should return 400 for invalid parameters', async () => {
    try {
      await getPartiesList(KEEPER_DATA_API_URL, { foo: 'invalid-value' })
    } catch (error) {
      expect(error.response.status).to.equal(400)
    }
  })

  it('should return party details by ID', async () => {
    const responsePartiesList = await getPartiesList(KEEPER_DATA_API_URL)
    const partyId = responsePartiesList.data[0].id

    const responsePartyDetailsById = await getPartyDetailsById(
      KEEPER_DATA_API_URL,
      partyId
    )
    expect(responsePartyDetailsById.status).to.equal(200)
    expect(responsePartyDetailsById.data.id).to.equal(partyId)
  })
})
