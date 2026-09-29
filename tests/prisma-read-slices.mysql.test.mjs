import test from 'node:test'
import assert from 'node:assert/strict'

// This suite is intentionally opt-in. It must use a disposable MySQL database
// whose name clearly identifies it as a test/integration database; production
// databases are rejected before Prisma is imported.
const integrationUrl = String(process.env.PRISMA_TEST_DATABASE_URL || '').trim()
const enabled = process.env.PRISMA_MYSQL_INTEGRATION === '1' && process.env.NODE_ENV !== 'production' && /(?:^|\/)(?:[\w-]*(?:test|testing|integration|sandbox|ci)[\w-]*)$/i.test(integrationUrl.split('?')[0].split('/').pop() || '')

function skipReason() {
  return 'Set PRISMA_MYSQL_INTEGRATION=1 and PRISMA_TEST_DATABASE_URL to an isolated test MySQL database'
}

test('Prisma school read slices preserve school and grade-level data', { skip: !enabled ? skipReason() : false }, async () => {
  // Set these before loading the application modules because Prisma resolves its
  // datasource once at module initialization. No application env is changed
  // unless this explicitly opt-in test is run.
  process.env.DB_CONNECTION = 'mysql'
  process.env.DATABASE_URL = integrationUrl
  process.env.REQUIRE_MYSQL = '1'

  const { default: prisma } = await import('../prisma/client.js')
  const { listSchoolsWithPrisma, findSchoolWithPrisma, listGradeLevelsWithPrisma } = await import('../routes/schools.js')
  assert.ok(prisma, 'Prisma client must be available for MySQL integration tests')

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const activeId = `prisma-read-active-${suffix}`
  const archivedId = `prisma-read-archived-${suffix}`

  try {
    await prisma.school.createMany({
      data: [
        { id: activeId, name: `Prisma Active ${suffix}`, schoolId: `TEST-${suffix}`, address: 'Test address', short: 'PRA' },
        { id: archivedId, name: `Prisma Archived ${suffix}`, schoolId: `TEST-A-${suffix}`, address: 'Test address', short: 'PRA', archivedAt: new Date() }
      ]
    })
    await prisma.gradeLevel.createMany({
      data: [
        { id: `prisma-grade-2-${suffix}`, schoolId: activeId, grade: 'Grade 2', sections: JSON.stringify(['B', 'A']), sort: 2 },
        { id: `prisma-grade-1-${suffix}`, schoolId: activeId, grade: 'Grade 1', sections: JSON.stringify(['A']), sort: 1 }
      ]
    })

    const activeSchools = await listSchoolsWithPrisma(false)
    assert.ok(activeSchools?.some(school => school.id === activeId))
    assert.ok(!activeSchools?.some(school => school.id === archivedId))

    const allSchools = await listSchoolsWithPrisma(true)
    assert.ok(allSchools?.some(school => school.id === archivedId && school.archived_at))

    const found = await findSchoolWithPrisma(activeId)
    assert.equal(found?.available, true)
    assert.equal(found?.row.school_id, `TEST-${suffix}`)

    const levels = await listGradeLevelsWithPrisma(activeId)
    assert.deepEqual(levels, [
      { grade: 'Grade 1', sections: ['A'] },
      { grade: 'Grade 2', sections: ['B', 'A'] }
    ])
  } finally {
    await prisma.gradeLevel.deleteMany({ where: { schoolId: { in: [activeId, archivedId] } } })
    await prisma.school.deleteMany({ where: { id: { in: [activeId, archivedId] } } })
    await prisma.$disconnect()
  }
})
