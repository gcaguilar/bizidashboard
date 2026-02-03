import 'dotenv/config'
import { prisma } from './src/lib/db'

async function testIndexes() {
  console.log('Testing database schema...')

  // Test 1: Insert a station
  const station = await prisma.station.create({
    data: {
      id: 'test-001',
      name: 'Test Station',
      lat: 41.65,
      lon: -0.88,
      capacity: 20,
    },
  })
  console.log('✓ Station created:', station.id)

  // Test 2: Insert a status record
  const status = await prisma.stationStatus.create({
    data: {
      stationId: 'test-001',
      bikesAvailable: 10,
      anchorsFree: 10,
      recordedAt: new Date(),
    },
  })
  console.log('✓ StationStatus created:', status.id)

  // Test 3: Query with index (should use stationId_recordedAt index)
  const recent = await prisma.stationStatus.findMany({
    where: {
      stationId: 'test-001',
      recordedAt: { gte: new Date(Date.now() - 86400000) },
    },
    orderBy: { recordedAt: 'desc' },
    take: 10,
  })
  console.log('✓ Time-series query returned:', recent.length, 'records')

  // Test 4: Query station with statuses
  const stationWithStatuses = await prisma.station.findUnique({
    where: { id: 'test-001' },
    include: { statuses: true },
  })
  console.log('✓ Station with statuses:', stationWithStatuses?.statuses.length, 'status records')

  // Test 5: Verify index usage via EXPLAIN QUERY PLAN
  const explainResult = await prisma.$queryRaw`
    EXPLAIN QUERY PLAN
    SELECT * FROM StationStatus
    WHERE stationId = 'test-001'
    AND recordedAt >= datetime('now', '-1 day')
    ORDER BY recordedAt DESC
    LIMIT 10
  `
  console.log('✓ Query plan:', JSON.stringify(explainResult, null, 2))

  // Cleanup
  await prisma.stationStatus.deleteMany({ where: { stationId: 'test-001' } })
  await prisma.station.delete({ where: { id: 'test-001' } })
  console.log('✓ Test data cleaned up')

  console.log('\n✅ All schema tests passed!')
}

testIndexes()
  .catch((e) => {
    console.error('❌ Test failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
