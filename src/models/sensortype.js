import { Injectable } from '@nestjs/common';
const settings = require('../../settings.js');
import {User} from './user';
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(settings.neo4jsettings.uri, neo4j.auth.basic(settings.neo4jsettings.user,settings.neo4jsettings.password));

@Injectable()
export class SensorType {

  async getallSensorTypes() {
    const session = driver.session();

    // Find all sensortypes in the database and return them
    try {
    const result = await session.run('MATCH (s:SensorType) RETURN s.Name,s.Description,s.DOF,s.Unit,s.DataField');
    session.close();
    return result.records.map(record => {
      return {
          Name: record.get('s.Name'),
          Description: record.get('s.Description'),
          DOF: record.get('s.DOF'),
          Unit: record.get('s.Unit'),
          DataField: record.get('s.DataField')
        }
    });
    } catch (error) {
    session.close();
    throw error;
    }
  }

  async createSensorType(request,UserID) {

    // Create a new sensortype in the database

    const Name = request.body.Name;
    const Description = request.body.Description;
    const DOF = request.body.DOF;
    const Unit = request.body.Unit;
    const DataField = request.body.DataField;

    const session = driver.session();
    try {
      if (UserID) {
        const instanceofUser = new User();
        const Access = await instanceofUser.getUserAccessWithID(UserID);
        if (Access != "Admin") {
          console.error('Error creating sensor type: You do not have the right to create one');
          throw new Error('Error creating sensor type: You do not have the right to create one');
        }
      }
      const testsensortype = await session.run('MATCH (st:SensorType {Name :$Name}) RETURN st',{Name});
      if (testsensortype.records.length != 0) {
        session.close();
        console.error('Error creating SensorType: The Name given already exists in the database and it should be unique');
        throw new Error('Error creating SensorType: The Name given already exists in the database and it should be unique');
      }

      if (DataField.length != DOF) {
        console.error('Error creating SensorType: The length of DataField should be equal to DOF');
        throw new Error('Error creating SensorType: The length of DataField should be equal to DOF');
      }

      await session.run(
        'CREATE (s:SensorType {Name: $Name, Description: $Description, DOF: $DOF, Unit: $Unit, DataField: $DataField}) RETURN s',
        {
          Name: Name,
          Description: Description,
          DOF: DOF,
          Unit: Unit,
          DataField: DataField
        }
      );
      console.log('SensorType successfully created');
    } catch (error) {
      session.close();
      throw error;
    }
  }
  
  async findSensorTypeByName(params) {
    // Find a sensortype with its name and return it

    const Name = params;
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (s:SensorType {Name: $Name}) RETURN s.Name,s.Description,s.DOF,s.Unit,s.DataField',
        { Name }
      );
  
      return result.records.map(record => {
        return {
            Name: record.get('s.Name'),
            Description: record.get('s.Description'),
            DOF: record.get('s.DOF'),
            Unit: record.get('s.Unit'),
            DataField: record.get('s.DataField')
          }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getSensorTypeWithSensorID(params) {
    // Return all the Sensortypes corresponding to a Sensor using the sensor ID
    const ID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (s:Sensor)-[:IS]->(t:SensorType) WHERE s.ID = $ID RETURN t.Name,t.Description,t.DOF,t.Unit,t.DataField', {ID});
      return result.records.map(record => {
        return {
          Name: record.get('t.Name'),
          Description: record.get('t.Description'),
          DOF: record.get('t.DOF'),
          Unit: record.get('t.Unit'),
          DataField: record.get('t.DataField')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getSensorTypeWithSensorSignal(params) {
    // Return all the sensortypes corresponding to a sensorsignal using the sensorsignal ID
    const ID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (s:SensorSignal)<-[:PRODUCES]-(Sensor)-[:IS]->(t:SensorType) WHERE s.File_ID = $ID RETURN t.Name,t.Description,t.DOF,t.Unit,t.DataField', {ID});
      return result.records.map(record => {
        return {
          Name: record.get('t.Name'),
          Description: record.get('t.Description'),
          DOF: record.get('t.DOF'),
          Unit: record.get('t.Unit'),
          DataField: record.get('t.DataField')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getSensorTypeWithExperimentName(params) {
    // Return all the Sensortypes corresponding to an Experiment using the Experiment name
    const ExperimentName = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (e:Experiment)-[:USES]->(Device)-[:INCLUDES]->(Sensor)-[:IS]->(t:SensorType) WHERE e.Name = $ExperimentName RETURN t.Name,t.Description,t.DOF,t.Unit,t.DataField', {ExperimentName});
      return result.records.map(record => {
        return {
          Name: record.get('t.Name'),
          Description: record.get('t.Description'),
          DOF: record.get('t.DOF'),
          Unit: record.get('t.Unit'),
          DataField: record.get('t.DataField')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }
}