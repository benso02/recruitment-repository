import { Context, LogEvent, Router, TestParameters } from '@src/types';
import { addProtectedRoute } from './route';

import { DEFAULT_BOOST_TIME_S, DEFAULT_ITERATIONS } from '@src/constants';
import { startRttTest } from '@src/roundTripTimeTest';
import { writeContextError, writeContextResponse } from '@src/util';

export const addRunRttTestRoute = (router: Router) => {
  addProtectedRoute(router, 'post', '/runRttTest', runRttTest);
};

const runRttTest = async (ctx: Context) => {
  try {
    const { storageAdapter, messageAdapter } = ctx.adapters;

    const parameters = validateBody(ctx.request.body as Partial<TestParameters>);

    console.log(`Received request for round trip time test. Parameters: ${JSON.stringify(parameters, null, 4)}`);

    const roundTripTestStartEventLog: Omit<LogEvent, 'timestamp'> = {
      device_id: parameters.deviceId,
      event_status: 'roundTripTestStarted',
    };

    ctx.adapters.storageAdapter.eventLog.create(roundTripTestStartEventLog);

    const result = await startRttTest(storageAdapter, messageAdapter, parameters);

    return writeContextResponse(ctx, 200, result);
  } catch (error) {
    if (error instanceof Error) {
      return writeContextError(ctx, 500, error.message);
    }
    return writeContextError(ctx, 500, 'Unknown error in RTT Service.');
  }
};

const validateBody = (parameters: Partial<TestParameters>): TestParameters => {
  const { deviceId, isBatchTest, iterations, boostTimeSeconds, modeOn } = parameters;

  if (!deviceId && !isBatchTest) {
    throw new Error(`Missing required either field 'deviceId' or 'isBatchTest'`);
  }

  if (deviceId && isBatchTest) {
    throw new Error(`Only accepts field 'deviceId' or 'isBatchTest'`);
  }

  const parametersWithDefaults = {
    iterations: iterations ?? DEFAULT_ITERATIONS,
    boostTimeSeconds: boostTimeSeconds ?? DEFAULT_BOOST_TIME_S,
    deviceId,
    isBatchTest,
    modeOn: modeOn ?? true,
  };

  return parametersWithDefaults;
};
