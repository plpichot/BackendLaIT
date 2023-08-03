const { Controller,Dependencies, Post, Param, Get, Put, Delete, Bind, Req, Res} = require('@nestjs/common');
const { User } = require('../models/user');

@Controller('api/user')
@Dependencies(User)
export class UserController {
  constructor(user) {
    this.user = user;
  }

  @Get()
  getallUsers() {
    return this.user.getallUsers();
  }

  @Post()
  @Bind(Req(),Res())
  async createUser(request,response) {
    try {
      await this.user.createUser(request);
      return response.status(200).json({ success: true });
    }catch (error) {
      // Handle the error and send an appropriate response
      return response.status(500).json({ success: false, error: error.message });
    }
  }

  @Post('/login')
  @Bind(Req(),Res())
  async LoginUser(request,response) {
    try {
    const ID = await this.user.LoginUser(request);
    return response.status(200).json({ UserID: ID });
    }catch (error) {
      // Handle the error and send an appropriate response
      return response.status(500).json({ success: false, error: error.message });
    }
  }

  @Get(':id')
  @Bind(Param())
  getUserByID(params) {
    return this.user.getUserByID(params.id);
  }

  @Put(':id')
  @Bind(Param(),Req(),Res())
  updateUserByID(params,request,response) {
    this.user.updateUserByID(params.id,request);
    return response.status(200).json({ success: true });
  }
}
