export type Station = {
  id: string
  name: string
  lat: number
  lon: number
  capacity: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  statuses?: StationStatus[]
}

export type StationStatus = {
  id: number
  stationId: string
  bikesAvailable: number
  anchorsFree: number
  recordedAt: Date
  createdAt: Date
  station?: Station
}
