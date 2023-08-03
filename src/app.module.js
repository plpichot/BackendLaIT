const { Module } = require('@nestjs/common');
const { UserController } = require('./controllers/usercontroller');
const { User } = require('./models/user');
const { Subject } = require('./models/subject');
const { SubjectController } = require('./controllers/subjectcontroller');
const { SubjectProperties } = require('./models/subjectproperties');
const { SubjectPropertiesController } = require('./controllers/subjectpropertiescontroller');
const { Measurement } = require('./models/measurement');
const { MeasurementController } = require('./controllers/measurementcontroller');
const { SensorType } = require('./models/sensortype');
const { SensorTypeController } = require('./controllers/sensortypecontroller');
const { Activity } = require('./models/activity');
const { ActivityController } = require('./controllers/activitycontroller');
const { DeviceType } = require('./models/devicetype');
const { DeviceTypeController } = require('./controllers/devicetypecontroller');
const { Experiment } = require('./models/experiment');
const { ExperimentController } = require('./controllers/experimentcontroller');
const { Device } = require('./models/device');
const { DeviceController } = require('./controllers/devicecontroller');
const { Sensor } = require('./models/sensor');
const { SensorController } = require('./controllers/sensorcontroller');
const { SensorSignal } = require('./models/sensorsignal');
const { SensorSignalController } = require('./controllers/sensorsignalcontroller');
//const { ConfigModule } = require('@nestjs/config');

@Module({
  imports: [], //ConfigModule.forRoot()
  controllers: [UserController,SubjectController,SubjectPropertiesController,MeasurementController,SensorTypeController,
  ActivityController,DeviceTypeController,ExperimentController,DeviceController,SensorController,SensorSignalController],
  providers: [User,Subject,SubjectProperties,Measurement,SensorType,Activity,DeviceType,Experiment,Device,Sensor,SensorSignal],
})
export class AppModule {}
