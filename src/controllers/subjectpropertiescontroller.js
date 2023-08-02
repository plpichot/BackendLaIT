import moment from '../../node_modules/moment/moment';
const { Controller,Dependencies, Post,Put, Param, Get, Delete, Bind, Req, Res } = require('@nestjs/common');
const { SubjectProperties } = require('../models/subjectproperties');
const cookieParser = require('cookie-parser');

@Controller('api/subjectproperties')
@Dependencies(SubjectProperties)
export class SubjectPropertiesController {
  constructor(SubjectProperties) {
    this.SubjectProperties = SubjectProperties;
  }

  @Get()
  getallSubjectsProperties() {
    return this.SubjectProperties.getallProperties();
  }

  @Post()
  @Bind(Req(),Res())
  async createProperties(request,response) {
    try {
      cookieParser()(request, response, (err) => {
        if (err) {
          console.error('Error parsing cookies:', err.message);
          return response.status(500).json({ success: false, error: 'Error parsing cookies' });
        }
      });
      const UserID = request.cookies['UserID'];
      await this.SubjectProperties.createProperties(request,UserID);
      return response.status(200).json({ success: true });
    }catch (error) {
      // Handle the error and send an appropriate response
      return response.status(500).json({ success: false, error: error.message });
    }
  }

  @Get(':id')
  @Bind(Param())
  getPropertiesByDate(params) {
    if (moment(params.id,"DD-MM-YYYY", true).isValid()) {
        return this.SubjectProperties.getPropertiesByDate(params.id);
    } else {
        return this.SubjectProperties.getPropertiesBySport(params.id);
    };
  }

  @Get('/subject/:id')
  @Bind(Param())
  getPropertiesWithSubjectID(params) {
    return this.SubjectProperties.getPropertiesWithSubjectID(params.id);
  }

  @Get('/measurement/:id')
  @Bind(Param())
  getPropertiesWithMeasurementID(params) {
    return this.SubjectProperties.getPropertiesWithMeasurementID(params.date);
  }
}