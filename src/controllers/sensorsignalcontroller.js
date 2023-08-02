const { Controller,Dependencies, Post,Put, Param, Get, Delete, Bind, Req, Res } = require('@nestjs/common');
const { SensorSignal } = require('../models/sensorsignal');

@Controller('api/sensorsignal')
@Dependencies(SensorSignal)
export class SensorSignalController {
  constructor(SensorSignal) {
    this.SensorSignal = SensorSignal;
  }

  @Get()
  getallSensorSignals() {
    return this.SensorSignal.getallSensorSignalsName();
  }

  @Get(':FileName')
  @Bind(Param())
  getFile(params) {
    return this.SensorSignal.getFilewithFileName(params.FileName);
  }

  @Get('/sensor/:id')
  @Bind(Param())
  getSensorSignalWithSensorID(params) {
    return this.SensorSignal.getSensorSignalWithSensorID(params.id);
  }

  @Get('/device/:id')
  @Bind(Param())
  getSensorSignalWithDeviceID(params) {
    return this.SensorSignal.getSensorSignalWithDeviceID(params.id);
  }

  @Get('/measurement/:id')
  @Bind(Param())
  getSensorSignalWithMeasurementID(params) {
    return this.SensorSignal.getSensorSignalWithMeasurementID(params.id);
  }
}