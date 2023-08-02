import { Injectable } from '@nestjs/common';
const settings = require('../../settings.js');
import {User} from './user';
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(settings.neo4jsettings.uri, neo4j.auth.basic(settings.neo4jsettings.user,settings.neo4jsettings.password));

@Injectable()
export class DeviceType {

  async getallDeviceTypes() {
    const session = driver.session();

    // Find all DeviceType in the database and return them
    try {
    const result = await session.run('MATCH (d:DeviceType) RETURN d.Name,d.Description');
    session.close();
    return result.records.map(record => {
      return {
          Name: record.get('d.Name'),
          Description: record.get('d.Description')
        }
    });
    } catch (error) {
    session.close();
    throw error;
    }
  }

  async createDeviceType(request,UserID) {

    // Create a new DeviceType in the database
    const Name = request.body.Name;
    const Description = request.body.Description;
    const session = driver.session();
    try {
      if (UserID) {
        const instanceofUser = new User();
        const Access = await instanceofUser.getUserAccessWithID(UserID);
        if (Access != "Admin") {
          console.error('Error creating device type: You do not have the right to create one');
          throw new Error('Error creating device type: You do not have the right to create one');
        }
      }
      const testdevicetype = await session.run('MATCH (dt:DeviceType {Name :$Name}) RETURN dt',{Name});
      if (testdevicetype.records.length != 0) {
        session.close();
        console.error('Error creating devicetype: The Name given already exists in the database and it should be unique');
        throw new Error('Error creating devicetype: The Name given already exists in the database and it should be unique');
      }
      await session.run(
        'CREATE (d:DeviceType {Name: $Name, Description: $Description}) RETURN d',
        {
          Name: Name,
          Description: Description,
        }
      );
      console.log('DeviceType successfully created');
    } catch (error) {
      session.close();
      throw error;
    }
  }
  
  async findDeviceTypeByName(params) {
    // Find a DeviceType with its id and return it

    const Name = params;
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (d:DeviceType {Name: $Name}) RETURN d.Name,d.Description',
        { Name }
      );
  
      return result.records.map(record => {
        return {
            Name: record.get('d.Name'),
            Description: record.get('d.Description')
          }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getDeviceTypeWithDeviceID(params) {
    // Return all the devicetypes corresponding to a device using the device ID
    const ID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (d:Device)-[:IS]->(t:DeviceType) WHERE d.ID = $ID RETURN t.Name,t.Description', {ID});
      return result.records.map(record => {
        return {
          Name: record.get('t.Name'),
          Description: record.get('t.Description')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getDeviceTypeWithSensorSignal(params) {
    // Return all the devicetypes corresponding to a sensorsignal using the sensorsignal ID
    const ID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (s:SensorSignal)<-[:PRODUCES]-(Device)-[:IS]->(t:DeviceType) WHERE s.File_ID = $ID RETURN t.Name,t.Description', {ID});
      return result.records.map(record => {
        return {
          Name: record.get('t.Name'),
          Description: record.get('t.Description')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getDeviceTypeWithExperimentName(params) {
    // Return all the Devicetypes corresponding to an Experiment using the Experiment name
    const ExperimentName = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (e:Experiment)-[:USES]->(Device)-[:IS]->(t:DeviceType) WHERE e.Name = $ExperimentName RETURN t.Name,t.Description', {ExperimentName});
      return result.records.map(record => {
        return {
          Name: record.get('t.Name'),
          Description: record.get('t.Description')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }
}