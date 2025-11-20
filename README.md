# Notes during the process of doing the project
I started by taking a good time to make it run locally, as there were a lot of dependecies and devices I did not have access to. I created a stub of @beam/storage and created a tsconfig.json, .env and a package.json file. After doing these things I was able to run it locally using "npm run start", but got these 2 lines repeating in the terminal: 
Client beam_tester_mqtt_1863d6cf02e18 error AggregateError (broker: mqtt://localhost:1883)
Client beam_tester_mqtt_1863d6cf02e18 is now offline (broker: mqtt://localhost:1883).
I created the first draft of turnOffDevicesAndVerifyResponse, forked the turnOnDevicesAndVerifyResponse function and changes names and made it publish off instead. 



# Description

We have a function startRttTest in roundTripTimeTest to test how fast devices can turn on, using the method turnOnDevicesAndVerifyResponse. 
We need a way to test how fast devices can turn off, similarly to turnOnDevicesAndVerifyResponse, but publishing 'off' instead of 'on' using the message adapter, as seen in controlDevice/controlDevice.ts line 33. 
An extra parameter needs to be sent to the rest endpoint '/runRttTest' to indicate if it should run the turnOnDevicesAndVerifyResponse or it should run the method to turn off the device during the exectuin of the startRttTest function.  

## Rest of README for - Round Trip Time Tester

Responsible for testing devices to ensure they are responsive in a timely manner, and is also used to measure their potential capacity in case of an activation.


### Structure

#### Control Device

Contains utility function for activating devices in a manner specific to the round trip time tester, using the device message adapter.

#### Adapters

The round trip time tester uses an adapter structure to expose domain logic to the rest of the code (e.g. deviceMessage).

#### Responsiveness Check

Contains the code required to run the responsiveness check.

#### Test

Changes in required code should trigger a test.

#### Rest

Contains the code related to the REST functionality, including routing.

The round trip time tester is the only service in the cluster that is exposed to the outside, this is because we need some way to trigger the RTT test and to verify the functionality of devices ad hoc through the admin panel, these external routes are only accessible by the BEAM API.

#### Round Trip Time Test

Contains the code required to run the round trip time test.

#### Server

Contains the code required to start and run the server.

#### Test Device

Contains the code required to run the hardware tests on a device (requires specific testing hardware).

### Running locally

The easiest way to run the round trip time tester is to run it in docker alongside the database and brokers using `np run stack:start:cluster` in `devops` (see [Devops readme](../devops/readme.md)).

---

Ensure that there is a .env file available in the project. If there isn't, create one and copy the content of .env.dev into it.

Lastly ensure the latest dependencies are installed locally with `npm i`.

Run the project with `npm run start`. (OBS, highly recommended to run this project via devops alongside its dependencies)
