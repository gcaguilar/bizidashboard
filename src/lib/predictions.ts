export type PredictionHorizonMinutes = 30 | 60;

export type StationPredictionPoint = {
  horizonMinutes: PredictionHorizonMinutes;
  predictedBikesAvailable: number | null;
  predictedAnchorsFree: number | null;
  confidence: number | null;
};

export type StationPredictionsResponse = {
  stationId: string;
  generatedAt: string;
  modelVersion: string | null;
  predictions: StationPredictionPoint[];
};

export function getEmptyStationPredictions(stationId: string): StationPredictionsResponse {
  return {
    stationId,
    generatedAt: new Date().toISOString(),
    modelVersion: null,
    predictions: [
      {
        horizonMinutes: 30,
        predictedBikesAvailable: null,
        predictedAnchorsFree: null,
        confidence: null,
      },
      {
        horizonMinutes: 60,
        predictedBikesAvailable: null,
        predictedAnchorsFree: null,
        confidence: null,
      },
    ],
  };
}
