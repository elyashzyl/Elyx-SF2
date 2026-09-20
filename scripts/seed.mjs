// Database Seeder for ElyTrack
// Seeds school operations data without hardcoding credentials or school configuration.
// All values can be passed via CLI arguments or Environment Variables.
//
// Usage:
//   npm run db:seed
//   node scripts/seed.mjs --admin-user myadmin --admin-pass "Secret123!" --school-name "My School"
//   SEED_SAMPLE_DATA=false npm run db:seed  # Seeds only admin, school, and grade levels

import 'dotenv/config'
import process from 'node:process'
import { v4 as uuidv4 } from 'uuid'
import { initDatabase, query, run, saveDatabase, DB_MODE } from '../db.js'

function parseArgs(argv) {
  const options = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--admin-user' || arg === '--admin-username') options.adminUsername = argv[++i]
    else if (arg === '--admin-pass' || arg === '--admin-password') options.adminPassword = argv[++i]
    else if (arg === '--admin-name') options.adminName = argv[++i]
    else if (arg === '--school-name') options.schoolName = argv[++i]
    else if (arg === '--school-short') options.schoolShort = argv[++i]
    else if (arg === '--school-id') options.schoolId = argv[++i]
    else if (arg === '--school-address') options.schoolAddress = argv[++i]
    else if (arg === '--teacher-pass' || arg === '--teacher-password') options.teacherPassword = argv[++i]
    else if (arg === '--students-per-section') options.studentsPerSection = parseInt(argv[++i], 10)
    else if (arg === '--sample') options.sample = true
    else if (arg === '--no-sample' || arg === '--minimal') options.sample = false
    else if (arg === '--help' || arg === '-h') options.help = true
  }
  return options
}

function printHelp() {
  console.log(`
ElyTrack Database Seeder

Usage:
  node scripts/seed.mjs [options]

Options:
  --admin-user <username>       Superadmin username (default: env ADMIN_USERNAME or 'admin')
  --admin-pass <password>       Superadmin password (default: env ADMIN_PASSWORD or 'ElyTrack2026!')
  --admin-name <name>           Superadmin full name (default: env ADMIN_NAME or 'System Administrator')
  --school-name <name>          School full name (default: env SCHOOL_NAME or 'Baguio Patriotic High School')
  --school-short <short>        School abbreviation (default: env SCHOOL_SHORT or 'BPHS')
  --school-id <id>              DepEd School ID (default: env SCHOOL_ID or '406219')
  --school-address <address>    School address (default: env SCHOOL_ADDRESS or 'Baguio City, Philippines')
  --teacher-pass <password>     Sample teachers password (default: env TEACHER_PASSWORD or 'teacher123')
  --students-per-section <n>    Number of students per section (default: 15)
  --sample                      Seed sample teachers, students, attendance & SF2 records (default)
  --no-sample, --minimal        Seed only school, superadmin, and grade levels
  -h, --help                    Show this help message

Environment Variables:
  ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_NAME
  SCHOOL_NAME, SCHOOL_SHORT, SCHOOL_ID, SCHOOL_ADDRESS
  TEACHER_PASSWORD, SEED_SAMPLE_DATA, STUDENTS_PER_SECTION
`)
}

// Realistic Filipino name pools
const LAST_NAMES = [
  'DELA CRUZ', 'SANTOS', 'REYES', 'GARCIA', 'MENDOZA',
  'AQUINO', 'BAUTISTA', 'CASTRO', 'RAMOS', 'FLORES',
  'NAVARRO', 'VILLANUEVA', 'TOLENTINO', 'DOMINGO', 'SALAZAR',
  'VALDEZ', 'PEREZ', 'MERCADO', 'SORIANO', 'ROXAS',
  'PASCUAL', 'CORTEZ', 'ALVAREZ', 'FERRER', 'DEL ROSARIO'
]

const MALE_NAMES = [
  'JUAN', 'MARK ANTHONY', 'CARLO', 'CHRISTIAN', 'ANGELO',
  'KENNETH', 'PAOLO', 'GABRIEL', 'DANIEL', 'JOSHUA',
  'JOHN PAUL', 'KEVIN', 'FRANCIS', 'MIGUEL', 'RAFAEL'
]

const FEMALE_NAMES = [
  'MARIA CLARA', 'ANGELA', 'BEA', 'CHRISTINE', 'PRINCESS',
  'NICOLE', 'PATRICIA', 'CAMILLE', 'SOFIA', 'JASMINE',
  'ALYSSA', 'ANDREA', 'CLARISSE', 'KIMBERLY', 'SAMANTHA'
]

const MIDDLE_INITIALS = ['A.', 'B.', 'C.', 'D.', 'E.', 'F.', 'G.', 'M.', 'P.', 'R.', 'S.', 'T.', 'V.']

const DEFAULT_GRADE_LEVELS = [
  { grade: 'Grade 7', sections: ['Pine', 'Molave'] },
  { grade: 'Grade 8', sections: ['Cypress', 'Narra'] },
  { grade: 'Grade 9', sections: ['Kamagong', 'Mahogany'] },
  { grade: 'Grade 10', sections: ['Acacia', 'Yakal'] }
]

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function main() {
  const cli = parseArgs(process.argv.slice(2))
  if (cli.help) {
    printHelp()
    process.exit(0)
  }

  // Configuration with clean priority: CLI > ENV > Default fallback
  const adminUsername = cli.adminUsername || process.env.ADMIN_USERNAME || 'admin'
  const adminPassword = cli.adminPassword || process.env.ADMIN_PASSWORD || 'ElyTrack2026!'
  const adminName = cli.adminName || process.env.ADMIN_NAME || 'System Administrator'

  const schoolName = cli.schoolName || process.env.SCHOOL_NAME || 'Baguio Patriotic High School'
  const schoolShort = cli.schoolShort || process.env.SCHOOL_SHORT || 'BPHS'
  const schoolId = cli.schoolId || process.env.SCHOOL_ID || '406219'
  const schoolAddress = cli.schoolAddress || process.env.SCHOOL_ADDRESS || 'Baguio City, Philippines'

  const teacherPassword = cli.teacherPassword || process.env.TEACHER_PASSWORD || 'teacher123'
  const seedSample = cli.sample !== undefined
    ? cli.sample
    : (process.env.SEED_SAMPLE_DATA !== 'false' && process.env.SEED_SAMPLE_DATA !== '0')

  const studentsPerSection = cli.studentsPerSection || (process.env.STUDENTS_PER_SECTION ? Number(process.env.STUDENTS_PER_SECTION) : 15)

  await initDatabase()
  console.log(`[seeder] Connected to backend: ${DB_MODE.toUpperCase()}`)

  // 1. Seed or Update Primary School
  console.log(`[seeder] Seeding school: "${schoolName}" (${schoolShort})...`)
  let targetSchoolDbId = 'school-1'
  const existingSchools = await query('SELECT id FROM schools LIMIT 1')
  if (existingSchools.length > 0) {
    targetSchoolDbId = existingSchools[0].id
    await run(
      'UPDATE schools SET name = ?, school_id = ?, address = ?, short = ? WHERE id = ?',
      [schoolName, schoolId, schoolAddress, schoolShort, targetSchoolDbId]
    )
  } else {
    await run(
      'INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)',
      [targetSchoolDbId, schoolName, schoolId, schoolAddress, schoolShort]
    )
  }

  // 2. Seed Superadmin User
  console.log(`[seeder] Seeding superadmin user: "${adminUsername}"...`)
  const existingAdmin = await query('SELECT id FROM users WHERE username = ? OR role = ? LIMIT 1', [adminUsername, 'superadmin'])
  let adminId = '1'
  if (existingAdmin.length > 0) {
    adminId = existingAdmin[0].id
    await run(
      'UPDATE users SET username = ?, password = ?, name = ?, role = ?, school_id = ? WHERE id = ?',
      [adminUsername, adminPassword, adminName, 'superadmin', '', adminId]
    )
  } else {
    await run(
      'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [adminId, adminUsername, adminPassword, adminName, 'superadmin', '', '', '', '']
    )
  }

  // 3. Seed Grade Levels & Sections
  console.log('[seeder] Seeding grade levels and sections...')
  for (let i = 0; i < DEFAULT_GRADE_LEVELS.length; i++) {
    const gl = DEFAULT_GRADE_LEVELS[i]
    const glId = `gl-${targetSchoolDbId}-${i + 1}`
    const existingGl = await query('SELECT id FROM grade_levels WHERE school_id = ? AND grade = ?', [targetSchoolDbId, gl.grade])
    if (existingGl.length > 0) {
      await run('UPDATE grade_levels SET sections = ?, sort = ? WHERE id = ?', [JSON.stringify(gl.sections), i, existingGl[0].id])
    } else {
      await run('INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)',
        [glId, targetSchoolDbId, gl.grade, JSON.stringify(gl.sections), i])
    }
  }

  // 4. Seed Subscription Plans & Campus License
  console.log('[seeder] Seeding subscription plans and operational licenses...')
  const defaultPlans = [
    {
      id: 'adviser',
      tier: 'adviser',
      name: 'Adviser License',
      tag: 'Dedicated',
      description: 'Dedicated single-adviser operational license with a 14-day full feature trial before payment.',
      price_monthly: 249,
      price_annual_monthly: 199,
      billing_annual_total: 1990,
      currency: 'PHP',
      trial_days: 14,
      max_teachers: 1,
      max_students: 65,
      is_featured: 0,
      badge: '14-Day Free Trial',
      cta_text: 'Start 14-Day Trial',
      cta_url: '/login',
      features: JSON.stringify([
        '14-Day Free Evaluation Trial',
        '1 Advisory section license key (up to 65 students)',
        '< 90-second rapid daily roll call',
        'Section-level monthly DepEd SF2 generation',
        'Consecutive absence & SARDO risk flags',
        'Standard printable PDF attendance register',
        'Online license key activation & renewal'
      ]),
      modules: JSON.stringify({
        sf2_export: true,
        sardo_radar: true,
        analytics: true,
        audit_logs: false,
        multi_school: false
      }),
      sort_order: 1
    },
    {
      id: 'campus',
      tier: 'campus',
      name: 'School Pro',
      tag: 'Campus',
      description: 'Institutional license for public & private high schools and elementary campuses.',
      price_monthly: 1490,
      price_annual_monthly: 1190,
      billing_annual_total: 11900,
      currency: 'PHP',
      trial_days: 14,
      max_teachers: 60,
      max_students: 2500,
      is_featured: 1,
      badge: 'DepEd SF2 Certified',
      cta_text: 'Inquire for School Deployment',
      cta_url: 'mailto:deploy@elytrack.ph?subject=ElyTrack%20School%20Pro%20Deployment%20Inquiry',
      features: JSON.stringify([
        'Unlimited faculty, advisers & students',
        'School-wide consolidated DepEd SF2 (.xlsx export)',
        'Automated SARDO early-warning radar & logs',
        'Grade levels & sections configuration management',
        'Quarterly attendance analytics & trend forecasting',
        'Role-based access (Principal, Admin, Faculty)',
        'System audit logs & activity telemetry',
        'Priority faculty onboarding & DepEd updates'
      ]),
      modules: JSON.stringify({
        sf2_export: true,
        sardo_radar: true,
        analytics: true,
        audit_logs: true,
        multi_school: false
      }),
      sort_order: 2
    },
    {
      id: 'division',
      tier: 'division',
      name: 'Division & Multi-Campus',
      tag: 'Institutional',
      description: 'For School Division Offices (SDO), academy networks, and diocesan school clusters.',
      price_monthly: 4990,
      price_annual_monthly: 3990,
      billing_annual_total: 39900,
      currency: 'PHP',
      trial_days: 0,
      max_teachers: 500,
      max_students: 25000,
      is_featured: 0,
      badge: 'Network SDO',
      cta_text: 'Inquire for Division',
      cta_url: 'mailto:inquiries@elytrack.ph?subject=ElyTrack%20Division%20Inquiry',
      features: JSON.stringify([
        'Multi-school governance console',
        'Division-wide attendance aggregation',
        'Centralized license provisioning & seat management',
        'Custom institutional security & SSO integration',
        'Dedicated account engineer & SLA guarantee',
        'Data Privacy Act (RA 10173) compliance verification'
      ]),
      modules: JSON.stringify({
        sf2_export: true,
        sardo_radar: true,
        analytics: true,
        audit_logs: true,
        multi_school: true
      }),
      sort_order: 3
    }
  ]

  for (const p of defaultPlans) {
    const existingPlan = await query('SELECT id FROM subscription_plans WHERE id = ? OR tier = ?', [p.id, p.tier])
    if (existingPlan.length > 0) {
      await run(
        `UPDATE subscription_plans SET
          name = ?, tag = ?, description = ?, price_monthly = ?, price_annual_monthly = ?,
          billing_annual_total = ?, currency = ?, trial_days = ?, max_teachers = ?,
          max_students = ?, is_featured = ?, badge = ?, cta_text = ?, cta_url = ?,
          features = ?, modules = ?, sort_order = ?
         WHERE id = ?`,
        [
          p.name, p.tag, p.description, p.price_monthly, p.price_annual_monthly,
          p.billing_annual_total, p.currency, p.trial_days, p.max_teachers,
          p.max_students, p.is_featured, p.badge, p.cta_text, p.cta_url,
          p.features, p.modules, p.sort_order, existingPlan[0].id
        ]
      )
    } else {
      await run(
        `INSERT INTO subscription_plans (
          id, tier, name, tag, description, price_monthly, price_annual_monthly,
          billing_annual_total, currency, trial_days, max_teachers, max_students,
          is_featured, badge, cta_text, cta_url, features, modules, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id, p.tier, p.name, p.tag, p.description, p.price_monthly, p.price_annual_monthly,
          p.billing_annual_total, p.currency, p.trial_days, p.max_teachers, p.max_students,
          p.is_featured, p.badge, p.cta_text, p.cta_url, p.features, p.modules, p.sort_order
        ]
      )
    }
  }

  // Seed default active campus license for school
  const existingLicense = await query('SELECT id FROM licenses WHERE school_id = ? LIMIT 1', [targetSchoolDbId])
  if (existingLicense.length === 0) {
    const licId = `lic-${targetSchoolDbId}-initial`
    const now = new Date()
    const exp = new Date(now)
    exp.setMonth(exp.getMonth() + 10)
    await run(
      `INSERT INTO licenses (
        id, school_id, license_key, plan_tier, status, billing_cycle, max_teachers,
        max_students, issued_at, expires_at, trial_ends_at, features, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        licId,
        targetSchoolDbId,
        `ELY-CAMPUS-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        'campus',
        'active',
        'annual',
        60,
        2500,
        now.toISOString().split('T')[0],
        exp.toISOString().split('T')[0],
        '',
        JSON.stringify({ sf2_export: true, sardo_radar: true, analytics: true, audit_logs: true, multi_school: false }),
        'Seeded Campus License'
      ]
    )
  }

  // 5. Sample Data Seeding
  let seededTeachersCount = 0
  let seededStudentsCount = 0
  let seededRecordsCount = 0

  if (seedSample) {
    console.log('[seeder] Seeding sample faculty, students, schedules, and attendance records...')

    // A. Sample Teachers with Advisory Classes
    const sampleTeachers = [
      { id: 'teacher-1', username: 'msantos', name: 'Maria Santos', grade: 'Grade 7', section: 'Pine' },
      { id: 'teacher-2', username: 'jdelacruz', name: 'Juan Dela Cruz', grade: 'Grade 8', section: 'Cypress' },
      { id: 'teacher-3', username: 'rmendoza', name: 'Rosa Mendoza', grade: 'Grade 9', section: 'Kamagong' },
      { id: 'teacher-4', username: 'creyes', name: 'Carlos Reyes', grade: 'Grade 10', section: 'Acacia' }
    ]

    for (const t of sampleTeachers) {
      const existing = await query('SELECT id FROM users WHERE username = ?', [t.username])
      if (existing.length > 0) {
        await run('UPDATE users SET password = ?, name = ?, role = ?, grade = ?, section = ?, school_id = ? WHERE id = ?',
          [teacherPassword, t.name, 'teacher', t.grade, t.section, targetSchoolDbId, existing[0].id])
      } else {
        await run('INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [t.id, t.username, teacherPassword, t.name, 'teacher', t.grade, t.section, '', targetSchoolDbId])
      }
      seededTeachersCount++
    }

    // B. Sample Teacher Schedules
    console.log('[seeder] Seeding teacher timetable schedules...')
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const periods = [
      { key: 'am1', start: '07:30', end: '08:20', subject: 'Mathematics' },
      { key: 'am2', start: '08:20', end: '09:10', subject: 'Science' },
      { key: 'am3', start: '09:30', end: '10:20', subject: 'English' },
      { key: 'am4', start: '10:20', end: '11:10', subject: 'Filipino' },
      { key: 'pm1', start: '12:30', end: '01:20', subject: 'Araling Panlipunan' },
      { key: 'pm2', start: '01:20', end: '02:10', subject: 'MAPEH' },
      { key: 'pm3', start: '02:20', end: '03:10', subject: 'TLE' },
      { key: 'pm4', start: '03:10', end: '04:00', subject: 'ESP' }
    ]

    for (const t of sampleTeachers) {
      const existingSched = await query('SELECT COUNT(*) AS cnt FROM teacher_schedules WHERE teacher_id = ?', [t.id])
      if ((existingSched[0]?.cnt ?? 0) === 0) {
        for (const d of days) {
          for (let pIdx = 0; pIdx < periods.length; pIdx++) {
            const p = periods[pIdx]
            await run(
              'INSERT INTO teacher_schedules (teacher_id, day_of_week, period, start_time, end_time, subject, grade, section, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [t.id, d, p.key, p.start, p.end, p.subject, t.grade, t.section, targetSchoolDbId]
            )
          }
        }
      }
    }

    // C. Sample Students
    console.log(`[seeder] Seeding student rosters (~${studentsPerSection} per section)...`)
    const allSections = []
    for (const g of DEFAULT_GRADE_LEVELS) {
      for (const s of g.sections) {
        allSections.push({ grade: g.grade, section: s })
      }
    }

    const createdStudentMap = new Map() // key: grade-section, val: array of student objects

    for (const sec of allSections) {
      const key = `${sec.grade}-${sec.section}`
      createdStudentMap.set(key, [])

      const existingStudents = await query(
        'SELECT id, name, gender, grade, section FROM students WHERE school_id = ? AND grade = ? AND section = ?',
        [targetSchoolDbId, sec.grade, sec.section]
      )

      if (existingStudents.length >= 8) {
        createdStudentMap.set(key, existingStudents)
        seededStudentsCount += existingStudents.length
        continue
      }

      for (let i = 0; i < studentsPerSection; i++) {
        const isMale = i % 2 === 0
        const lastName = LAST_NAMES[(i + (sec.grade.length * 3)) % LAST_NAMES.length]
        const firstName = isMale ? MALE_NAMES[i % MALE_NAMES.length] : FEMALE_NAMES[i % FEMALE_NAMES.length]
        const mi = MIDDLE_INITIALS[(i * 3) % MIDDLE_INITIALS.length]
        const fullName = `${lastName}, ${firstName} ${mi}`
        const gender = isMale ? 'Male' : 'Female'
        const stId = `st-${uuidv4().slice(0, 12)}`

        await run(
          'INSERT INTO students (id, name, grade, section, gender, school_id) VALUES (?, ?, ?, ?, ?, ?)',
          [stId, fullName, sec.grade, sec.section, gender, targetSchoolDbId]
        )

        createdStudentMap.get(key).push({ id: stId, name: fullName, gender, grade: sec.grade, section: sec.section })
        seededStudentsCount++
      }
    }

    // D. Sample Daily Attendance Records (Past 5 school days)
    console.log('[seeder] Seeding recent daily attendance sheets with period marks...')
    const today = new Date()
    const sampleDates = []
    let daysBack = 0
    while (sampleDates.length < 5) {
      const d = new Date(today)
      d.setDate(today.getDate() - daysBack)
      daysBack++
      const dayOfWeek = d.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Monday-Friday
        sampleDates.push(formatDate(d))
      }
    }

    for (const t of sampleTeachers) {
      const key = `${t.grade}-${t.section}`
      const sectionStudents = createdStudentMap.get(key) || []
      if (sectionStudents.length === 0) continue

      for (const attDate of sampleDates) {
        const recordId = `rec-${targetSchoolDbId}-${t.grade.replace(/\s+/g, '')}-${t.section}-${attDate}`
        const existingRecord = await query('SELECT id FROM attendance_records WHERE id = ?', [recordId])

        if (existingRecord.length === 0) {
          await run(
            'INSERT INTO attendance_records (id, date, grade, section, adviser, created_by, created_by_name, summary_data, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [recordId, attDate, t.grade, t.section, t.name, t.id, t.name, JSON.stringify({ verified: true }), targetSchoolDbId]
          )
          seededRecordsCount++

          // Attendance Entries per student
          for (const st of sectionStudents) {
            // Mostly Present (E), occasional Tardy (T) or Absent (A)
            const seedRand = Math.random()
            let status = 'E'
            let reason = ''
            let excused = 0
            let unexcused = 0

            if (seedRand > 0.94) {
              status = 'A'
              reason = randomChoice(['Fever', 'Flu symptoms', 'Family emergency', 'Dental appointment', 'Severe headache'])
              excused = 1
            } else if (seedRand > 0.88) {
              status = 'T'
            }

            const pVal = (p) => (status === 'A' ? 'A' : (status === 'T' && p === 'am1') ? 'T' : 'E')

            await run(
              `INSERT INTO attendance_entries (
                record_id, student_id, name,
                am1, am2, am3, am4, am5, am6,
                pm1, pm2, pm3, pm4,
                reason, excused, unexcused, nls
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                recordId, st.id, st.name,
                pVal('am1'), pVal('am2'), pVal('am3'), pVal('am4'), pVal('am5'), pVal('am6'),
                pVal('pm1'), pVal('pm2'), pVal('pm3'), pVal('pm4'),
                reason, excused, unexcused, 0
              ]
            )
          }
        }
      }

      // E. Sample Monthly SF2 Record
      const currentMonth = today.getMonth() + 1
      const currentYear = today.getFullYear()
      const monthlyId = `mon-${targetSchoolDbId}-${t.grade.replace(/\s+/g, '')}-${t.section}-${currentYear}-${currentMonth}`
      const existingMonthly = await query('SELECT id FROM monthly_records WHERE id = ?', [monthlyId])

      if (existingMonthly.length === 0) {
        const daysObj = {}
        // Mark school days up to today
        for (let d = 1; d <= 20; d++) {
          daysObj[d] = Math.random() > 0.06 ? ' ' : (Math.random() > 0.5 ? 'x' : '◤')
        }

        const summaryData = {
          enr_m: Math.floor(sectionStudents.length / 2),
          enr_f: Math.ceil(sectionStudents.length / 2),
          enr_t: sectionStudents.length,
          ada_m: (sectionStudents.length / 2 * 0.96).toFixed(1),
          ada_f: (sectionStudents.length / 2 * 0.97).toFixed(1),
          ada_t: (sectionStudents.length * 0.965).toFixed(1),
          pct_m: 96.0,
          pct_f: 97.0,
          pct_t: 96.5,
          abs5_m: 0,
          abs5_f: 0,
          abs5_t: 0,
          nls_m: 0,
          nls_f: 0,
          nls_t: 0
        }

        await run(
          `INSERT INTO monthly_records (
            id, month, year, grade, section, adviser, school_head, created_by, created_by_name, school_id, summary_data, excluded_dates
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            monthlyId, currentMonth, currentYear, t.grade, t.section, t.name,
            'Dr. Roberto M. Tan, Principal IV', t.id, t.name, targetSchoolDbId,
            JSON.stringify(summaryData), JSON.stringify([])
          ]
        )

        for (const st of sectionStudents) {
          const absentCount = Math.floor(Math.random() * 2)
          const tardyCount = Math.floor(Math.random() * 2)
          const presentCount = 20 - absentCount
          await run(
            `INSERT INTO monthly_entries (
              record_id, student_id, student_name, days, present, absent, tardy, remarks, late_enrollee
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [monthlyId, st.id, st.name, JSON.stringify(daysObj), presentCount, absentCount, tardyCount, '', 0]
          )
        }
      }
    }

    // F. School Calendar Events
    console.log('[seeder] Seeding calendar and quarterly events...')
    const sampleEvents = [
      { title: 'First Day of Classes', type: 'co-curricular', event_date: `${today.getFullYear()}-08-15`, color: '#10b981' },
      { title: 'National Heroes Day', type: 'holiday', event_date: `${today.getFullYear()}-08-25`, color: '#ef4444' },
      { title: 'Buwan ng Wika Celebration', type: 'co-curricular', event_date: `${today.getFullYear()}-08-29`, color: '#10b981' },
      { title: '1st Quarter Examinations', type: 'quarterly-exam', event_date: `${today.getFullYear()}-10-16`, color: '#8b5cf6' },
      { title: 'Mid-Year Inset (Teachers)', type: 'inset', event_date: `${today.getFullYear()}-10-23`, color: '#f59e0b' },
      { title: 'Bonifacio Day', type: 'holiday', event_date: `${today.getFullYear()}-11-30`, color: '#ef4444' },
      { title: 'Rizal Day', type: 'holiday', event_date: `${today.getFullYear()}-12-30`, color: '#ef4444' }
    ]

    for (const ev of sampleEvents) {
      const existing = await query('SELECT id FROM calendar_events WHERE school_id = ? AND title = ?', [targetSchoolDbId, ev.title])
      if (existing.length === 0) {
        await run(
          'INSERT INTO calendar_events (title, type, event_date, color, created_by, school_id) VALUES (?, ?, ?, ?, ?, ?)',
          [ev.title, ev.type, ev.event_date, ev.color, adminId, targetSchoolDbId]
        )
      }
    }

    // G. Quarterly Exam Schedule
    const quarterlyEvents = [
      { event_name: 'Quarterly Examinations', first_grading: 'Oct 16-17', second_grading: 'Dec 18-19', third_grading: 'Feb 19-20', fourth_grading: 'Apr 23-24' },
      { event_name: 'Classroom Based Assessment', first_grading: 'Sep 25-26', second_grading: 'Nov 27-28', third_grading: 'Jan 29-30', fourth_grading: 'Mar 26-27' },
      { event_name: 'Distribution of Report Cards', first_grading: 'Oct 28', second_grading: 'Jan 06', third_grading: 'Mar 02', fourth_grading: 'May 04' }
    ]

    for (const qe of quarterlyEvents) {
      const existing = await query('SELECT id FROM quarterly_events WHERE school_id = ? AND event_name = ?', [targetSchoolDbId, qe.event_name])
      if (existing.length === 0) {
        await run(
          'INSERT INTO quarterly_events (event_name, first_grading, second_grading, third_grading, fourth_grading, school_id) VALUES (?, ?, ?, ?, ?, ?)',
          [qe.event_name, qe.first_grading, qe.second_grading, qe.third_grading, qe.fourth_grading, targetSchoolDbId]
        )
      }
    }
  }

  saveDatabase()

  console.log('\n======================================================================')
  console.log('✓ ElyTrack Database Seeding Complete!')
  console.log('======================================================================')
  console.log(`Backend:      ${DB_MODE.toUpperCase()}`)
  console.log(`School:       ${schoolName} (${schoolShort}) · ID: ${schoolId}`)
  console.log(`Address:      ${schoolAddress}`)
  console.log('----------------------------------------------------------------------')
  console.log('Superadmin Login:')
  console.log(`  Username:   ${adminUsername}`)
  console.log(`  Password:   ${adminPassword}`)
  console.log(`  Name:       ${adminName}`)
  if (seedSample) {
    console.log('----------------------------------------------------------------------')
    console.log('Sample Teacher Logins (password: "' + teacherPassword + '"):')
    console.log('  • msantos    - Maria Santos   (Grade 7 - Pine)')
    console.log('  • jdelacruz  - Juan Dela Cruz (Grade 8 - Cypress)')
    console.log('  • rmendoza   - Rosa Mendoza   (Grade 9 - Kamagong)')
    console.log('  • creyes     - Carlos Reyes   (Grade 10 - Acacia)')
    console.log('----------------------------------------------------------------------')
    console.log(`Total Faculty Seeded:    ${seededTeachersCount}`)
    console.log(`Total Students Seeded:   ${seededStudentsCount}`)
    console.log(`Total Attendance Sheets: ${seededRecordsCount}`)
  }
  console.log('======================================================================\n')
}

main().catch(err => {
  console.error('\n[seeder] Seeding failed:', err)
  process.exit(1)
})
