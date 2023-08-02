const { Controller,Dependencies, Post,Put, Param, Get, Delete, Bind, Req, Res } = require('@nestjs/common');
const { Measurement } = require('../models/measurement');
const cookieParser = require('cookie-parser');

@Controller('api/measurement')
@Dependencies(Measurement)

export class MeasurementController {
  constructor(Measurement) {
    this.Measurement = Measurement;
  }

  @Get()
  getallMeasurements() {
    return this.Measurement.getallMeasurements();
  }

  @Post()
  @Bind(Req(),Res())
  async createMeasurement(request,response) {
    try {
      cookieParser()(request, response, (err) => {
        if (err) {
          console.error('Error parsing cookies:', err.message);
          return response.status(500).json({ success: false, error: 'Error parsing cookies' });
        }
      });
      const UserID = request.cookies['UserID'];
      const MeasurementID = await this.Measurement.createMeasurementGolf(request,UserID);
      return response.status(200).json({ MeasurementID: MeasurementID });
    }catch (error) {
        // Handle the error and send an appropriate response
      return response.status(500).json({ success: false, error: error.message });
    }
  }

  @Get(':id')
  @Bind(Param())
  getMeasurementByID(params) {
    return this.Measurement.getMeasurementByID(params.id);
  }

  @Get('/datetime/:date')
  @Bind(Param())
  getMeasurementByDateTime(params) {
    return this.Measurement.getMeasurementByDateTime(params.date);
  }

  @Get('/subject/:id')
  @Bind(Param())
  getMeasurementWithSubjectID(params) {
    return this.Measurement.getMeasurementWithSubjectID(params.id);
  }

  @Get('/experiment/:name')
  @Bind(Param())
  getMeasurementWithExperimentName(params) {
    return this.Measurement.getMeasurementWithExperimentName(params.name);
  }

  @Get('/experiment/datetime/:name')
  @Bind(Param())
  getMeasurementDateTimeWithExperimentName(params) {
    return this.Measurement.getMeasurementDateTimeWithExperimentName(params.name);
  }

  @Get('/subject/datetime/:id')
  @Bind(Param())
  getMeasurementDateTimeWithSubjectID(params) {
    return this.Measurement.getMeasurementDateTimeWithSubjectID(params.id);
  }

  @Get('/experiment/subject/:name/:id')
  @Bind(Param())
  getMeasurementWithExperimentNameAndSubjectID(params) {
    return this.Measurement.getMeasurementWithExperimentNameAndSubjectID(params.name,params.id);
  }

  @Get('/sensorsignal/:id')
  @Bind(Param())
  getMeasurementWithSensorSignalID(params) {
    return this.Measurement.getMeasurementWithSensorSignalID(params.id);
  }

  @Get('/user/:id')
  @Bind(Param())
  getMeasurementCreatedbyUser(params) {
    return this.Measurement.getMeasurementCreatedbyUser(params.id);
  }
}