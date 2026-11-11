import test from 'node:test'
import assert from 'node:assert/strict'
import { validateRequestInput } from '../lib/validation.js'

function runValidation(body, path = '/monthly', originalUrl = '') {
  let response
  let continued = false
  const req = { method: 'POST', path, originalUrl, body, query: {}, params: {} }
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

test('mounted API paths also allow large SF2 payloads', () => {
  const entries = Array.from({ length: 60 }, (_, studentIndex) => ({
    studentId: `student-${studentIndex}`,
    days: Object.fromEntries(Array.from({ length: 31 }, (_, day) => [String(day + 1), '']))
  }))
  const result = runValidation({ entries }, '/api/export/sf2', '/api/export/sf2?schoolId=school-1')

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

test('class-record save payloads can contain scores for a full class section', () => {
  const learners = Array.from({ length: 60 }, (_, index) => ({
    studentId: `student-${index}`,
    wwScores: [18, 19, 20, 15, 17, 18, 19, 20, 18, 19],
    ptScores: [24, 25, 23, 24, 25, 22, 23, 24, 25, 25],
    qaScores: [48],
    recScores: [10, 9, 10, 8],
    swScores: [25, 24, 25, 23],
    isLocked: 0
  }))

  const payload = {
    schoolId: 'school-1',
    gradeLevel: 'Grade 8',
    section: 'Emerald',
    subjectId: 'sub-1',
    quarter: 'Q1',
    schoolYear: '2026-2027',
    weightWw: 30,
    weightPt: 50,
    weightQa: 20,
    splitPt: false,
    wwHps: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
    ptHps: [25, 25, 25, 25, 25, 25, 25, 25, 25, 25],
    qaHps: [50],
    learners
  }

  const result = runValidation(payload, '/api/grading/class-record/save', '/api/grading/class-record/save')
  assert.equal(result.continued, true)
  assert.equal(result.response, undefined)
})

test('grade sheet save payloads can contain grades for a full class section', () => {
  const grades = Array.from({ length: 60 }, (_, index) => ({
    studentId: `student-${index}`,
    wwScore: 90,
    wwTotal: 100,
    ptScore: 85,
    ptTotal: 100,
    qaScore: 45,
    qaTotal: 50,
    isLocked: 0
  }))

  const payload = {
    schoolId: 'school-1',
    subjectId: 'sub-1',
    quarter: 'Q1',
    schoolYear: '2026-2027',
    grades
  }

  const result = runValidation(payload, '/grading/sheet/save')
  assert.equal(result.continued, true)
  assert.equal(result.response, undefined)
})

test('daily attendance payloads can contain roll call entries for a full class section', () => {
  const entries = Array.from({ length: 60 }, (_, index) => ({
    studentId: `student-${index}`,
    status: 'P',
    remarks: '',
    timeIn: '07:30',
    timeOut: '16:00'
  }))

  const payload = {
    date: '2026-06-10',
    grade: 'Grade 8',
    section: 'Emerald',
    adviser: 'Teacher One',
    entries
  }

  const result = runValidation(payload, '/api/attendance', '/api/attendance')
  assert.equal(result.continued, true)
  assert.equal(result.response, undefined)
})
