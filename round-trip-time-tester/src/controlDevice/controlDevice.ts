import { DeviceState, StorageAdapter } from '@beam/storage';
import { DeviceMessageAdapter } from '@src/deviceMessage/adapter';
import { retrieveFirstMeasurementAfterCommand } from './retrieveFirstMeasurementAfterCommand';
import { retrieveLastMeasurementDuringActivation } from './retrieveLastMeasurementDuringActivation';
import { retrieveLastMeasurementBeforeActivation } from './retrieveLastMeasurementBeforeActivation';
import { sleep, toMilliseconds } from '@src/util';

export const RESPONSE_THRESHOLD_IN_WATTS = 500;
export const RESPONSE_BOTTOM_IN_WATTS = 50;

export const turnOnDevicesAndVerifyResponse = async (
  storage: StorageAdapter,
  messageAdapter: DeviceMessageAdapter,
  deviceId: string,
  boostTimeSeconds: number,
  modeOn: boolean
) => {
  const { meter_id, relay_id, measurement_factor = 1 } = await storage.deviceState.findOne({id: deviceId});

  const isSingleDevice = relay_id === meter_id;

  const meterDataBeforeActivation = await retrieveLastMeasurementBeforeActivation(storage, Date.now(), meter_id);

  if (!meterDataBeforeActivation) {
    throw new Error('Test Error! Power data waiting time crossed the limit.');
  }

  const powerBefore= meterDataBeforeActivation.power * measurement_factor;
  let mode : string;
  
  if (modeOn) {
    mode = "on";
    if (powerBefore > RESPONSE_THRESHOLD_IN_WATTS) return;
  }
  else if (!modeOn) {
    mode = "off";
    if( powerBefore < RESPONSE_BOTTOM_IN_WATTS) return;
  }
  console.log(`Sending command to turn ${mode} the device ${deviceId}`);

  const messageSentAt = messageAdapter
    .publishDeviceMessage(storage, deviceId, mode, boostTimeSeconds, isSingleDevice)
    .messageSentAt.getTime();

  const meterDataFromFirstMeasurement = await retrieveFirstMeasurementAfterCommand(storage, messageSentAt, meter_id);

  await sleep(toMilliseconds(boostTimeSeconds + 1, 'seconds'));

  const meterDataFromLastMeasurement = await retrieveLastMeasurementDuringActivation(
    storage,
    messageSentAt,
    boostTimeSeconds * 1000,
    meter_id
  );

  if (!meterDataFromLastMeasurement || !meterDataFromFirstMeasurement) {
    throw new Error('Test Error! Power data waiting time crossed the limit.');
  }

  return { meterDataFromFirstMeasurement, meterDataFromLastMeasurement, messageSentAt };
};

export const turnOffDevicesAndVerifyResponse = async (
  storage: StorageAdapter,
  messageAdapter: DeviceMessageAdapter,
  deviceId: string,
  boostTimeSeconds: number
) => {
  // get device info
  const { meter_id, relay_id, measurement_factor = 1 } = await storage.deviceState.findOne({id: deviceId});

  const isSingleDevice = relay_id === meter_id;

  /*  get power before off, i use the same function as for activation, as you check power before command, 
      it is not dependent on if it is off or on, throw error if not found */
  const meterDataBeforeOff = await retrieveLastMeasurementBeforeActivation(storage, Date.now(), meter_id);
  if (!meterDataBeforeOff) {
    throw new Error('Test Error! Power data waiting time crossed the limit.');
  }

  /*  calculate power before off with measurement factor, 
      if power before off is less than bottom threshold, skip the test. Probably device is already off. */
  const powerBeforeOff = meterDataBeforeOff.power * measurement_factor;
  if (powerBeforeOff < RESPONSE_BOTTOM_IN_WATTS) {
    return;
  }

  // send off command
  const messageSentAt = messageAdapter
  .publishDeviceMessage(storage, deviceId, 'off', boostTimeSeconds, isSingleDevice)
  .messageSentAt.getTime();

  // get first measurement after command sent, throw error if not found
  const meterDataFromFirstMeasurement = await retrieveFirstMeasurementAfterCommand(storage, messageSentAt, meter_id);
  if (!meterDataFromFirstMeasurement) {
    throw new Error('Test Error! Power data waiting time crossed the limit.');
  }

  await sleep(toMilliseconds(boostTimeSeconds + 1, 'seconds'));

  const meterDataFromLastMeasurement = await retrieveLastMeasurementDuringActivation(
    storage,
    messageSentAt,
    boostTimeSeconds * 1000,
    meter_id
  );

  if (!meterDataFromLastMeasurement || !meterDataFromFirstMeasurement) {
    throw new Error('Test Error! Power data waiting time crossed the limit.');
  }
  return {meterDataFromFirstMeasurement, meterDataFromLastMeasurement,messageSentAt};
};