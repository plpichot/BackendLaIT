const { Controller,Dependencies, Post,Put, Param, Get, Delete, Bind, Req, Res } = require('@nestjs/common');
const { Sensor } = require('../models/sensor');

@Controller('api/sensor')
@Dependencies(Sensor)
export class SensorController {
  constructor(Sensor) {
    this.Sensor = Sensor;
  }

  @Get()
  getallSensors() {
    return this.Sensor.getallSensors();
  }

  @Put()
  @Bind(Req(),Res())
  async modifySensorbyID(request,response) {
    try {
      await this.Sensor.modifySensorbyID(request);
      return response.status(200).json({ success: true });
    }catch (error) {
      // Handle the error and send an appropriate response
      return response.status(500).json({ success: false, error: error.message });
    }
  }

  @Post('/device')
  @Bind(Req(),Res())
  async linkSensorWithDevice(request,response) {
    try {
      await this.Sensor.linkSensorWithDevice(request);
      return response.status(200).json({ success: true });
    }catch (error) {
      // Handle the error and send an appropriate response
      return response.status(500).json({ success: false, error: error.message });
    }
  }

  @Get(':id')
  @Bind(Param())
  findSensorByID(params) {
    return this.Sensor.findSensorByID(params.id);
  }

  @Get('/sensortype/:name')
  @Bind(Param())
  getSensorWithSensorTypeName(params) {
    return this.Sensor.getSensorWithSensorTypeName(params.name);
  }

  @Get('/sensorsignal/:id')
  @Bind(Param())
  getSensorWithSensorSignalID(params) {
    return this.Sensor.getSensorWithSensorSignalID(params.id);
  }

  @Get('/device/:id')
  @Bind(Param())
  getSensorWithDeviceID(params) {
    return this.Sensor.getSensorWithDeviceID(params.id);
  }

  @Get('/measurement/:id')
  @Bind(Param())
  getSensorWithMeasurementID(params) {
    return this.Sensor.getSensorWithMeasurementID(params.id);
  }

  @Get('/experiment/:name')
  @Bind(Param())
  getSensorWithExperimentName(params) {
    return this.Sensor.getSensorWithExperimentName(params.name);
  }

  @Delete('/device')
  @Bind(Req())
  unlinkSensorWithDevice(request) {
    return this.Sensor.unlinkSensorWithDevice(request);
  }
}