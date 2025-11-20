export type MeterData = {
  meterTimestamp: number;
  power: number;
  deltaMeter: number;
};

export type TestResults = MeterData;

export type TestParameters = {
  iterations: number;
  boostTimeSeconds: number;
  deviceIds?: string[];
  deviceId?: string;
  isBatchTest?: boolean;
  
};

export type RoundTripTestResponse = {
  startTime: number;
  id: string;
  deltas: {
    meter: {
      min: number;
      max: number;
      average: number;
    };
  };
  boostCapacity: number;
  data: MeterData[];
  totalTestTime: number;
}[];
