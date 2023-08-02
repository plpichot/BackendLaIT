const { Controller,Dependencies, Post, Param, Get, Put, Delete, Bind, Req, Res } = require('@nestjs/common');
const { Subject } = require('../models/subject');
import { validate as isValidUUID } from 'uuid';
const cookieParser = require('cookie-parser');

@Controller('api/subject')
@Dependencies(Subject)
export class SubjectController {
  constructor(Subject) {
    this.Subject = Subject;
  }

  @Get()
  getallSubjects() {
    return this.Subject.getallSubjects();
  }

  @Post()
  @Bind(Req(),Res())
  async createSubject(request,response) {
    try {
      cookieParser()(request, response, (err) => {
        if (err) {
          console.error('Error parsing cookies:', err.message);
          return response.status(500).json({ success: false, error: 'Error parsing cookies' });
        }
      });
      const UserID = request.cookies['UserID'];
      await this.Subject.createSubject(request,UserID);
      return response.status(200).json({ success: true });
    }catch (error) {
      // Handle the error and send an appropriate response
      return response.status(500).json({ success: false, error: error.message });
    }
  }

  @Get(':param')
  @Bind(Param())
  getSubjectByIdOrName(params) {
    const input = params.param;
    if (isValidUUID(input)) {
      return this.Subject.findSubjectByID(input);
    } else {
      return this.Subject.findSubjectsByName(input);
    }
  }

  @Get('/show/name')
  showSubjectsNames() {
    return this.Subject.showSubjectsNames();
  }

  @Get('/measurement/:id')
  @Bind(Param())
  getSubjectWithMeasurementID(params) {
    return this.Subject.getSubjectWithMeasurementID(params.id);
  }

  @Get('/experiment/:name')
  @Bind(Param())
  getSubjectWithExperimentName(params) {
    return this.Subject.getSubjectWithExperimentName(params.name);
  }

  @Get('/user/:id')
  @Bind(Param())
  getSubjectCreatedbyUser(params) {
    return this.Subject.getSubjectCreatedbyUser(params.id);
  }

  @Put(':id')
  @Bind(Param(),Req(),Res())
  async updateSubjectById(params,request,response) {
    try {
    await this.Subject.modifySubjectByID(params.id, request);
    return response.status(200).json({ success: true });
    }catch (error) {
      // Handle the error and send an appropriate response
      return response.status(500).json({ success: false, error: error.message });
    }
  }

}