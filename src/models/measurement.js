import { Injectable } from '@nestjs/common';
const settings = require('../../settings.js');
import {SensorSignal} from './sensorsignal';
import {User} from './user';
const neo4j = require('neo4j-driver');
const { v4: uuid } = require('uuid');
import { validate as isValidUUID } from 'uuid';
const fs = require('fs');

const driver = neo4j.driver(settings.neo4jsettings.uri, neo4j.auth.basic(settings.neo4jsettings.user,settings.neo4jsettings.password));

@Injectable()
export class Measurement {

  async getallMeasurements() {
      // Find all Measurements and return them
      const session = driver.session();
  
      try {
        const result = await session.run(`MATCH (m:Measurement)-[:PRODUCES]->(sd:SensorSignal)
        WITH m, COLLECT(sd) AS sensorSignals
        MATCH (m)<-[:HAS]-(e:Experiment)
        WITH m, sensorSignals, e
        MATCH (m)<-[:CONDUCTS]-(s:Subject)
        RETURN m, sensorSignals, e.Name AS experimentName, s.Name AS subjectName`);
        session.close();
    
        return result.records.map(record => {
          const measurement = {};
    
          const mProperties = record.get('m').properties;
          Object.assign(measurement, mProperties);
    
          // Include additional properties
          measurement["SubjectName"] = record.get("subjectName");
          measurement["ExperimentName"] = record.get("experimentName");
          measurement["SensorSignals"] = record.get("sensorSignals").map(signal => signal.properties.File_Name);
          return measurement;
        });
      } catch (error) {
        session.close();
        throw error;
      }
  }

  async createMeasurementGolf(request,UserID) {
    // Create a new Measurement in the database

    const SubjectID = request.body.SubjectID;
    const ExperimentName = request.body.ExperimentName;
    const DateTime = request.body.DateTime;
    const Location = request.body.Location;
    const CustomFields = request.body.CustomFields;
    const Data = request.body.Data;
    const PreviousID = request.body.PreviousID;
    const MeasurementID = uuid();
    const maybeproperties = request.body;

    const session = driver.session();
    try {
      if (UserID) {
        const instanceofUser = new User();
        const Access = await instanceofUser.getUserAccessWithID(maybeproperties.UserID);
        if (Access != "Admin" && Access != "User") {
          console.error('Error creating measurement: You do not have the right to create one');
          throw new Error('Error creating measurement: You do not have the right to create one');
        }
      }
      // We check if the experiment name exist
      const testexperiment = await session.run('MATCH (e:Experiment {Name: $ExperimentName}) RETURN e.CustomFields',{ExperimentName});
      if (testexperiment.records.length == 0) {
        session.close();
        console.error('Error creating measurement: The Experiment Name does not exist in the database');
        throw new Error('Error creating measurement: The Experiment Name does not exist in the database');
      }
      // We check if the subject ID exist
      const testsubject = await session.run('MATCH (s:Subject {ID: $SubjectID}) RETURN s',{SubjectID});
      if (testsubject.records.length == 0) {
        session.close();
        console.error('Error creating measurement: The Subject ID does not exist in the database');
        throw new Error('Error creating measurement: The Subject ID does not exist in the database');
      }

      // We check if the customfields keys given in the request are the same as in the experiment
      const record = testexperiment.records[0];
      let customfields = record.get('e.CustomFields');
      customfields = JSON.parse(customfields);
      const customfieldsKeys = Object.keys(customfields);
      const CustomFieldsKeys = Object.keys(CustomFields);
      const areKeysEqual = customfieldsKeys.length === CustomFieldsKeys.length && customfieldsKeys.every((key) => CustomFieldsKeys.includes(key));

      if (areKeysEqual) {
        let query = 'MATCH (s:Subject) WHERE s.ID = $ID CREATE (s)-[:CONDUCTS]->(m:Measurement {ID: $MeasurementID, DateTime: $DateTime, Location: $Location';
        let parameters = { ID: SubjectID, Name: ExperimentName, DateTime: DateTime, Location: Location, MeasurementID: MeasurementID };
        // We create new parameters for all customfields keys
        const customFieldsKeys = Object.keys(CustomFields);
        customFieldsKeys.forEach((key, index) => {
          const variableName = key.replace(/\s+/g, '');
          const parameterName = `CustomField${index}`;
          parameters[parameterName] = CustomFields[key];
          query += `, ${variableName}: $${parameterName}`;
        });
        
        if (maybeproperties.hasOwnProperty('PropertiesDate')) {
          const Date = maybeproperties.PropertiesDate;
          const testproperties = await session.run('MATCH (p:SubjectProperties)-[:STATE_ON]->(s:Subject) WHERE p.Date = $Date AND s.ID = $SubjectID RETURN s',{Date,SubjectID});
          if (testproperties.records.length == 0) {
            session.close();
            console.error('Error creating Measurement: The SubjectProperties given does not match with the subject ID given');
            throw new Error('Error creating Measurement: The SubjectProperties given does not match with the subject ID given');
          } else {
            query += '}) WITH m MATCH (e:Experiment {Name: $Name}) CREATE (e)-[:HAS]->(m) WITH m MATCH (p:SubjectProperties {Date: $Date}) CREATE (p)-[:CONDUCTS]->(m)';
            parameters.Date = Date;
          }
        } else {
          query += '}) WITH m MATCH (e:Experiment {Name: $Name}) CREATE (e)-[:HAS]->(m)';
        }

        await session.run(query,parameters);

        if (isValidUUID(PreviousID)) {
          await session.run('MATCH (m:Measurement {ID: $MeasurementID}),(p:Measurement {ID: $PreviousID}) CREATE (m)-[:CONTINUES]->(p)', {MeasurementID,PreviousID});
        }

        if (UserID) {
          await session.run('MATCH (u:User {ID: $UserID}),(m:Measurement {ID: $MeasurementID}) CREATE (u)-[:OWNS]->(m)', {UserID,MeasurementID})
        }
        
        const DevicesID = await session.run('MATCH (e:Experiment {Name: $ExperimentName})-[:USES]->(d:Device) RETURN d.ID AS deviceID', { ExperimentName });
        const deviceID = DevicesID.records[0].get('deviceID');

        const SensorID = await session.run('MATCH (e:Experiment {Name: $ExperimentName})-[:USES]->(Device)-[:INCLUDES]->(s:Sensor)-[:IS]->(st:SensorType) RETURN s.ID,st.Name', { ExperimentName });
        const sensorID = SensorID.records.map(record => ({
          Type: record.get('st.Name'),
          ID: record.get('s.ID')
        }));
        const instanceofSensorSignal = new SensorSignal();
        await instanceofSensorSignal.createSensorSignalGolf(Data,MeasurementID,DateTime,deviceID,sensorID);

        session.close();
        console.log('Measurement successfully created');
        return MeasurementID;
      } else {
        session.close();
        console.error('Error creating measurement: The keys of the Custom Fields given does not match the keys of the custom fields in the experiment given');
        throw new Error('Error creating measurement: The keys of the Custom Fields given does not match the keys of the custom fields in the experiment given');
      }
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getMeasurementByID(params) {
      const MeasurementID = params;

      const session = driver.session();
      
      // Find all the Measurements for a special ID
      try {
          const result = await session.run(`MATCH (m:Measurement {ID: $MeasurementID})-[:PRODUCES]->(sd:SensorSignal)
          WITH m, COLLECT(sd) AS sensorSignals
          MATCH (m)<-[:HAS]-(e:Experiment)
          WITH m, sensorSignals, e
          MATCH (m)<-[:CONDUCTS]-(s:Subject)
          RETURN m, sensorSignals, e.Name AS experimentName, s.Name AS subjectName`,{ MeasurementID });
          session.close();
      
          return result.records.map(record => {
            const measurement = {};
      
            const mProperties = record.get('m').properties;
            Object.assign(measurement, mProperties);
      
            // Include additional properties
            measurement["SubjectName"] = record.get("subjectName");
            measurement["ExperimentName"] = record.get("experimentName");
            measurement["SensorSignals"] = record.get("sensorSignals").map(signal => signal.properties.File_Name);
            return measurement;
          });
      } catch (error) {
        session.close();
        throw error;
      }
  }

  async getMeasurementByDateTime(params) {

    const DateTime = params;
    const session = driver.session();
    
    // Find all the Measurements for a special ID
    try {
        const result = await session.run(`MATCH (m:Measurement {DateTime: $DateTime})-[:PRODUCES]->(sd:SensorSignal)
        WITH m, COLLECT(sd) AS sensorSignals
        MATCH (m)<-[:HAS]-(e:Experiment)
        WITH m, sensorSignals, e
        MATCH (m)<-[:CONDUCTS]-(s:Subject)
        RETURN m, sensorSignals, e.Name AS experimentName, s.Name AS subjectName`,{ DateTime });
        session.close();
    
        return result.records.map(record => {
          const measurement = {};
    
          const mProperties = record.get('m').properties;
          Object.assign(measurement, mProperties);
    
          // Include additional properties
          measurement["SubjectName"] = record.get("subjectName");
          measurement["ExperimentName"] = record.get("experimentName");
          measurement["SensorSignals"] = record.get("sensorSignals").reduce((acc, signal, index) => {
            const filePath = signal.properties.File_ID;
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(fileContent);
            const key = signal.properties.File_Name.split("_")[5].split(".")[0];
            acc[key] = jsonData; // Assign the file content to the custom key in the accumulator object
            return acc;
          }, {});
          return measurement;
        });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getMeasurementWithSubjectID(params) {
    // Return all the Measurements corresponding to a subject using the subject ID
    const ID = params;
    const session = driver.session();
    try {
      const result = await session.run(`MATCH (s:Subject {ID: $ID})-[:CONDUCTS]->(m:Measurement)-[:PRODUCES]->(sd:SensorSignal)
      WITH m, COLLECT(sd) AS sensorSignals
      MATCH (m)<-[:HAS]-(e:Experiment)
      WITH m, sensorSignals, e
      MATCH (m)<-[:CONDUCTS]-(s:Subject)
      RETURN m, sensorSignals, e.Name AS experimentName, s.Name AS subjectName`, {ID});

      session.close();
      
      return result.records.map(record => {
        const measurement = {};
  
        const mProperties = record.get('m').properties;
        Object.assign(measurement, mProperties);
  
        // Include additional properties
        measurement["SubjectName"] = record.get("subjectName");
        measurement["ExperimentName"] = record.get("experimentName");
        measurement["SensorSignals"] = record.get("sensorSignals").map(signal => signal.properties.File_Name);
        return measurement; 
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getMeasurementWithExperimentName(params) {
    // Return all the Measurements corresponding to an experiment using the experiment name
    const name = params;
    const session = driver.session();
    try {
      const result = await session.run(`MATCH (e:Experiment {Name: $name})-[:HAS]->(m:Measurement)-[:PRODUCES]->(sd:SensorSignal)
      WITH m, COLLECT(sd) AS sensorSignals
      MATCH (m)<-[:CONDUCTS]-(s:Subject)
      RETURN m, sensorSignals, s.Name AS subjectName`, {name});
      session.close();
      
      return result.records.map(record => {
        const measurement = {};
  
        const mProperties = record.get('m').properties;
        Object.assign(measurement, mProperties);
  
        // Include additional properties
        measurement["SubjectName"] = record.get("subjectName");
        measurement["ExperimentName"] = name;
        measurement["SensorSignals"] = record.get("sensorSignals").map(signal => signal.properties.File_Name);
        return measurement; 
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getMeasurementWithExperimentNameAndSubjectID(ExperimentName,SubjectID) {
    // Return all the Measurements corresponding to an experiment using the experiment name
    const name = ExperimentName;
    const ID = SubjectID;
    const session = driver.session();
    try {
      const result = await session.run(`MATCH (e:Experiment {Name: $name})-[:HAS]->(m:Measurement)-[:PRODUCES]->(sd:SensorSignal)
      WITH m, COLLECT(sd) AS sensorSignals
      MATCH (m)<-[:CONDUCTS]-(s:Subject {ID: $ID})
      RETURN m, sensorSignals, s.Name AS subjectName`, {name,ID});
      session.close();
      
      return result.records.map(record => {
        const measurement = {};
  
        const mProperties = record.get('m').properties;
        Object.assign(measurement, mProperties);
  
        // Include additional properties
        measurement["SubjectName"] = record.get("subjectName");
        measurement["ExperimentName"] = name;
        measurement["SensorSignals"] = record.get("sensorSignals").map(signal => signal.properties.File_Name);
        return measurement; 
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getMeasurementDateTimeWithExperimentName(params) {
    const Name = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (e:Experiment {Name: $Name})-[:HAS]->(m:Measurement) RETURN DISTINCT m.DateTime',{Name});
      return result.records.map(record => {
        return {
          DateTime: record.get('m.DateTime'),
        }
      });
    }catch (error) {
      session.close();
      throw error;
    }
  }

  async getMeasurementDateTimeWithSubjectID(params) {
    const ID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (s:Subject {ID: $ID})-[:CONDUCTS]->(m:Measurement) RETURN DISTINCT m.DateTime',{ID});
      return result.records.map(record => {
        return {
          DateTime: record.get('m.DateTime'),
        }
      });
    }catch (error) {
      session.close();
      throw error;
    }
  }

  async getMeasurementWithSensorSignalID(params) {
    // Return all the Measurements corresponding to a SensorSignal using the sensorsignal ID
    const ID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (m:Measurement)-[:PRODUCES]->(s:SensorSignal) WHERE s.File_ID = $ID RETURN m', {ID});
      return result.records.map(record => {
        const measurement = {};
  
        record.keys.forEach(key => {
          measurement[key] = record.get(key);
        });
        return measurement.m.properties;
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getMeasurementCreatedbyUser(params) {
    const UserID = params;
    const session = driver.session();
    try {
      const result = await session.run(`MATCH (u:User {ID: $UserID})-[:OWNS]->(m:Measurement)-[:PRODUCES]->(sd:SensorSignal)
      WITH m, COLLECT(sd) AS sensorSignals
      MATCH (m)<-[:HAS]-(e:Experiment)
      WITH m, sensorSignals, e
      MATCH (m)<-[:CONDUCTS]-(s:Subject)
      RETURN m, sensorSignals, e.Name AS experimentName, s.Name AS subjectName`, {UserID});

      session.close();
      
      return result.records.map(record => {
        const measurement = {};
  
        const mProperties = record.get('m').properties;
        Object.assign(measurement, mProperties);
  
        // Include additional properties
        measurement["SubjectName"] = record.get("subjectName");
        measurement["ExperimentName"] = record.get("experimentName");
        measurement["SensorSignals"] = record.get("sensorSignals").map(signal => signal.properties.File_Name);
        return measurement; 
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }


}