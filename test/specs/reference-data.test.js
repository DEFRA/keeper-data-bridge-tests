import { expect } from 'chai'
import {
  getReferenceCollection,
  getReferenceRecordById
} from '../helpers/api-call.js'
import { TEST_KEEPER_DATA_API_URL } from '../helpers/api-endpoints.js'

const REFERENCE_RESOURCES = [
  {
    endpoint: 'sitetypes',
    displayName: 'Site Types',
    // We use a fixed ID from the initial seed to verify persistence
    persistentId: 'd819dc18-f5a1-4d1a-b332-d18f9d1f9227', // Agricultural Holding
    persistentName: 'Agricultural Holding'
  }
]

describe('Reference Data API Tests', function () {
  this.timeout(60000)

  REFERENCE_RESOURCES.forEach(
    ({ endpoint, displayName, persistentId, persistentName }) => {
      describe(`${displayName} (${endpoint})`, () => {
        it(`should return a successful response and include the minimum seeded count`, async () => {
          const response = await getReferenceCollection(
            TEST_KEEPER_DATA_API_URL,
            endpoint
          )
          expect(response.status).to.equal(200)

          const { count, values } = response.data
          // We expect at least 23, but it could be more if new records were added to DB
          expect(count).to.be.at.least(23)
          expect(values).to.be.an('array').with.lengthOf(count)

          values.forEach((item) => {
            expect(item).to.have.all.keys('id', 'code', 'name')
          })
        })

        it(`should verify that the persistent seeded record for ${persistentName} still exists`, async () => {
          const response = await getReferenceRecordById(
            TEST_KEEPER_DATA_API_URL,
            endpoint,
            persistentId
          )

          expect(response.status).to.equal(200)
          expect(response.data.id).to.equal(persistentId)
          expect(response.data.name).to.equal(persistentName)
        })

        it('should ensure all records (seeded and new) have unique IDs and codes', async () => {
          const response = await getReferenceCollection(
            TEST_KEEPER_DATA_API_URL,
            endpoint
          )
          const ids = response.data.values.map((v) => v.id)
          const codes = response.data.values.map((v) => v.code)

          expect(ids.length).to.equal(
            new Set(ids).size,
            'Duplicate IDs detected'
          )
          expect(codes.length).to.equal(
            new Set(codes).size,
            'Duplicate Codes detected'
          )
        })

        it('should return the list ordered consistently by code', async () => {
          const response = await getReferenceCollection(
            TEST_KEEPER_DATA_API_URL,
            endpoint
          )
          const codes = response.data.values.map((v) => v.code)

          // Sorting by Code (e.g., AC, AH, AI...)
          const sortedCodes = [...codes].sort((a, b) => a.localeCompare(b))

          expect(codes).to.deep.equal(
            sortedCodes,
            `API did not return records in alphabetical order by code. Found: ${codes.slice(0, 3)}`
          )
        })

        it('should return 404 for a non-existent UUID', async () => {
          const fakeId = '00000000-0000-0000-0000-000000000000'
          try {
            await getReferenceRecordById(
              TEST_KEEPER_DATA_API_URL,
              endpoint,
              fakeId
            )
            expect.fail('Should have returned 404')
          } catch (error) {
            expect(error.response.status).to.equal(404)
          }
        })
      })
    }
  )
})
