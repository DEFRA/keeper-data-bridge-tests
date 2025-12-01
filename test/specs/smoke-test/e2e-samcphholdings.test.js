import { getEnvironment } from '../../helpers/apiEndpoints.js'
import { performE2EFlow } from '../../helpers/e2e-flow.js'
import { describe, it } from 'mocha'

describe('E2E ETL Test', function () {
  this.timeout(180000)

  before(async function () {
    const env = await getEnvironment()
    if (env !== 'dev') {
      this.skip()
    }
  })

  it('should perform a sample test for SAM CPH HOLDINGS', async () => {
    const fileName = 'LITP_SAMCPHHOLDING_20251101000010.csv'
    const collectionName = 'sam_cph_holdings'
    const compositeKeyFields = [
      'CPH',
      'FEATURE_NAME',
      'SECONDARY_CPH',
      'ANIMAL_SPECIES_CODE'
    ]

    await performE2EFlow(fileName, collectionName, compositeKeyFields)
  })

  it('should perform another sample test for SAM CPH HOLDER', async () => {
    const fileName = 'LITP_SAMCPHHOLDER_20251101000004.csv'
    const collectionName = 'sam_cph_holder'
    const compositeKeyFields = ['PARTY_ID']

    await performE2EFlow(fileName, collectionName, compositeKeyFields)
  })

  it('should perform another sample test for SAM HERD', async () => {
    const fileName = 'LITP_SAMHERD_20251101000001.csv'
    const collectionName = 'sam_herd'
    const compositeKeyFields = ['CPHH', 'HERDMARK', 'ANIMAL_PURPOSE_CODE']

    await performE2EFlow(fileName, collectionName, compositeKeyFields)
  })

  it('should perform another sample test for SAM PARTY', async () => {
    const fileName = 'LITP_SAMPARTY_20251101000002.csv'
    const collectionName = 'sam_party'
    const compositeKeyFields = ['PARTY_ID']

    await performE2EFlow(fileName, collectionName, compositeKeyFields)
  })

  it('should perform another sample test for CTS KEEPER', async () => {
    const fileName = 'LITP_CTSKEEPER_20251101000001.csv'
    const collectionName = 'cts_keeper'
    const compositeKeyFields = ['PAR_ID', 'LID_FULL_IDENTIFIER']

    await performE2EFlow(fileName, collectionName, compositeKeyFields)
  })

  it('should perform another sample test for CTS CPH HOLDING', async () => {
    const fileName = 'LITP_CTSCPHHOLDING_20251101000001.csv'
    const collectionName = 'cts_cph_holding'
    const compositeKeyFields = ['LID_FULL_IDENTIFIER']

    await performE2EFlow(fileName, collectionName, compositeKeyFields)
  })
})
