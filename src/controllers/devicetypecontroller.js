const { Controller,Dependencies, Post, Param, Get, Put, Delete, Bind, Req, Res } = require('@nestjs/common');
const { DeviceType } = require('../models/devicetype');
const cookieParser = require('cookie-parser');

@Controller('api/devicetype')
@Dependencies(DeviceType)

export class DeviceTypeController {
  constructor(DeviceType) {
    this.DeviceType = DeviceType;
  }

  @Get()
  getallDeviceTypes() {
    return this.DeviceType.getallDeviceTypes();
  }

  @Post()
  @Bind(Req(), Res())
  async createDeviceType(request,response) {
    try {
      cookieParser()(request, response, (err) => {
        if (err) {
          console.error('Error parsing cookies:', err.message);
          return response.status(500).json({ success: false, error: 'Error parsing cookies' });
        }
      });
      const UserID = request.cookies['UserID'];
      await this.DeviceType.createDeviceType(request,UserID);
      return response.status(200).json({ success: true });
    }catch (error) {
      // Handle the error and send an appropriate response
      return response.status(500).json({ success: false, error: error.message });
    }
  }

  @Get(':name')
  @Bind(Param())
  getDeviceTypeByName(params) {
    return this.DeviceType.findDeviceTypeByName(params.name);
  }

  @Get('/device/:id')
  @Bind(Param())
  getDeviceTypeWithDeviceID(params) {
    return this.DeviceType.getDeviceTypeWithDeviceID(params.id);
  }

  @Get('/sensorsignal/:id')
  @Bind(Param())
  getDeviceTypeWithSensorSignal(params) {
    return this.DeviceType.getDeviceTypeWithSensorSignal(params.id);
  }

  @Get('/experiment/:name')
  @Bind(Param())
  getDeviceTypeWithExperimentName(params) {
    return this.DeviceType.getDeviceTypeWithExperimentName(params.name);
  }
}