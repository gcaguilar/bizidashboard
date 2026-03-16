import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaPg } from '@prisma/adapter-pg'

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
  tableName: keyof MigrationResult
): Promise<number> {
  console.log(`Migrating ${tableName}...`)
  
  try {
    // Get all data from SQLite using Prisma
    const data = await (sqlitePrisma as any)[tableName].findMany()
    
    if (!data || data.length === 0) {
      console.log(`  No data to migrate`)
      return 0
    }

    console.log(`  Found ${data.length} rows`)

    // Insert in batches using Prisma
    const batchSize = 50
    let inserted = 0
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      
      if (batch.length === 0) continue
      
      try {
        // Use createMany for better performance
        await (pgPrisma as any)[tableName].createMany({
          data: batch,
          skipDuplicates: true
        })
        inserted += batch.length
        console.log(`  Inserted ${inserted}/${data.length} rows`)
      } catch (error) {
        console.error(`  Error inserting batch:`, error)
        // Try inserting one by one
        for (const row of batch) {
          try {
            await (pgPrisma as any)[tableName].create({
              data: row
            })
            inserted++
          } catch (innerError) {
            // Skip duplicate or invalid rows
          }
        }
      }
    }
    
    console.log(`  Inserted ${inserted} rows`)
    return inserted
  } catch (error) {
    console.error(`  Error migrating ${tableName}:`, error)
    return 0
  }
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
    result.station = await migrateTable(sqlitePrisma, pgPrisma, 'station')
    result.stationStatus = await migrateTable(sqlitePrisma, pgPrisma, 'stationStatus')
    result.hourlyStationStat = await migrateTable(sqlitePrisma, pgPrisma, 'hourlyStationStat')
    result.dailyStationStat = await migrateTable(sqlitePrisma, pgPrisma, 'dailyStationStat')
    result.stationRanking = await migrateTable(sqlitePrisma, pgPrisma, 'stationRanking')
    result.stationPattern = await migrateTable(sqlitePrisma, pgPrisma, 'stationPattern')
    result.stationHeatmapCell = await migrateTable(sqlitePrisma, pgPrisma, 'stationHeatmapCell')
    result.stationAlert = await migrateTable(sqlitePrisma, pgPrisma, 'stationAlert')
    result.analyticsWatermark = await migrateTable(sqlitePrisma, pgPrisma, 'analyticsWatermark')
    result.mobilityBriefingCache = await migrateTable(sqlitePrisma, pgPrisma, 'mobilityBriefingCache')
    result.jobLock = await migrateTable(sqlitePrisma, pgPrisma, 'jobLock')
    result.install = await migrateTable(sqlitePrisma, pgPrisma, 'install')

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

    const total = Object.values(result).reduce((sum, count) => sum + count, 0)
    console.log('')
    console.log(`Total migrated: ${total} rows`)

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await sqlitePrisma.$disconnect()
    await pgPrisma.$disconnect()
  }
}

main()
