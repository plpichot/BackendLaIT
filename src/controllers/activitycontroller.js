const { Controller,Dependencies, Post, Param, Get, Put, Delete, Bind, Req,Res } = require('@nestjs/common');
const { Activity } = require('../models/activity');
const cookieParser = require('cookie-parser');


@Controller('api/activity')
@Dependencies(Activity)

export class ActivityController {
  constructor(Activity) {
    this.Activity = Activity;
  }

  @Get()
  getallActivities() {
    return this.Activity.getallActivities();
  }

  @Post()
  @Bind(Req(),Res())
  async createActivity(request,response) {
    try {
      cookieParser()(request, response, (err) => {
        if (err) {
          console.error('Error parsing cookies:', err.message);
          return response.status(500).json({ success: false, error: 'Error parsing cookies' });
        }
      });
      const UserID = request.cookies['UserID'];
      await this.Activity.createActivity(request,UserID);
      return response.status(200).json({ success: true });
    } catch (error) {
      // Handle the error and send an appropriate response
      return response.status(500).json({ success: false, error: error.message });
    }
  }

  @Get(':name')
  @Bind(Param())
  getActivityByName(params) {
    return this.Activity.findActivityByName(params.name);
  }

  @Get('/experiment/:name')
  @Bind(Param())
  getActivityWithExperimentName(params) {
    return this.Activity.getActivityWithExperimentName(params.name);
  }

  @Get('/measurement/:id')
  @Bind(Param())
  getActivityWithMeasurementID(params) {
    return this.Activity.getActivityWithMeasurementID(params.id);
  }

  @Get('/subject/:id')
  @Bind(Param())
  getActivityWithSubjectID(params) {
    return this.Activity.getActivityWithSubjectID(params.id);
  }
}