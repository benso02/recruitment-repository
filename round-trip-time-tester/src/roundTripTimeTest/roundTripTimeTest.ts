import * as fs from 'fs';
import { OUTPUT_FILE, OUTPUT_PATH } from '../constants';
import {
  StorageAdapter,
  MeterData,
  TestParameters,
  TestResults,
  LogEvent,
  DeviceState,
  RoundTripTestResponse,
} from '@src/types';
import { formatResponseTimeResults } from '../util';
import { DeviceMessageAdapter } from '@src/deviceMessage/adapter';
import { turnOnDevicesAndVerifyResponse } from '@src/controlDevice/controlDevice';

export const startRttTest = async (
  storage: StorageAdapter,
  messageAdapter: DeviceMessageAdapter,
  parameters: TestParameters
): Promise<RoundTripTestResponse> => {
  const startTestTime = Date.now();

  const { deviceIds, boostTimeSeconds, iterations } = parameters;

  const devices = await storage.deviceState.findMany(deviceIds ? { id: { $in: deviceIds } } : {});

  const testResults = await Promise.all(
    devices.map(async (device: DeviceState) => {
      const results: TestResults[] = [];

      for (let i = 0; i < iterations; i++) {
        console.log(`Iteration ${i + 1}...`);
      
        const result = await turnOnDevicesAndVerifyResponse(storage,
          messageAdapter,
          device.id,
          boostTimeSeconds,
          parameters.modeOn
        );

        if (!result) {
          throw new Error(`The device: ${device.id} is already on, so RTT results cannot be verified`);
        }

        const { messageSentAt, meterDataFromFirstMeasurement, meterDataFromLastMeasurement } = result;

        console.log(`Command Sent Timestamp: ${messageSentAt}`);

        console.log(
          `Meter - Delta: ${meterDataFromFirstMeasurement.deltaMeter}, Timestamp: ${meterDataFromFirstMeasurement.meterTimestamp}, Power: ${meterDataFromFirstMeasurement.power}`
        );
        const meterResults: MeterData = {
          meterTimestamp: meterDataFromFirstMeasurement.meterTimestamp,
          deltaMeter: meterDataFromFirstMeasurement.deltaMeter,
          power: meterDataFromLastMeasurement.power,
        };

        results.push(meterResults);
      }

      const totalTestTime = Date.now() - startTestTime;

      const meterTimeResults = formatResponseTimeResults(results.map(result => result.deltaMeter));

      console.log(`Relay Time Results: ${meterTimeResults}`);

      const averagePower = results.reduce((sum, { power }) => sum + power, 0) / results.length;

      const minPower = Math.min(...results.map(result => result.power));
      const maxPower = Math.max(...results.map(result => result.power));

      console.log(`Minimum Power (W): ${minPower}`);

      console.log(`Maximum Power (W): ${maxPower}`);

      console.log(`Average Power (W): ${averagePower}`);

      const measurementFactor = device.measurement_factor ?? 1;

      const newBoostCapacity = averagePower * measurementFactor;


      if (newBoostCapacity !== device.boost_capacity) {
        await storage.eventLog.create({
          device_id: device.id,
          event_status: 'roundTripTimeTestCapacity',
          capacity: newBoostCapacity,
          meta_data: `Due to RTT test results`,
        });
      }

      const deviceResults = {
        startTime: startTestTime,
        id: device.id,
        deltas: { meter: meterTimeResults },
        boostCapacity: newBoostCapacity,
        data: results,
        totalTestTime: totalTestTime,
      };

      return deviceResults;
    })
  );

  const results = JSON.stringify(testResults, null, 4);

  const roundTripTestEndEventLog: Omit<LogEvent, 'timestamp'> = {
    device_id: parameters.deviceId,
    event_status: 'roundTripTestFinished',
    meta_data: results,
  };

  storage.eventLog.create(roundTripTestEndEventLog);

  fs.mkdirSync(OUTPUT_PATH, { recursive: true });
  fs.appendFileSync(OUTPUT_FILE, results);

  return testResults;
};
