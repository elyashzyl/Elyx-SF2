import test from 'node:test'
import assert from 'node:assert/strict'
import { validateRequestInput } from '../lib/validation.js'

function runValidation(body, path = '/monthly') {
  let response
  let continued = false
  const req = { method: 'POST', path, body, query: {}, params: {} }
  const res = {
    status(code) {
      response = { status: code }
      return this
    },
    json(payload) {
      response.body = payload
      return this
    }
  }
  validateRequestInput(req, res, () => { continued = true })
  return { continued, response }
}

test('monthly SF2 payloads can contain a full class attendance grid', () => {
  const entries = Array.from({ length: 60 }, (_, studentIndex) => ({
    studentId: `student-${studentIndex}`,
    name: `Student ${studentIndex}`,
    days: Object.fromEntries(Array.from({ length: 31 }, (_, day) => [String(day + 1), '']))
  }))

  const result = runValidation({
    schoolId: 'school-1',
    month: 1,
    year: 2026,
    grade: 'Grade 7',
    section: 'Section A',
    entries
  })

  assert.equal(result.continued, true)
  assert.equal(result.response, undefined)
})

test('SF2 export payloads can contain the attendance grid', () => {
  const entries = Array.from({ length: 60 }, (_, studentIndex) => ({
    studentId: `student-${studentIndex}`,
    days: Object.fromEntries(Array.from({ length: 31 }, (_, day) => [String(day + 1), '']))
  }))
  const result = runValidation({ entries }, '/export/sf2')

  assert.equal(result.continued, true)
  assert.equal(result.response, undefined)
})

test('non-monthly payloads retain the strict field limit', () => {
  const body = Object.fromEntries(Array.from({ length: 201 }, (_, index) => [`field${index}`, index]))
  const result = runValidation(body, '/users')

  assert.equal(result.continued, false)
  assert.equal(result.response.status, 400)
  assert.equal(result.response.body.error, 'Request contains too many fields')
})
