import { expect } from 'chai'
import { buildCompositeKey } from './csvUtils.js'

export function findMatchByCompositeKey(actualRows, expectedRow, compositeKeyFields) {
  const expectedKey = buildCompositeKey(expectedRow, compositeKeyFields)
  return actualRows.find(r => buildCompositeKey(r, compositeKeyFields) === expectedKey)
}

export function assertRowsMatch(expectedRows, actualRows, compositeKeyFields) {
  expect(actualRows.length).to.be.greaterThan(0)
  for (const expectedRow of expectedRows) {
    const match = findMatchByCompositeKey(actualRows, expectedRow, compositeKeyFields)
    expect(match, `No matching record found for expected row: ${JSON.stringify(expectedRow)}`).to.exist
    for (const [key, expectedValue] of Object.entries(expectedRow)) {
      if (!key) continue
      expect(match).to.have.property(key)
      const actualVal = match[key] === null || match[key] === undefined ? '' : String(match[key])
      expect(actualVal).to.equal(String(expectedValue))
    }
  }
}
