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
    persistentName: 'Agricultural Holding',
    minCount: 23,
    expectedKeys: ['id', 'code', 'name']
  },
  {
    endpoint: 'roles',
    displayName: 'Roles',
    persistentId: 'b2637b72-2196-4a19-bdf0-85c7ff66cf60', // Livestock Keeper
    persistentName: 'Livestock Keeper',
    minCount: 12,
    expectedKeys: ['id', 'code', 'name', 'lastUpdatedDate']
  },
  {
    endpoint: 'activities',
    displayName: 'Activities',
    persistentId: '3ae14c6d-3c40-4496-ba2a-a121831201d3', // Airport
    persistentName: 'Airport',
    minCount: 15,
    expectedKeys: ['id', 'code', 'name', 'lastUpdatedDate']
  },
  {
    endpoint: 'productionusages',
    displayName: 'Production Usages',
    persistentId: 'ba9cb8fb-ab7f-42f2-bc1f-fa4d7fda4824', // Beef
    persistentName: 'Beef',
    minCount: 30,
    expectedKeys: ['id', 'code', 'description', 'lastUpdatedDate']
  }
]

describe('Reference Data API Tests', function () {
  this.timeout(60000)

  REFERENCE_RESOURCES.forEach(
    ({
      endpoint,
      displayName,
      persistentId,
      persistentName,
      minCount,
      expectedKeys
    }) => {
      describe(`${displayName} (${endpoint})`, () => {
        // AC1 - Retrieve all roles / site types
        it(`should return a successful response and include the minimum seeded count`, async () => {
          const response = await getReferenceCollection(
            TEST_KEEPER_DATA_API_URL,
            endpoint
          )
          expect(response.status).to.equal(200)

          const { count, values } = response.data
          expect(count).to.be.at.least(minCount)
          expect(values).to.be.an('array').with.lengthOf(count)
        })

        // AC5 - Response structure is consistent
        it(`should return items with the expected response structure`, async () => {
          const response = await getReferenceCollection(
            TEST_KEEPER_DATA_API_URL,
            endpoint
          )
          expect(response.status).to.equal(200)

          const { values } = response.data
          values.forEach((item) => {
            expect(item).to.have.all.keys(...expectedKeys)
            expect(item.id).to.be.a('string')
            expect(item.code).to.be.a('string')
            if (expectedKeys.includes('name')) {
              expect(item.name).to.be.a('string')
            }
            if (expectedKeys.includes('description')) {
              expect(item.description).to.be.a('string')
            }
          })
        })

        // AC3 - Single role returned
        it(`should verify that the persistent seeded record for ${persistentName} still exists`, async () => {
          const response = await getReferenceRecordById(
            TEST_KEEPER_DATA_API_URL,
            endpoint,
            persistentId
          )

          expect(response.status).to.equal(200)
          expect(response.data.id).to.equal(persistentId)
          if (endpoint === 'productionusages') {
            expect(response.data.description).to.equal(persistentName)
          } else {
            expect(response.data.name).to.equal(persistentName)
          }
        })

        // AC2 & AC6 - Multiple records / No duplicate roles
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

        // AC4 - No roles/records exist (using a future filter date)
        it('should return an empty collection when filtered by a future lastUpdatedDate (no records)', async () => {
          const futureDate = new Date(
            Date.now() + 10 * 365 * 24 * 60 * 60 * 1000
          ).toISOString()

          const response = await getReferenceCollection(
            TEST_KEEPER_DATA_API_URL,
            endpoint,
            { lastUpdatedDate: futureDate }
          )

          expect(response.status).to.equal(200)
          expect(response.data.count).to.equal(0)
          expect(response.data.values).to.be.an('array').with.lengthOf(0)
        })

        // AC7 - Ordering
        it('should return the list ordered consistently', async () => {
          const response = await getReferenceCollection(
            TEST_KEEPER_DATA_API_URL,
            endpoint
          )

          if (endpoint === 'sitetypes') {
            const codes = response.data.values.map((v) => v.code)
            // The sort order of reference data is determined by a static JSON file in the
            // application repository. Because this test suite cannot be certain of that
            // exact ordering, we verify that the newly added 'CL' (Common Land) is returned
            // as the last option in the list.
            expect(codes[codes.length - 1]).to.equal('CL')
          } else if (
            endpoint === 'roles' ||
            endpoint === 'activities' ||
            endpoint === 'productionusages'
          ) {
            const values = response.data.values
            const field =
              endpoint === 'productionusages' ? 'description' : 'name'
            const textValues = values.map((v) => v[field])
            const sortedTextValues = [...textValues].sort((a, b) =>
              a.localeCompare(b)
            )
            expect(textValues).to.deep.equal(
              sortedTextValues,
              `API did not return records in alphabetical order by ${field}.`
            )
          } else {
            const codes = response.data.values.map((v) => v.code)
            // Sorting by Code (e.g., AC, AH, AI...)
            const sortedCodes = [...codes].sort((a, b) => a.localeCompare(b))
            expect(codes).to.deep.equal(
              sortedCodes,
              `API did not return records in alphabetical order by code. Found: ${codes.slice(0, 3)}`
            )
          }
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
