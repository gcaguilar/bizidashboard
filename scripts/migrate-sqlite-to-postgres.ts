import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const { Pool } = pg

interface MigrationResult {
  station: number
  stationStatus: number
  hourlyStationStat: number
  dailyStationStat: number
  stationRanking: number
  stationPattern: number
  stationHeatmapCell: number
  stationAlert: number
  analyticsWatermark: number
  mobilityBriefingCache: number
  jobLock: number
  install: number
}

async function migrateTable(
  sqlitePrisma: PrismaClient,
  pgPrisma: PrismaClient,
  tableName: string
): Promise<number> {
  console.log(`Migrating ${tableName}...`)
  
  const data = await sqlitePrisma.$queryRaw<Record<string, unknown>[]>`SELECT * FROM ${tableName}`
  
  if (data.length === 0) {
    console.log(`  No data to migrate`)
    return 0
  }

  console.log(`  Found ${data.length} rows`)

  // Insert in batches
  const batchSize = 100
  let inserted = 0
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    
    if (batch.length === 0) continue
    
    const columns = Object.keys(batch[0])
    const values = batch.map(row => {
      return columns.map(col => {
        const val = row[col]
        if (val === null) return 'NULL'
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`
        if (typeof val === 'boolean') return val ? 'true' : 'false'
        if (val instanceof Date) return `'${val.toISOString()}'`
        return String(val)
      }).join(', ')
    }).map(v => `(${v})`).join(',\n')
    
    const insertSql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${values} ON CONFLICT DO NOTHING`
    
    try {
      await pgPrisma.$executeRaw(insertSql as any)
      inserted += batch.length
    } catch (error) {
      console.error(`  Error inserting batch:`, error)
    }
  }
  
  console.log(`  Inserted ${inserted} rows`)
  return inserted
}

async function main() {
  const sqliteUrl = process.env.SQLITE_URL || 'file:./dev.db'
  const pgUrl = process.env.DATABASE_URL
  
  if (!pgUrl) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }

  console.log('=== SQLite to PostgreSQL Migration ===')
  console.log(`SQLite: ${sqliteUrl}`)
  console.log(`PostgreSQL: ${pgUrl}`)
  console.log('')

  // Connect to SQLite
  const sqliteAdapter = new PrismaLibSql({ url: sqliteUrl })
  const sqlitePrisma = new PrismaClient({ adapter: sqliteAdapter })

  // Connect to PostgreSQL  
  const pgAdapter = new PrismaPg({ connectionString: pgUrl })
  const pgPrisma = new PrismaClient({ adapter: pgAdapter })

  const result: MigrationResult = {
    station: 0,
    stationStatus: 0,
    hourlyStationStat: 0,
    dailyStationStat: 0,
    stationRanking: 0,
    stationPattern: 0,
    stationHeatmapCell: 0,
    stationAlert: 0,
    analyticsWatermark: 0,
    mobilityBriefingCache: 0,
    jobLock: 0,
    install: 0,
  }

  try {
    // Migrate tables in order (dependencies first)
    result.station = await migrateTable(sqlitePrisma, pgPrisma, 'Station')
    result.stationStatus = await migrateTable(sqlitePrisma, pgPrisma, 'StationStatus')
    result.hourlyStationStat = await migrateTable(sqlitePrisma, pgPrisma, 'HourlyStationStat')
    result.dailyStationStat = await migrateTable(sqlitePrisma, pgPrisma, 'DailyStationStat')
    result.stationRanking = await migrateTable(sqlitePrisma, pgPrisma, 'StationRanking')
    result.stationPattern = await migrateTable(sqlitePrisma, pgPrisma, 'StationPattern')
    result.stationHeatmapCell = await migrateTable(sqlitePrisma, pgPrisma, 'StationHeatmapCell')
    result.stationAlert = await migrateTable(sqlitePrisma, pgPrisma, 'StationAlert')
    result.analyticsWatermark = await migrateTable(sqlitePrisma, pgPrisma, 'AnalyticsWatermark')
    result.mobilityBriefingCache = await migrateTable(sqlitePrisma, pgPrisma, 'MobilityBriefingCache')
    result.jobLock = await migrateTable(sqlitePrisma, pgPrisma, 'JobLock')
    result.install = await migrateTable(sqlitePrisma, pgPrisma, 'Install')

    console.log('')
    console.log('=== Migration Complete ===')
    console.log('Results:')
    console.log(`  Station: ${result.station}`)
    console.log(`  StationStatus: ${result.stationStatus}`)
    console.log(`  HourlyStationStat: ${result.hourlyStationStat}`)
    console.log(`  DailyStationStat: ${result.dailyStationStat}`)
    console.log(`  StationRanking: ${result.stationRanking}`)
    console.log(`  StationPattern: ${result.stationPattern}`)
    console.log(`  StationHeatmapCell: ${result.stationHeatmapCell}`)
    console.log(`  StationAlert: ${result.stationAlert}`)
    console.log(`  AnalyticsWatermark: ${result.analyticsWatermark}`)
    console.log(`  MobilityBriefingCache: ${result.mobilityBriefingCache}`)
    console.log(`  JobLock: ${result.jobLock}`)
    console.log(`  Install: ${result.install}`)

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await sqlitePrisma.$disconnect()
    await pgPrisma.$disconnect()
  }
}

main()
