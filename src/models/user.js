import { Injectable } from '@nestjs/common';
const settings = require('../../settings.js');

const { v4: uuid } = require('uuid');

const neo4j = require('neo4j-driver');

const driver = neo4j.driver(settings.neo4jsettings.uri, neo4j.auth.basic(settings.neo4jsettings.user,settings.neo4jsettings.password));

@Injectable()
export class User {

  async getallUsers() {
    // Find all users and return them
    const session = driver.session();

    try {
      const result = await session.run('MATCH (u:User) RETURN u.ID,u.Name,u.Password,u.Access');
      session.close();
      return result.records.map(record => {
        return {
          ID: record.get('u.ID'),
          Name: record.get('u.Name'),
          Password: record.get('u.Password'),
          Access: record.get('u.Access')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async LoginUser(request) {
    const Name = request.body.Name;
    const password = request.body.password;

    const session = driver.session;
    try {
      const finduser = await session.run('MATCH (u:User) WHERE u.Name = $Name AND u.Password = $password RETURN u.ID', {Name,password});
      if (finduser.records.length == 0) {
        session.close();
        console.error('Error User login: The Password or the Name is false');
        throw ('Error User login: The Password or the Name is false');
      }
      const record = finduser.records[0];
      return record;
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async createUser(request) {
    // Create a new user in the database

    const Name = request.body.Name;
    const Password = request.body.Password;
    const Access = request.body.Access;
    const ID = uuid();

    const session = driver.session();
    try {
      await session.run(
        'CREATE (u:User {ID: $ID, Name: $Name, Password: $Password, Access: $Access}) RETURN u',
        { ID: ID, Name: Name, Password: Password, Access: Access }
      );
      session.close();
        console.log('User successfully created');

    } catch (error) {
      session.close();
      throw error;
    }
  }
  
  async getUserByID(params) {

    // Find a user with his ID and return him
    const ID = params;

    const session = driver.session();
    try {
      const result = await session.run('MATCH (u:User {ID: $ID}) RETURN u.ID,u.Name,u.Password,u.Access', { ID });
      session.close();
      return result.records.map(record => {
        return {
          ID: record.get('u.ID'),
          Name: record.get('u.Name'),
          Password: record.get('u.Password'),
          Access: record.get('u.Access')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getUserAccessWithID(ID) {
    const session = driver.session();
    try {
      const Access = await session.run('MATCH (u:User {ID: $ID}) RETURN u.Access', { ID });
      session.close();
      const record = Access.records[0];
      return record;
    } catch (error) {
      session.close();
      throw error;
    }
  }
  
  async updateUserByID(params,request) {
    // Find a user with his ID and change his informations
    const ID = params;
    const Name = request.body.Name;
    const Password = request.body.Password;

    const session = driver.session();
  
    try {
      const result = await session.run('MATCH (u:User {ID: $ID}) SET u.Name = $Name, u.Password = $Password RETURN u.ID,u.Name,u.Password', { ID, Name, Password });
      session.close();
      return result.records.map(record => {
        return {
          ID: record.get('u.ID'),
          Name: record.get('u.Name'),
          Password: record.get('u.Password'),
          Access: record.get('u.Access')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }
  
  async deleteUserByID(params) {
    // Find a user with his ID and delete him

    const ID = params;

    const session = driver.session();
  
    try {
      await session.run('MATCH (u:User {ID: $ID}) DELETE u', { ID });
      session.close();
      return ('node deleted');
    } catch (error) {
      session.close();
      throw error;
    }
  }
}