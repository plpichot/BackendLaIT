const { Controller,Dependencies, Post, Param, Get, Put, Delete, Bind, Req, Res } = require('@nestjs/common');
const { SensorType } = require('../models/sensortype');
const cookieParser = require('cookie-parser');

@Controller('api/sensortype')
@Dependencies(SensorType)
export class SensorTypeController {
  constructor(SensorType) {
    this.SensorType = SensorType;
  }

  @Get()
  getallSensorTypes() {
    return this.SensorType.getallSensorTypes();
  }

  @Post()
  @Bind(Req(),Res())
  async createSensorType(request,response) {
    try {
      cookieParser()(request, response, (err) => {
        if (err) {
          console.error('Error parsing cookies:', err.message);
          return response.status(500).json({ success: false, error: 'Error parsing cookies' });
        }
      });
      const UserID = request.cookies['UserID'];
      await this.SensorType.createSensorType(request,UserID);
      return response.status(200).json({ success: true });
    }catch (error) {
      // Handle the error and send an appropriate response
      return response.status(500).json({ success: false, error: error.message });
    }
  }

  @Get(':name')
  @Bind(Param())
  getSensorTypeByName(params) {
    return this.SensorType.findSensorTypeByName(params.name);
  }

  @Get('/sensor/:id')
  @Bind(Param())
  getSensorTypeWithSensorID(params) {
    return this.SensorType.getSensorTypeWithSensorID(params.id);
  }

  @Get('/sensorsignal/:id')
  @Bind(Param())
  getSensorTypeWithSensorSignal(params) {
    return this.SensorType.getSensorTypeWithSensorSignal(params.id);
  }

  @Get('/experiment/:name')
  @Bind(Param())
  getSensorTypeWithExperimentName(params) {
    return this.SensorType.getSensorTypeWithExperimentName(params.name);
  }
}