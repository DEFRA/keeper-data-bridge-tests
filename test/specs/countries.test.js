import { expect } from 'chai'
import { describe, it } from 'mocha'
import { getCountriesList, getCountryDetailsById } from '../helpers/api-call.js'
import { KEEPER_DATA_API_URL } from '../helpers/api-endpoints.js'


describe.skip('Countries API Test', () => {

    it('should return a list of countries', async () => {
        const responseCountriesList = await getCountriesList(KEEPER_DATA_API_URL)
        expect(responseCountriesList.status).to.equal(200)
        expect(responseCountriesList.data).to.be.an('array')
        expect(responseCountriesList.data.length).to.be.greaterThan(0)
    })

    it('should return country details by name for England', async () => {
        const responseCountryByName = await getCountriesList(KEEPER_DATA_API_URL, {name:"England"})
        expect(responseCountryByName.status).to.equal(200)
        expect(responseCountryByName.data.name).to.equal("England")
        expect(responseCountryByName.data.longName).to.equal("England - United Kingdom")
        expect(responseCountryByName.data.code).to.equal("GB-ENG")
        expect(responseCountryByName.data.euTradeMember).to.equal("true")
        expect(responseCountryByName.data.devolvedAuthority).to.equal("true")
    })

    it('should return list of EU trade member countries', async () => {
        const responseEuropeCountries = await getCountriesList(KEEPER_DATA_API_URL, { euTradeMember: 'true' })
        expect(responseEuropeCountries.status).to.equal(200)
        expect(responseEuropeCountries.data).to.be.an('array')
        expect(responseEuropeCountries.data.length).to.be.greaterThan(0)
    })

    it('should return list of countries with devolved authority', async () => {
        const responseCountriesWithDevolvedAuthority = await getCountriesList(KEEPER_DATA_API_URL, { devolvedAuthority: 'true' })
        expect(responseCountriesWithDevolvedAuthority.status).to.equal(200)
        expect(responseCountriesWithDevolvedAuthority.data).to.be.an('array')
        expect(responseCountriesWithDevolvedAuthority.data.length).to.be.greaterThan(0)
    })

    it('should return country details by code for United States', async () => {
        const responseCountryByCode = await getCountriesList(KEEPER_DATA_API_URL, {code:"US"})
        expect(responseCountryByCode.status).to.equal(200)
        expect(responseCountryByCode.data.name).to.equal("United States")
        expect(responseCountryByCode.data.longName).to.equal("United States of America")
        expect(responseCountryByCode.data.code).to.equal("US")
        expect(responseCountryByCode.data.euTradeMember).to.equal("false")
        expect(responseCountryByCode.data.devolvedAuthority).to.equal("false")
    })

    it('should return country details by ID', async () => {
        const responseCountryByCode = await getCountriesList(KEEPER_DATA_API_URL, {code:"US"})
        const countryId = responseCountryByCode.data[0].id

        const responseCountryDetailsById = await getCountryDetailsById(KEEPER_DATA_API_URL, countryId)
        expect(responseCountryDetailsById.status).to.equal(200)
        expect(responseCountryDetailsById.data.id).to.equal(countryId)
        expect(responseCountryDetailsById.data.name).to.equal("United States")
        expect(responseCountryDetailsById.data.code).to.equal("US")
    })
    
    it('should return 404 for non-existing country ID', async () => {
        const nonExistingCountryId = 'non-existing-id-12345'
        try {
            await getCountryDetailsById(KEEPER_DATA_API_URL, nonExistingCountryId)
        } catch (error) {
            expect(error.response.status).to.equal(404)
        }
    })

    it('should return 400 for invalid parameters', async () => {
        try {
            await getCountriesList(KEEPER_DATA_API_URL, {foo: 'invalid-value'})
        } catch (error) {
            expect(error.response.status).to.equal(400)
        }
    })
})