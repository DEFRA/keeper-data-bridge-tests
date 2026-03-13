import { describe, it, before } from 'mocha'
import {
  getCleanseIssues,
  startCleanseAnalysis,
  deleteCleanseData,
  deleteCleanseMetadata,
  waitForCleanseCompletion
} from '../helpers/api-call.js'
import {
  performE2EFlow,
  setFileProcessor
} from '../helpers/e2e-etl-dev-flow.js'
import FileProcessor from '../helpers/file-processor.js'
import { expect } from 'chai'
import { TEST_KEEPER_DATA_BRIDGE_URL } from '../helpers/api-endpoints.js'

describe('Cleanse Report API Test', function () {
  this.timeout(180000)

  let processor
  let cleanseIssuesResponse

  before(async () => {
    // Prepare and register the in-memory file processor for E2E flow
    processor = new FileProcessor()
    await processor.processAllFiles()
    setFileProcessor(processor)

    const fileNamePatternHolding = 'LITP_SAMCPHHOLDING_{0}.csv'
    const collectionNameHolding = 'sam_cph_holdings'
    const compositeKeyFieldsHolding = [
      'CPH',
      'FEATURE_NAME',
      'SECONDARY_CPH',
      'ANIMAL_SPECIES_CODE'
    ]
    await performE2EFlow(
      fileNamePatternHolding,
      collectionNameHolding,
      compositeKeyFieldsHolding
    )

    const fileNamePatternHolder = 'LITP_SAMCPHHOLDER_{0}.csv'
    const collectionNameHolder = 'sam_cph_holder'
    const compositeKeyFieldsHolder = ['PARTY_ID']
    await performE2EFlow(
      fileNamePatternHolder,
      collectionNameHolder,
      compositeKeyFieldsHolder
    )

    const fileNamePatternHerd = 'LITP_SAMHERD_{0}.csv'
    const collectionNameHerd = 'sam_herd'
    const compositeKeyFieldsHerd = ['CPHH', 'HERDMARK', 'ANIMAL_PURPOSE_CODE']
    await performE2EFlow(
      fileNamePatternHerd,
      collectionNameHerd,
      compositeKeyFieldsHerd
    )

    const fileNamePatternParty = 'LITP_SAMPARTY_{0}.csv'
    const collectionNameParty = 'sam_party'
    const compositeKeyFieldsParty = ['PARTY_ID']
    await performE2EFlow(
      fileNamePatternParty,
      collectionNameParty,
      compositeKeyFieldsParty
    )

    const fileNamePatternKeeper = 'LITP_CTSKEEPER_{0}.csv'
    const collectionNameKeeper = 'cts_keeper'
    const compositeKeyFieldsKeeper = ['PAR_ID', 'LID_FULL_IDENTIFIER']
    await performE2EFlow(
      fileNamePatternKeeper,
      collectionNameKeeper,
      compositeKeyFieldsKeeper
    )

    const fileNamePatternCphHolding = 'LITP_CTSCPHHOLDING_{0}.csv'
    const collectionNameCphHolding = 'cts_cph_holding'
    const compositeKeyFieldsCphHolding = ['LID_FULL_IDENTIFIER']
    await performE2EFlow(
      fileNamePatternCphHolding,
      collectionNameCphHolding,
      compositeKeyFieldsCphHolding
    )

    const responseDeleteCleanseData = await deleteCleanseData(
      TEST_KEEPER_DATA_BRIDGE_URL
    )
    expect(responseDeleteCleanseData.status).to.equal(200)
    const responseDeleteCleanseMetadata = await deleteCleanseMetadata(
      TEST_KEEPER_DATA_BRIDGE_URL
    )
    expect(responseDeleteCleanseMetadata.status).to.equal(200)
    const responseCleanseAnalysis = await startCleanseAnalysis(
      TEST_KEEPER_DATA_BRIDGE_URL
    )
    expect(responseCleanseAnalysis.status).to.equal(202)

    const operationId = responseCleanseAnalysis.data.operationId
    expect(
      operationId,
      'operationId should be returned from cleanse analysis'
    ).to.be.a('string')

    const responseCleanseCompletion = await waitForCleanseCompletion(
      TEST_KEEPER_DATA_BRIDGE_URL,
      operationId
    )
    expect(responseCleanseCompletion.status).to.equal(200)

    // Fetch top 100 cleanse issues once after the analysis is completed and reuse in tests
    cleanseIssuesResponse = await getCleanseIssues(
      TEST_KEEPER_DATA_BRIDGE_URL,
      { top: 100 }
    )
    expect(cleanseIssuesResponse.status).to.equal(200)
  })

  it('should return a list of cleanse issues', async () => {
    expect(cleanseIssuesResponse).to.not.equal(undefined)
    expect(cleanseIssuesResponse.data).to.have.property('count')
    expect(cleanseIssuesResponse.data.count).to.be.greaterThan(0)
    cleanseIssuesResponse.data.issues.forEach((issue) => {
      expect(issue).to.have.property('cph')
      if (issue.cph) {
        const cphValue = parseInt(issue.cph.split('/')[0])
        expect(cphValue).to.be.within(1, 51)
      }
    })
  })

  // Rule 1
  it('Rule 1: should contain SAM_NO_CATTLE_UNIT issues', () => {
    const issues = (cleanseIssuesResponse.data.issues || []).filter(
      (issue) => issue.issueCode === 'SAM_NO_CATTLE_UNIT'
    )
    expect(issues.length).to.be.greaterThan(0)
    issues.forEach((issue) => {
      expect(issue.issueCode).to.equal('SAM_NO_CATTLE_UNIT')
      expect(issue.ruleCode).to.equal('1')
      expect(issue.errorCode).to.equal('01')
      expect(issue.errorDescription).to.equal('No cattle unit defined in SAM')
    })
  })

  // Rule 2A
  it('Rule 2A: should contain CTS_CPH_NOT_IN_SAM issues', () => {
    const issues = (cleanseIssuesResponse.data.issues || []).filter(
      (issue) => issue.issueCode === 'CTS_CPH_NOT_IN_SAM'
    )
    expect(issues.length).to.be.greaterThan(0)
    issues.forEach((issue) => {
      expect(issue.issueCode).to.equal('CTS_CPH_NOT_IN_SAM')
      expect(issue.ruleCode).to.equal('2A')
      expect(issue.errorCode).to.equal('02A')
      expect(issue.ctsLidFullIdentifier).to.be.a('string')
      expect(issue.ctsLidFullIdentifier.length).to.be.greaterThan(0)
      // expect(issue.cph).to.equal('') // CPH should be empty when issue is CTS_CPH_NOT_IN_SAM
    })
  })

  // Rule 2B
  it('Rule 2B: should contain SAM_CPH_NOT_IN_CTS issues with correct structure', () => {
    const issues = (cleanseIssuesResponse.data.issues || []).filter(
      (issue) => issue.issueCode === 'SAM_CPH_NOT_IN_CTS'
    )
    expect(issues.length).to.be.greaterThan(0)
    issues.forEach((issue) => {
      expect(issue.cph).to.be.a('string')
      expect(issue.cph.length).to.be.greaterThan(0)
      expect(issue.ctsLidFullIdentifier).to.equal('')
      expect(issue.issueCode).to.equal('SAM_CPH_NOT_IN_CTS')
      expect(issue.ruleCode).to.equal('2B')
      expect(issue.errorCode).to.equal('02B')
    })
  })

  // Rule 3
  it('Rule 3: should contain SAM_CATTLE_RELATED_CPHs issues for cattle-related CPHs', () => {
    const issues = (cleanseIssuesResponse.data.issues || []).filter(
      (issue) => issue.issueCode === 'SAM_CATTLE_RELATED_CPHs'
    )
    expect(issues.length).to.be.greaterThan(0)
    issues.forEach((issue) => {
      expect(issue.issueCode).to.equal('SAM_CATTLE_RELATED_CPHs')
      expect(issue.ruleCode).to.equal('3')
      expect(issue.errorCode).to.equal('03')
      expect(issue.errorDescription).to.equal(
        'Cattle-related CPHs in SAM (e.g. those with relevant animal species or purpose codes) that are not present in CTS'
      )
    })
  })

  // Rule 4
  it('Rule 4: should contain CTS_SAM_NO_EMAIL_ADDRESSES issues with no emails in either system', () => {
    const issues = (cleanseIssuesResponse.data.issues || []).filter(
      (issue) => issue.issueCode === 'CTS_SAM_NO_EMAIL_ADDRESSES'
    )
    expect(issues.length).to.be.greaterThan(0)
    issues.forEach((issue) => {
      expect(issue.issueCode).to.equal('CTS_SAM_NO_EMAIL_ADDRESSES')
      expect(issue.ruleCode).to.equal('4')
      expect(issue.errorCode).to.equal('04')
      expect(issue.errorDescription).to.equal(
        'CPH present in both CTS and SAM but no email addresses in either system'
      )
      expect(issue.emailCTS).to.equal(null)
      expect(issue.emailSAM).to.equal(null)
    })
  })

  // Rule 5
  it('Rule 5: should contain CTS_SAM_NO_PHONE_NUMBERS issues with no phone numbers in either system', () => {
    const issues = (cleanseIssuesResponse.data.issues || []).filter(
      (issue) => issue.issueCode === 'CTS_SAM_NO_PHONE_NUMBERS'
    )
    expect(issues.length).to.be.greaterThan(0)
    issues.forEach((issue) => {
      expect(issue.issueCode).to.equal('CTS_SAM_NO_PHONE_NUMBERS')
      expect(issue.ruleCode).to.equal('5')
      expect(issue.errorCode).to.equal('05')
      expect(issue.errorDescription).to.equal(
        'No telephone numbers in CTS and Sam'
      )
      expect(issue.telCTS).to.equal(null)
      expect(issue.telSAM).to.equal(null)
    })
  })

  // Rule 6
  it('Rule 6: should contain CTS_SAM_INCONSIS_EMAILS issues with email discrepancies', () => {
    const issues = (cleanseIssuesResponse.data.issues || []).filter(
      (issue) => issue.issueCode === 'CTS_SAM_INCONSIS_EMAILS'
    )
    expect(issues.length).to.be.greaterThan(0)
    issues.forEach((issue) => {
      expect(issue.issueCode).to.equal('CTS_SAM_INCONSIS_EMAILS')
      expect(issue.ruleCode).to.equal('6')
      expect(issue.errorCode).to.equal('06')
      expect(issue.errorDescription).to.equal(
        'SAM is missing email addresses found in CTS'
      )
      expect(issue.emailSAM).to.be.not.equal(issue.emailCTS)
      // at least one CTS email should be missing in SAM for the issue to be CTS_SAM_INCONSIS_EMAILS
      const samEmails = Array.isArray(issue.emailSAM)
        ? issue.emailSAM.map((email) => email.toLowerCase())
        : []
      const ctsEmails = Array.isArray(issue.emailCTS)
        ? issue.emailCTS.map((email) => email.toLowerCase())
        : []
      const hasMissingInSam = ctsEmails.some(
        (ctsEmail) => !samEmails.includes(ctsEmail)
      )
      expect(hasMissingInSam).to.equal(true)
    })
  })

  // Rule 9
  it('Rule 9: should contain CTS_SAM_INCONSIS_PHONENOS issues with phone discrepancies', () => {
    const issues = (cleanseIssuesResponse.data.issues || []).filter(
      (issue) => issue.issueCode === 'CTS_SAM_INCONSIS_PHONENOS'
    )
    expect(issues.length).to.be.greaterThan(0)
    issues.forEach((issue) => {
      expect(issue.issueCode).to.equal('CTS_SAM_INCONSIS_PHONENOS')
      expect(issue.ruleCode).to.equal('9')
      expect(issue.errorCode).to.equal('09')
      expect(issue.errorDescription).to.equal(
        'SAM is missing phone numbers found in CTS'
      )
      expect(issue.telSAM).to.be.not.equal(issue.telCTS)
      // at least one CTS phone number should be missing in SAM for the issue to be CTS_SAM_INCONSIS_PHONENOS
      const samPhones = Array.isArray(issue.telSAM)
        ? issue.telSAM.map((phone) => phone.toLowerCase())
        : []
      const ctsPhones = Array.isArray(issue.telCTS)
        ? issue.telCTS.map((phone) => phone.toLowerCase())
        : []
      const hasMissingInSam = ctsPhones.some(
        (ctsPhone) => !samPhones.includes(ctsPhone)
      )
      expect(hasMissingInSam).to.equal(true)
    })
  })

  // Rule 11
  it('Rule 11: should contain SAM_MISSING_PHONE_NUMBERS issues with missing SAM phones', () => {
    const issues = (cleanseIssuesResponse.data.issues || []).filter(
      (issue) => issue.issueCode === 'SAM_MISSING_PHONE_NUMBERS'
    )
    expect(issues.length).to.be.greaterThan(0)
    issues.forEach((issue) => {
      expect(issue.issueCode).to.equal('SAM_MISSING_PHONE_NUMBERS')
      expect(issue.ruleCode).to.equal('11')
      expect(issue.errorCode).to.equal('11')
      expect(issue.errorDescription).to.equal(
        'Phone number in CTS but missing in SAM'
      )
      expect(Array.isArray(issue.telCTS)).to.equal(true)
      expect(issue.telCTS.length).to.be.greaterThan(0)
      expect(issue.telSAM).to.equal(null)
    })
  })

  // Rule 12
  it('Rule 12: should contain SAM_MISSING_EMAIL_ADDRESS issues with missing SAM emails', () => {
    const issues = (cleanseIssuesResponse.data.issues || []).filter(
      (issue) => issue.issueCode === 'SAM_MISSING_EMAIL_ADDRESS'
    )
    expect(issues.length).to.be.greaterThan(0)
    issues.forEach((issue) => {
      expect(issue.issueCode).to.equal('SAM_MISSING_EMAIL_ADDRESS')
      expect(issue.ruleCode).to.equal('12')
      expect(issue.errorCode).to.equal('12')
      expect(issue.errorDescription).to.equal(
        'Email address in CTS but missing in SAM'
      )
      expect(Array.isArray(issue.emailCTS)).to.equal(true)
      expect(issue.emailCTS.length).to.be.greaterThan(0)
      expect(issue.emailSAM).to.equal(null)
    })
  })
})
