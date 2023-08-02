const { Controller,Dependencies, Post, Param, Get, Put,Delete, Bind, Req,Res } = require('@nestjs/common');
const { Device } = require('../models/device');
import { validate as isValidUUID } from 'uuid';
const cookieParser = require('cookie-parser');

@Controller('api/device')
@Dependencies(Device)

export class DeviceController {
  constructor(Device) {
    this.Device = Device;
  }

  @Get()
  getallDevices() {
    return this.Device.getallDevices();
  }

  @Post('/sensor')
  @Bind(Req(),Res())
  createDevice(request,response) {
    cookieParser()(request, response, (err) => {
      if (err) {
        console.error('Error parsing cookies:', err.message);
        return response.status(500).json({ success: false, error: 'Error parsing cookies' });
      }
    });
    const UserID = request.cookies['UserID'];
    this.Device.createDevice(request,UserID);
    return response.status(200).json({ success: true });
  }

  @Put('/edit/:id')
  @Bind(Param(),Req(),Res())
  async modifyDevicebyID(params,request,response) {
    try {
      await this.Device.modifyDevicebyID(params.id,request);
      return response.status(200).json({ success: true });
    }catch (error) {
      // Handle the error and send an appropriate response
      return response.status(500).json({ success: false, error: error.message });
    }
  }

  @Post('/experiment')
  @Bind(Req(),Res())
  async linkDeviceWithExperiment(request,response) {
    try {
      await this.Device.linkDeviceWithExperiment(request);
      return response.status(200).json({ success: true });
    }catch (error) {
      // Handle the error and send an appropriate response
      return response.status(500).json({ success: false, error: error.message });
    }
  }

  @Get(':id')
  @Bind(Param())
  findDevice(params) {
    const input = params.id;
    if (isValidUUID(input)) {
      return this.Device.findDeviceByID(params.id);
    } else {
      return this.Device.findDeviceByDescription(params.id);
    }
  }

  @Get('/devicetype/:name')
  @Bind(Param())
  getDeviceWithDeviceTypeName(params) {
    return this.Device.getDeviceWithDeviceTypeName(params.name);
  }

  @Get('/sensorsignal/:id')
  @Bind(Param())
  getDeviceWithSensorSignalID(params) {
    return this.Device.getDeviceWithSensorSignalID(params.id);
  }

  @Get('/experiment/:name')
  @Bind(Param())
  getDeviceWithExperimentName(params) {
    return this.Device.getDeviceWithExperimentName(params.name);
  }

  @Get('/sensor/:id')
  @Bind(Param())
  getDeviceWithSensorID(params) {
    return this.Device.getDeviceWithSensorID(params.id);
  }

  @Get('/measurement/:id')
  @Bind(Param())
  getDeviceWithMeasurementID(params) {
    return this.Device.getDeviceWithMeasurementID(params.id);
  }

  @Delete('/experiment')
  @Bind(Req())
  unlinkDeviceWithExperiment(request) {
    return this.Device.unlinkDeviceWithExperiment(request);
  }
}