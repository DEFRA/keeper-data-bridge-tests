import { getEnvironment } from '../helpers/api-endpoints.js'
import { performE2EFlow, setFileProcessor } from '../helpers/e2e-etl-dev-flow.js'
import FileProcessor from '../helpers/file-processor.js'
import { describe, it } from 'mocha'
import { expect } from 'chai'

describe('E2E ETL Test', function () {
  this.timeout(180000)

  let processor

  before(async function () {
    const env = await getEnvironment()
    if (env !== 'dev') {
      this.skip()
    }

    // Process and encrypt CSV files before running tests
    // FileProcessor will use test/data/raw by default at runtime
    processor = new FileProcessor()
    // Or specify custom path: processor = new FileProcessor('../data/raw')
    await processor.processAllFiles()
    setFileProcessor(processor)
  })

  it('check that environment is dev', async function () {
    const env = await getEnvironment()
    expect(env).to.equal('dev')
  })

   it('check that environment is dev2', async function () {
    expect(process.env.Environment).to.equal('dev')
  })
  

  it('should perform a sample test for SAM CPH HOLDINGS', async () => {
    const fileNamePattern = 'LITP_SAMCPHHOLDING_{0}.csv'
    const collectionName = 'sam_cph_holdings'
    const compositeKeyFields = [
      'CPH',
      'FEATURE_NAME',
      'SECONDARY_CPH',
      'ANIMAL_SPECIES_CODE'
    ]

    await performE2EFlow(fileNamePattern, collectionName, compositeKeyFields)
  })

  it('should perform another sample test for SAM CPH HOLDER', async () => {
    const fileNamePattern = 'LITP_SAMCPHHOLDER_{0}.csv'
    const collectionName = 'sam_cph_holder'
    const compositeKeyFields = ['PARTY_ID']

    await performE2EFlow(fileNamePattern, collectionName, compositeKeyFields)
  })

  it('should perform another sample test for SAM HERD', async () => {
    const fileNamePattern = 'LITP_SAMHERD_{0}.csv'
    const collectionName = 'sam_herd'
    const compositeKeyFields = ['CPHH', 'HERDMARK', 'ANIMAL_PURPOSE_CODE']

    await performE2EFlow(fileNamePattern, collectionName, compositeKeyFields)
  })

  it('should perform another sample test for SAM PARTY', async () => {
    const fileNamePattern = 'LITP_SAMPARTY_{0}.csv'
    const collectionName = 'sam_party'
    const compositeKeyFields = ['PARTY_ID']

    await performE2EFlow(fileNamePattern, collectionName, compositeKeyFields)
  })

  it('should perform another sample test for CTS KEEPER', async () => {
    const fileNamePattern = 'LITP_CTSKEEPER_{0}.csv'
    const collectionName = 'cts_keeper'
    const compositeKeyFields = ['PAR_ID', 'LID_FULL_IDENTIFIER']

    await performE2EFlow(fileNamePattern, collectionName, compositeKeyFields)
  })

  it('should perform another sample test for CTS CPH HOLDING', async () => {
    const fileNamePattern = 'LITP_CTSCPHHOLDING_{0}.csv'
    const collectionName = 'cts_cph_holding'
    const compositeKeyFields = ['LID_FULL_IDENTIFIER']

    await performE2EFlow(fileNamePattern, collectionName, compositeKeyFields)
  })
})
