import { Injectable } from '@nestjs/common';
const settings = require('../../settings.js');
const { v4: uuid } = require('uuid');
import {Sensor} from './sensor';
const neo4j = require('neo4j-driver');
import {User} from './user';

const driver = neo4j.driver(settings.neo4jsettings.uri, neo4j.auth.basic(settings.neo4jsettings.user,settings.neo4jsettings.password));

@Injectable()
export class Device {

  async getallDevices() {
    const session = driver.session();
  
    try {
      const result = await session.run('MATCH (dt:DeviceType)<-[:IS]-(d:Device)-[:INCLUDES]->(s:Sensor)-[:IS]->(st:SensorType) ' +
      'WITH dt, d, s, st ' +
      'ORDER BY dt.Name ' +
      'WITH dt, d, COLLECT({ Type: st.Name, ID: s.ID, BitDepth: s.BitDepth, Range: s.Range}) AS sensors ' +
      'RETURN COLLECT({Type: dt.Name, ID: d.ID, Description: d.Description, SampleTime: d.SampleTime, Sensors: sensors}) AS devices');
  
      session.close();
      const devices = result.records[0].get('devices');
      return devices;
    } catch (error) {
      session.close();
      throw error;
    }
  }
  
  async createDevice(request,UserID) {

    // Create a new Device in the database

    const Type = request.body.Type;
    const Description = request.body.Description;
    const SampleTime = request.body.SampleTime;
    const ID = uuid();

    const session = driver.session();
    try {
      if (UserID) {
        const instanceofUser = new User();
        const Access = await instanceofUser.getUserAccessWithID(UserID);
        if (Access != "Admin" && Access != "User") {
          console.error('Error creating device: You do not have the right to create one');
          throw new Error('Error creating device: You do not have the right to create one');
        }
      }
      const devicetypetest = await session.run('MATCH (dt:DeviceType {Name :$Type}) RETURN dt',{Type});
      if (devicetypetest.records.length == 0) {
        session.close();
        console.error('Error creating Device: The DeviceType Name given does not exist in the database');
        throw new Error('Error creating Device: The DeviceType Name given does not exist in the database');
      }
      await session.run(
        'MATCH (t:DeviceType) WHERE t.Name = $Type CREATE (d:Device {ID: $ID, Description: $Description, SampleTime: $SampleTime}) -[:IS]->(t)',
        {
            Type: Type,
            ID: ID,
            Description: Description,
            SampleTime: SampleTime
        }
      );
      console.log('Device successfully created');

      const sensors = request.body.Sensors;
      const instanceofSensor = new Sensor();

      for (let sensor of sensors) {
        if (sensor) {
          sensor.DeviceID = ID;
          await instanceofSensor.createSensor({ body: sensor}); // Call createSensor function for each sensor in the loop
        } else {
          console.error('Error: The sensor object is null or undefined.');
          throw new Error('Error: The sensor object is null or undefined.');
        }
      }
    } catch (error) {
      session.close();
      throw error;
    }
  }
  
  async findDeviceByID(params) {
    // Find a Device with its id and return it

    const ID = params;
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (dt:DeviceType)<-[:IS]-(d:Device)-[:INCLUDES]->(s:Sensor)-[:IS]->(st:SensorType) ' +
        'WHERE d.ID = $ID ' +
        'WITH dt, d, s, st ' +
        'WITH dt, d, COLLECT({ Type: st.Name, ID: s.ID, BitDepth: s.BitDepth, Range: s.Range}) AS sensors ' +
        'RETURN { Type: dt.Name, ID: d.ID, Description: d.Description, SampleTime: d.SampleTime, Sensors: sensors} AS device',
        { ID: ID }
      );
      const device = result.records.map(record => record.get('device'));
      return device;
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async findDeviceByDescription(params) {
    // Find a Device with its description and return it

    const Description = params;
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (dt:DeviceType)<-[:IS]-(d:Device)-[:INCLUDES]->(s:Sensor)-[:IS]->(st:SensorType) ' +
        'WHERE d.Description = $Description ' +
        'WITH dt, d, s, st ' +
        'WITH dt, d, COLLECT({ Type: st.Name, ID: s.ID, BitDepth: s.BitDepth, Range: s.Range}) AS sensors ' +
        'RETURN { Type: dt.Name, ID: d.ID, Description: d.Description, SampleTime: d.SampleTime, Sensors: sensors} AS device',
        { Description: Description }
      );
      const device = result.records.map(record => record.get('device'));
      return device;
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getDeviceWithDeviceTypeName(params) {
    // Return all the devices corresponding to a devicetype using the devicetype name
    const Name = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (dt:DeviceType)<-[:IS]-(d:Device)-[:INCLUDES]->(s:Sensor)-[:IS]->(st:SensorType) WHERE dt.Name = $Name '+ 
      'RETURN d.ID,d.Description,d.SampleTime ' +
      'WITH dt, d, s, st ' + 
      'WITH dt, d, COLLECT({ Type: st.Name, ID: s.ID, BitDepth: s.BitDepth, Range: s.Range}) AS sensors ' +
      'RETURN { Type: dt.Name, ID: d.ID, Description: d.Description, SampleTime: d.SampleTime, Sensors: sensors} AS device',{Name});
      const device = result.records.map(record => record.get('device'));
      return device;
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getDeviceWithSensorSignalID(params) {
    // Return all the Devices corresponding to a SensorSignal using the sensorsignal ID
    const SensorSignalID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (d:Device)-[:PRODUCES]->(s:SensorSignal) WHERE s.File_ID = $SensorSignalID RETURN d.ID,d.Description,d.SampleTime', {SensorSignalID});
      return result.records.map(record => {
        return {
          ID: record.get('d.ID'),
          Description: record.get('d.Description'),
          SampleTime: record.get('d.SampleTime')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getDeviceWithSensorID(params) {
    // Return all the Devices corresponding to a Sensor using the sensor ID
    const SensorID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (d:Device)-[:INCLUDES]->(s:Sensor) WHERE s.ID = $SensorID RETURN d.ID,d.Description,d.SampleTime', {SensorID});
      return result.records.map(record => {
        return {
          ID: record.get('d.ID'),
          Description: record.get('d.Description'),
          SampleTime: record.get('d.SampleTime')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async modifyDevicebyID(params,request) {
    // Modify a device using its id

    const ID = params;
    const Description = request.body.Description;
    const SampleTime = request.body.SampleTime;
    const session = driver.session();

    try {
      const devicetest = await session.run('MATCH (d:Device {ID :$ID}) RETURN d',{ID});
      if (devicetest.records.length == 0) {
        session.close();
        console.error('Error editing Device and Sensors: The Device ID given does not exist in the database');
        throw new Error('Error editing Device and Sensors: The Device ID given does not exist in the database');
      }
      await session.run('MATCH (d:Device {ID: $ID}) SET d.SampleTime = $SampleTime, d.Description = $Description RETURN d.ID,d.Description,d.SampleTime', {ID,Description,SampleTime});
      console.log('Device successfully edited');
      const sensors = request.body.Sensors;
      const instanceofSensor = new Sensor();

      for (let sensor of sensors) {
        const SensorID = sensor.ID;
        const sensortest = await session.run('MATCH (s:Sensor {ID :$SensorID}) RETURN s',{SensorID});
        if (sensortest.records.length == 0) {
          session.close();
          console.error('Error editing Device and Sensors: The Sensor ID given does not exist in the database');
          throw new Error('Error editing Device and Sensors: The Sensor ID given does not exist in the database');
        }
        await instanceofSensor.modifySensorbyID({ body: sensor}); // Call modifySensorbyID function for each sensor in the loop
      }
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async linkDeviceWithExperiment(request) {
    const DeviceID = request.body.DeviceID;
    const ExperimentName = request.body.ExperimentName;
    const session = driver.session();
    try {
      await session.run('MATCH (e:Experiment), (d:Device) WHERE e.Name = $ExperimentName AND d.ID = $DeviceID CREATE (e)-[:USES]->(d)', {ExperimentName,DeviceID});
      console.log('Link successfully created');
    }
    catch (error) {
      session.close();
      throw error;
    }
  }

  async unlinkDeviceWithExperiment(request) {
    const DeviceID = request.body.DeviceID;
    const ExperimentName = request.body.ExperimentName;
    const session = driver.session();
    try {
      await session.run('MATCH (e:Experiment)-[r:USES]->(d:Device) WHERE e.Name = $ExperimentName AND d.ID = $DeviceID DELETE r', { ExperimentName, DeviceID });
      console.log('Link successfully removed');
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getDeviceWithMeasurementID(params) {
    // Return all the Devices corresponding to a measurement using the measurement ID
    const MeasurementID = params;
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (m:Measurement {ID = $MeasurementID})<-[:HAS]-(e:Experiment)-[:USES]->(d:Device)-[:INCLUDES]->(s:Sensor)-[:IS]->(st:SensorType) ' +
        'WITH DISTINCT d, s, st ' +
        'WITH d, COLLECT({ Type: st.Name, ID: s.ID, BitDepth: s.BitDepth, Range: s.Range}) AS sensors ' +
        'MATCH (dt:DeviceType)<-[:IS]-(d:Device) ' +
        'RETURN { Type: dt.Name, ID: d.ID, Description: d.Description, SampleTime: d.SampleTime, Sensors: sensors} AS device',
        {MeasurementID}
      );
      session.close();
      const devices = result.records.map(record => record.get('device'));
      return devices;
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getDeviceWithExperimentName(params) {
    const Name = params;
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (e:Experiment {Name: $Name})-[:USES]->(d:Device)-[:INCLUDES]->(s:Sensor)-[:IS]->(st:SensorType) ' +
        'WITH DISTINCT d, s, st ' +
        'WITH d, COLLECT({ Type: st.Name, ID: s.ID, BitDepth: s.BitDepth, Range: s.Range}) AS sensors ' +
        'MATCH (dt:DeviceType)<-[:IS]-(d:Device) ' +
        'RETURN { Type: dt.Name, ID: d.ID, Description: d.Description, SampleTime: d.SampleTime, Sensors: sensors} AS device',
        {Name}
      );
      session.close();
      const devices = result.records.map(record => record.get('device'));
      return devices;
    } catch (error) {
      session.close();
      throw error;
    }
  }
}