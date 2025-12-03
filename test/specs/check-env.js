import { expect } from "chai"

describe('Environment Check', function () {
    it('should have the ENVIRONMENT variable set', function () {
        const environment = process.env.ENVIRONMENT || ''
        expect(environment).to.equal('dev', 'ENVIRONMENT variable is not set to dev')
    })
})