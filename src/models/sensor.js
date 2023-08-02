import { Injectable } from '@nestjs/common';
const settings = require('../../settings.js');
const { v4: uuid } = require('uuid');

const neo4j = require('neo4j-driver');

const driver = neo4j.driver(settings.neo4jsettings.uri, neo4j.auth.basic(settings.neo4jsettings.user,settings.neo4jsettings.password));

@Injectable()
export class Sensor {

  async getallSensors() {
    const session = driver.session();

    // Find all Sensor in the database and return them
    try {
    const result = await session.run('MATCH (s:Sensor)-[:IS]->(st:SensorType) RETURN st.Name,s.ID,s.BitDepth,s.Range');
    session.close();
    return result.records.map(record => {
      return {
        Type: record.get('st.Name'),
        ID: record.get('s.ID'),
        BitDepth: record.get('s.BitDepth'),
        Range: record.get('s.Range')
        }
    });
    } catch (error) {
    session.close();
    throw error;
    }
  }

  async createSensor(request) {
    // Create a new Sensor in the database

    const Type = request.body.Type;
    const BitDepth = request.body.BitDepth;
    const Range = request.body.Range;
    const DeviceID = request.body.DeviceID;
    const ID = uuid();
  
    const session = driver.session();
    try {
      const sensortypetest = await session.run('MATCH (st:SensorType {Name :$Type}) RETURN st',{Type});
      if (sensortypetest.records.length == 0) {
        session.close();
        console.error('Error creating Sensor: The SensorType Name given does not exist in the database');
        throw new Error('Error creating Sensor: The SensorType Name given does not exist in the database');
      }
      await session.run(
        'MATCH (t:SensorType) WHERE t.Name = $Type CREATE (s:Sensor {ID: $ID, BitDepth: $BitDepth, Range: $Range}) -[:IS]->(t) WITH s MATCH (d:Device) WHERE d.ID = $DeviceID CREATE (d)-[:INCLUDES]->(s)',
        {
            Type: Type,
            ID: ID,
            BitDepth: BitDepth,
            Range: Range,
            DeviceID: DeviceID
        }
      );
      console.log('Sensor successfully created');
    } catch (error) {
      session.close();
      throw error;
    }
  }
  
  async findSensorByID(params) {
    // Find a Sensor with its id and return it
    const ID = params;
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (s:Sensor {ID: $ID})-[:IS]->(st:SensorType) RETURN st.Name,s.ID,s.BitDepth,s.Range',
        { ID }
      );
  
      return result.records.map(record => {
        return {
            Type: record.get('st.Name'),
            ID: record.get('s.ID'),
            BitDepth: record.get('s.BitDepth'),
            Range: record.get('s.Range')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getSensorWithSensorTypeName(params) {
    // Return all the Sensors corresponding to a Sensortype using the sensortype name
    const Name = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (s:Sensor)-[:IS]->(t:SensorType) WHERE t.Name = $Name RETURN s.ID,s.BitDepth,s.Range', {Name});
      return result.records.map(record => {
        return {
            ID: record.get('s.ID'),
            BitDepth: record.get('s.BitDepth'),
            Range: record.get('s.Range')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getSensorWithSensorSignalID(params) {
    // Return all the Sensors corresponding to a SensorSignal using the sensorsignal ID
    const SensorSignalID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (se:Sensor)-[:PRODUCES]->(s:SensorSignal) WHERE s.File_ID = $SensorSignalID RETURN se.ID,se.BitDepth,se.Range', {SensorSignalID});
      return result.records.map(record => {
        return {
          ID: record.get('se.ID'),
          BitDepth: record.get('se.BitDepth'),
          Range: record.get('se.Range')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async modifySensorbyID(request) {
    // Modify a sensor using its id

    const ID = request.body.ID;
    const BitDepth = request.body.BitDepth;
    const Range = request.body.Range;
    const session = driver.session();

    try {
      await session.run('MATCH (s:Sensor {ID: $ID}) SET s.BitDepth = $BitDepth, s.Range = $Range RETURN s.ID,s.BitDepth,s.Range', {ID,BitDepth,Range});
      console.log('Sensor successfully edited');
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async linkSensorWithDevice(request) {
    const SensorID = request.body.SensorID;
    const DeviceID = request.body.DeviceID;
    const session = driver.session();
    try {
      await session.run('MATCH (s:Sensor), (d:Device) WHERE s.ID = $SensorID AND d.ID = $DeviceID CREATE (d)-[:INCLUDES]->(s)', {SensorID,DeviceID});
      console.log('Link successfully created');
    }
    catch (error) {
      session.close();
      throw error;
    }
  }

  async unlinkSensorWithDevice(request) {
    const DeviceID = request.body.DeviceID;
    const SensorID = request.body.SensorID;
    const session = driver.session();
    try {
      await session.run('MATCH (s:Sensor)<-[r:INCLUDES]-(d:Device) WHERE s.ID = $SensorID AND d.ID = $DeviceID DELETE r', { SensorID, DeviceID });
      console.log('Link successfully removed');
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getSensorWithMeasurementID(params) {
    // Return all the Sensors corresponding to a measurement using the measurement ID
    const MeasurementID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (m:Measurement)<-[:HAS]-(Experiment)-[:USES]->(Device)-[:INCLUDES]->(s:Sensor)-[:IS]->(st:SensorType) WHERE m.ID = $MeasurementID RETURN st.Name,s.ID,s.BitDepth,s.Range', {MeasurementID});
      return result.records.map(record => {
        return {
          Type: record.get('st.Name'),
          ID: record.get('se.ID'),
          BitDepth: record.get('se.BitDepth'),
          Range: record.get('se.Range')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getSensorWithExperimentName(params) {
    // Return all the Sensors corresponding to an experiment using the experiment name
    const ExperimentName = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (e:Experiment)-[:USES]->(Device)-[:INCLUDES]->(s:Sensor)-[:IS]->(st:SensorType) WHERE e.Name = $ExperimentName RETURN st.Name,s.ID,s.BitDepth,s.Range', {ExperimentName});
      return result.records.map(record => {
        return {
          Type: record.get('st.Name'),
          ID: record.get('se.ID'),
          BitDepth: record.get('se.BitDepth'),
          Range: record.get('se.Range')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getSensorWithDeviceID(params) {
    // Return all the Sensors corresponding to a device using the device id
    const DeviceID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (d:Device)-[:INCLUDES]->(s:Sensor)-[:IS]->(st:SensorType) WHERE d.ID = $DeviceID RETURN st.Name,s.ID,s.BitDepth,s.Range', {DeviceID});
      return result.records.map(record => {
        return {
          Type: record.get('st.Name'),
          ID: record.get('s.ID'),
          BitDepth: record.get('s.BitDepth'),
          Range: record.get('s.Range')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }
}