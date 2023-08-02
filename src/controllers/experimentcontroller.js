const { Controller,Dependencies, Post, Param, Get, Put, Delete, Bind, Req,Res} = require('@nestjs/common');
const { Experiment } = require('../models/experiment');
const cookieParser = require('cookie-parser');

@Controller('api/experiment')
@Dependencies(Experiment)
export class ExperimentController {
  constructor(Experiment) {
    this.Experiment = Experiment;
  }

  @Get()
  getallExperiments() {
    return this.Experiment.getallExperiments();
  }

  @Post()
  @Bind(Req(),Res())
  async createExperiment(request,response) {
    try {
      cookieParser()(request, response, (err) => {
        if (err) {
          console.error('Error parsing cookies:', err.message);
          return response.status(500).json({ success: false, error: 'Error parsing cookies' });
        }
      });
      const UserID = request.cookies['UserID'];
      await this.Experiment.createExperiment(request,UserID);
      return response.status(200).json({ success: true });
    }catch (error) {
      // Handle the error and send an appropriate response
      return response.status(500).json({ success: false, error: error.message });
    }
  }

  @Post('/device/sensor')
  @Bind(Req(),Res())
  async createExperimentDevicesAndSensors(request,response) {
    try {
      cookieParser()(request, response, (err) => {
        if (err) {
          console.error('Error parsing cookies:', err.message);
          return response.status(500).json({ success: false, error: 'Error parsing cookies' });
        }
      });
      const UserID = request.cookies['UserID'];
      await this.Experiment.createExperimentDevicesAndSensors(request,UserID);
      return response.status(200).json({ success: true });
    }catch (error) {
      // Handle the error and send an appropriate response
      return response.status(500).json({ success: false, error: error.message });
    }
  }

  @Get(':name')
  @Bind(Param())
  getExperimentByName(params) {
    return this.Experiment.findExperimentByName(params.name);
  }

  @Get('/show/name')
  showExperimentsNames() {
    return this.Experiment.showExperimentsNames();
  }

  @Get('/sensor/:id')
  @Bind(Param())
  getExperimentWithSensorID(params) {
    return this.Experiment.getExperimentWithSensorID(params.id);
  }

  @Get('/device/:id')
  @Bind(Param())
  getExperimentWithDeviceID(params) {
    return this.Experiment.getExperimentWithDeviceID(params.id);
  }
    
  @Get('/activity/:name')
  @Bind(Param())
  getExperimentWithActivityName(params) {
    return this.Experiment.getExperimentWithActivityName(params.name);
  }

  @Get('/measurement/:id')
  @Bind(Param())
  getExperimentWithMeasurementID(params) {
    return this.Experiment.getExperimentWithMeasurementID(params.id);
  }

  @Get('/subject/:id')
  @Bind(Param())
  getExperimentWithSubjectID(params) {
    return this.Experiment.getExperimentWithSubjectID(params.id);
  }
  
  @Put('/modify/:name')
  @Bind(Param(),Req(),Res())
  async modifyExperimentByName(params,request,response) {
    try {
      await this.Experiment.modifyExperimentByName(params.name,request);
      return response.status(200).json({ success: true });
    }catch (error) {
      // Handle the error and send an appropriate response
      return response.status(500).json({ success: false, error: error.message });
    }
  }

  @Put('/edit/:name')
  @Bind(Param(),Req(),Res())
  async editExperimentbyName(params,request,response) {
    try {
      await this.Experiment.editExperimentbyName(params.name,request);
      return response.status(200).json({ success: true });
    }catch (error) {
      // Handle the error and send an appropriate response
     return response.status(500).json({ success: false, error: error.message });
    }
  }

  @Get('/user/:id')
  @Bind(Param())
  getExperimentCreatedbyUser(params) {
    return this.Experiment.getExperimentCreatedbyUser(params.id);
  }
}