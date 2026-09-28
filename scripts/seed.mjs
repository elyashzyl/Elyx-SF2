// Explicit database seeder for ElyTrack.
// No application, school, account, plan, license, or sample records are embedded
// here. Supply records through --data-file or SEED_DATA_FILE.
//
// Example:
//   node scripts/seed.mjs --data-file ./seed-data.json
//
// The JSON document may contain: school, admin, grades, plans, license,
// teachers, students, payment_methods, attendance_records, and monthly_records.

import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { v4 as uuidv4 } from 'uuid'
import { initDatabase, query, run, saveDatabase, DB_MODE } from '../db.js'

function parseArgs(argv) {
  const options = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--data-file') options.dataFile = argv[++i]
    else if (arg === '--help' || arg === '-h') options.help = true
    else throw new Error(`Unknown argument: ${arg}`)
  }
  return options
}

function printHelp() {
  console.log(`ElyTrack explicit database seeder

Usage:
  node scripts/seed.mjs --data-file <path>

Environment:
  SEED_DATA_FILE  Path to a JSON document containing the records to insert

No records are created without an explicit data file. Application startup and
migrations never invoke this seeder.`)
}

function required(value, label) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new Error(`${label} is required in the seed data file.`)
  }
  return value
}

function jsonValue(value, fallback) {
  if (value === undefined || value === null) return JSON.stringify(fallback)
  return typeof value === 'string' ? value : JSON.stringify(value)
}

function dateOnly(value) {
  return value || new Date().toISOString().slice(0, 10)
}

async function upsertById(table, id, columns, values) {
  const existing = await query(`SELECT id FROM ${table} WHERE id = ?`, [id])
  if (existing.length) {
    const assignments = columns.map(column => `${column} = ?`).join(', ')
    await run(`UPDATE ${table} SET ${assignments} WHERE id = ?`, [...values, existing[0].id])
    return existing[0].id
  }
  await run(`INSERT INTO ${table} (id, ${columns.join(', ')}) VALUES (?, ${columns.map(() => '?').join(', ')})`, [id, ...values])
  return id
}

async function upsertSchool(school) {
  required(school?.name, 'school.name')
  const id = school.id || uuidv4()
  const existing = await query('SELECT id FROM schools WHERE id = ?', [id])
  if (existing.length) {
    await run('UPDATE schools SET name = ?, school_id = ?, address = ?, short = ? WHERE id = ?',
      [school.name, school.school_id || '', school.address || '', school.short || '', id])
  } else {
    await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)',
      [id, school.name, school.school_id || '', school.address || '', school.short || ''])
  }
  return id
}

async function upsertUser(user, schoolId, role) {
  required(user?.username, `${role}.username`)
  required(user?.password, `${role}.password`)
  required(user?.name, `${role}.name`)
  const id = user.id || uuidv4()
  const existing = await query('SELECT id FROM users WHERE id = ? OR username = ?', [id, user.username])
  if (existing.length) {
    await run(`UPDATE users SET username = ?, password = ?, name = ?, role = ?, grade = ?, section = ?, period = ?, school_id = ? WHERE id = ?`,
      [user.username, user.password, user.name, role, user.grade || '', user.section || '', user.period || '', schoolId || '', existing[0].id])
    return existing[0].id
  }
  await run(`INSERT INTO users (id, username, password, name, role, grade, section, period, school_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, user.username, user.password, user.name, role, user.grade || '', user.section || '', user.period || '', schoolId || ''])
  return id
}

async function seedGrades(grades, schoolId) {
  for (let index = 0; index < (grades || []).length; index += 1) {
    const grade = grades[index]
    required(grade?.grade, `grades[${index}].grade`)
    const id = grade.id || `${schoolId}-${uuidv4()}`
    await upsertById('grade_levels', id,
      ['school_id', 'grade', 'sections', 'sort'],
      [schoolId, grade.grade, jsonValue(grade.sections || [], []), grade.sort ?? index])
  }
}

async function seedPlans(plans) {
  for (let index = 0; index < (plans || []).length; index += 1) {
    const plan = plans[index]
    required(plan?.id, `plans[${index}].id`)
    required(plan?.tier, `plans[${index}].tier`)
    required(plan?.name, `plans[${index}].name`)
    required(plan?.currency, `plans[${index}].currency`)
    const billingMonths = Number(plan.billing_months)
    if (!Number.isInteger(billingMonths) || billingMonths <= 0) throw new Error(`plans[${index}].billing_months must be a positive integer`)
    const trialDays = Number(plan.trial_days)
    if (!Number.isInteger(trialDays) || trialDays < 0) throw new Error(`plans[${index}].trial_days must be a non-negative integer`)
    const maxTeachers = Number(plan.max_teachers)
    const maxStudents = Number(plan.max_students)
    if (!Number.isInteger(maxTeachers) || maxTeachers <= 0 || !Number.isInteger(maxStudents) || maxStudents <= 0) {
      throw new Error(`plans[${index}] capacity limits must be positive integers`)
    }
    const values = [
      plan.id, plan.tier, plan.name, plan.tag || '', plan.description || '',
      Number(plan.price_monthly), Number(plan.price_annual_monthly),
      Number(plan.billing_annual_total), billingMonths, plan.currency, trialDays,
      maxTeachers, maxStudents, Number(plan.is_featured || 0),
      plan.badge || '', plan.cta_text || '', plan.cta_url || '', jsonValue(plan.features || [], []),
      jsonValue(plan.modules || {}, {}), Number(plan.sort_order ?? index)
    ]
    await upsertById('subscription_plans', plan.id, [
      'tier', 'name', 'tag', 'description', 'price_monthly', 'price_annual_monthly',
      'billing_annual_total', 'billing_months', 'currency', 'trial_days', 'max_teachers', 'max_students',
      'is_featured', 'badge', 'cta_text', 'cta_url', 'features', 'modules', 'sort_order'
    ], values.slice(1))
  }
}

async function seedLicense(license, schoolId) {
  if (!license) return
  required(license.plan_tier, 'license.plan_tier')
  const plan = (await query('SELECT * FROM subscription_plans WHERE tier = ? OR id = ? LIMIT 1', [license.plan_tier, license.plan_tier]))[0]
  if (!plan) throw new Error(`license.plan_tier does not reference a seeded plan: ${license.plan_tier}`)
  const id = license.id || uuidv4()
  await upsertById('licenses', id, [
    'school_id', 'license_key', 'plan_tier', 'status', 'billing_cycle', 'max_teachers',
    'max_students', 'issued_at', 'expires_at', 'trial_ends_at', 'features', 'notes'
  ], [
    schoolId, required(license.license_key, 'license.license_key'), license.plan_tier,
    license.status || '', license.billing_cycle || '', Number(license.max_teachers ?? plan.max_teachers ?? 0),
    Number(license.max_students ?? plan.max_students ?? 0), dateOnly(license.issued_at), license.expires_at || '',
    license.trial_ends_at || '', jsonValue(license.features || plan.modules || {}, {}), license.notes || ''
  ])
}

async function seedPaymentMethods(methods) {
  for (const method of methods || []) {
    required(method?.id, 'payment_methods[].id')
    await upsertById('payment_methods', method.id,
      ['type', 'bank_name', 'account_name', 'account_number', 'qr_image_url', 'instructions', 'is_active', 'sort_order'], [
        method.type || '', method.bank_name || '', method.account_name || '', method.account_number || '',
        method.qr_image_url || '', method.instructions || '', Number(method.is_active ?? 1), Number(method.sort_order || 0)
      ])
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }
  const dataFile = options.dataFile || process.env.SEED_DATA_FILE
  if (!dataFile) throw new Error('No seed data file supplied. Use --data-file or SEED_DATA_FILE.')
  const absolute = path.resolve(process.cwd(), dataFile)
  const data = JSON.parse(fs.readFileSync(absolute, 'utf8'))
  await initDatabase()
  console.log(`[seeder] Connected to backend: ${DB_MODE.toUpperCase()}`)

  const schoolId = await upsertSchool(data.school)
  await upsertUser(data.admin, '', 'superadmin')
  await seedGrades(data.grades, schoolId)
  await seedPlans(data.plans)
  await seedLicense(data.license, schoolId)
  await seedPaymentMethods(data.payment_methods)

  for (const teacher of data.teachers || []) await upsertUser(teacher, schoolId, 'teacher')
  for (const student of data.students || []) {
    required(student?.id, 'students[].id')
    required(student?.name, 'students[].name')
    await upsertById('students', student.id,
      ['name', 'grade', 'section', 'gender', 'school_id'],
      [student.name, student.grade || '', student.section || '', student.gender || '', schoolId])
  }

  console.log(`[seeder] Imported ${data.teachers?.length || 0} teachers, ${data.students?.length || 0} students, ${(data.plans || []).length} plans.`)
  saveDatabase()
}

main().catch(error => {
  console.error('[seeder] Seeding failed:', error.message)
  process.exit(1)
})
