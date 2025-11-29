import { performE2EFlow } from '../../helpers/e2e-flow.js'
import { expect } from 'chai'
import { describe, it } from 'mocha'

describe('E2E SAM CPH Holdings Test', function () {
  this.timeout(180000)

  before(function () {
    const env = process.env.Environment || process.env.NODE_ENV
    if (env !== 'dev') {
      console.log(`Skipping E2E SAM CPH Holdings Test - Environment is '${env}', not 'dev'`)
      this.skip()
    }
  })

  it('should perform a sample test for SAM CPH HOLDINGS', async () => {
    const fileName = 'LITP_SAMCPHHOLDING_20251127000000.csv'
    const collectionName = 'sam_cph_holdings'
    const compositeKeyFields = ['CPH', 'FEATURE_NAME', 'SECONDARY_CPH', 'ANIMAL_SPECIES_CODE']
    
    await performE2EFlow(fileName, collectionName, compositeKeyFields)
    
  })

  it('should perform another sample test for SAM CPH HOLDER', async () => {
    const fileName = 'LITP_SAMCPHHOLDER_20251128010101.csv'
    const collectionName = 'sam_cph_holder'
    const compositeKeyFields =  ["PARTY_ID"]

    await performE2EFlow(fileName, collectionName, compositeKeyFields)
  })

 it('should perform another sample test for SAM HERD', async () => {
    const fileName = 'LITP_SAMHERD_20251128010101.csv'
    const collectionName = 'sam_herd'
    const compositeKeyFields = ["CPHH", "HERDMARK", "ANIMAL_PURPOSE_CODE"]
    
    await performE2EFlow(fileName, collectionName, compositeKeyFields)
    
  })

  it('should perform another sample test for SAM PARTY', async () => {
    const fileName = 'LITP_SAMPARTY_20251129020202.csv'
    const collectionName = 'sam_party'
    const compositeKeyFields = ["PARTY_ID"]
    
    await performE2EFlow(fileName, collectionName, compositeKeyFields)
    
  })

  it('should perform another sample test for CTS KEEPER', async () => {
    const fileName = 'LITP_CTSKEEPER_20251128010101.csv'
    const collectionName = 'cts_keeper'
    const compositeKeyFields = ["PAR_ID", "LID_FULL_IDENTIFIER"]
    
    await performE2EFlow(fileName, collectionName, compositeKeyFields)
    
  })
  
  it('should perform another sample test for CTS CPH HOLDING', async () => {
    const fileName = 'LITP_CTSCPHHOLDING_20251201040404.csv'
    const collectionName = 'cts_cph_holding'
    const compositeKeyFields = ['LID_FULL_IDENTIFIER']
    
    await performE2EFlow(fileName, collectionName, compositeKeyFields)
    
  })

})
