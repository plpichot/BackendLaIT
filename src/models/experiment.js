import { Injectable } from '@nestjs/common';
const settings = require('../../settings.js');
const { v4: uuid } = require('uuid');
import {User} from './user';
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(settings.neo4jsettings.uri, neo4j.auth.basic(settings.neo4jsettings.user,settings.neo4jsettings.password));

@Injectable()
export class Experiment {

  async getallExperiments() {
    const session = driver.session();

    // Find all Experiments in the database and return them
    try {
    const result = await session.run(
    'MATCH (e:Experiment)-[:USES]->(d:Device)-[:INCLUDES]->(s:Sensor)-[:IS]->(st:SensorType) ' +
    'WITH DISTINCT e, d, s, st ' +
    'WITH e, d, COLLECT({ Type: st.Name, ID: s.ID, BitDepth: s.BitDepth, Range: s.Range}) AS sensors ' +
    'MATCH (dt:DeviceType)<-[:IS]-(d:Device) ' +
    'WITH e, COLLECT ({ Type: dt.Name, ID: d.ID, Description: d.Description, SampleTime: d.SampleTime, Sensors: sensors}) AS device ' +
    'MATCH (a:Activity)<-[:IS]-(e:Experiment) ' +
    'RETURN {ActivityName: a.Name, ExperimentName: e.Name, Instructions: e.Instructions, CustomFields: e.CustomFields, Devices: device} AS experiment');
    session.close();
    const experiments = result.records.map(record => {
      const experiment = record.get('experiment');
      experiment.CustomFields = JSON.parse(experiment.CustomFields);
      return experiment;
    });
    return experiments;
    } catch (error) {
    session.close();
    throw error;
    }
  }

  async createExperiment(request,UserID) {

    // Create a new Experiment in the database
    const ActivityName = request.body.ActivityName;
    const Name = request.body.Name;
    const CustomFields = JSON.stringify(request.body.CustomFields);
    const Instructions = request.body.Instructions;
    const session = driver.session();

    try {
      if (UserID) {
        const instanceofUser = new User();
        const Access = await instanceofUser.getUserAccessWithID(UserID);
        if (Access != "Admin" && Access != "User") {
          console.error('Error creating experiment: You do not have the right to create one');
          throw new Error('Error creating experiment: You do not have the right to create one');
        }
      }

      const testexperiment = await session.run('MATCH (e:Experiment {Name :$Name}) RETURN e',{Name});
      if (testexperiment.records.length != 0) {
        session.close();
        console.error('Error creating experiment: The Name given already exists in the database and it should be unique');
        throw new Error('Error creating experiment: The Name given already exists in the database and it should be unique');
      }
      const activitytest = await session.run('MATCH (e:Experiment {Name :$Name}) RETURN e',{Name});
      if (activitytest.records.length == 0) {
        session.close();
        console.error('Error creating experiment: The Activity Name given does not exist in the database');
        throw new Error('Error creating experiment: The Activity Name given does not exist in the database');
      }

      await session.run(
        'MATCH (a:Activity) WHERE a.Name = $ActivityName CREATE (e:Experiment {Name: $Name, CustomFields: $CustomFields, Instructions: $Instructions})-[:IS]-> (a)',
        {
          ActivityName: ActivityName,
          Name: Name,
          CustomFields: CustomFields,
          Instructions: Instructions
        }
      );

      if (UserID) {
        await session.run('MATCH (u:User {ID: $UserID}),(e:Experiment {Name: $Name}) CREATE (u)-[:RIGHTS]->(e)', {UserID,Name})
      }

      console.log('Experiment successfully created');
    } catch (error) {
      session.close();
      throw error;
    }
  }
  
  async modifyExperimentByName(params, request) {
    // Change the informations about a Experiment while finding it with its name
    const ExperimentName = params;
    const updates = request.body;
    const CustomFields = JSON.stringify(updates.CustomFields);
    const Instructions = updates.Instructions;
    const session = driver.session();

    try {
      if (updates.hasOwnProperty('NewActivityName')) {
        const NewActivityName = updates.NewActivityName;
        const activity = await session.run(
          'MATCH (a:Activity {Name : $NewActivityName}) RETURN a',
          {NewActivityName}
        );
        if (activity.records.length != 0) {
          await session.run(
            'MATCH (e:Experiment {Name: $ExperimentName})-[r:IS]->(Activity) DELETE r',
            {ExperimentName}
          );
          await session.run(
            'CREATE (e:Experiment {Name: $ExperimentName})-[:IS]->(a:Activity {Name : $NewActivityName})',
            {ExperimentName, NewActivityName}
          );
        } else {
          console.error('Error modifying experiment: The new activity does not exist in the database');
          throw new Error('Error modifying experiment: The new activity does not exist in the database');
        }
      }

      if (updates.hasOwnProperty('NewExperimentName')) {
        const newExperimentName = updates.NewExperimentName;
        // Query to check if the new name already exists in the database
        const checkQuery = await session.run('MATCH (e:Experiment {Name: $newExperimentName}) RETURN e',{ newExperimentName });
        if (checkQuery.records.length != 0) {
          session.close();
          console.error('Error modifying experiment: The new name given already exists in the database and it should be unique');
          throw new Error('Error modifying experiment: The new name given already exists in the database and it should be unique');
        }
        await session.run(
          'MATCH (e:Experiment {Name: $ExperimentName}) SET e.CustomFields = $CustomFields, e.Instructions = $Instructions, e.Name = $newExperimentName RETURN e.Name,e.CustomFields,e.Instructions',
          {ExperimentName, CustomFields, Instructions, newExperimentName}
        );
        console.log('Experiment successfully edited.');
      } else {
        await session.run(
          'MATCH (e:Experiment {Name: $ExperimentName}) SET e.CustomFields = $CustomFields, e.Instructions = $Instructions RETURN e.Name,e.CustomFields,e.Instructions',
          {ExperimentName, CustomFields, Instructions}
        );
        console.log('Experiment successfully edited.');
      }
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async editExperimentbyName(params,request) {
    const ExperimentName = params;
    const CustomFields = JSON.stringify(request.body.CustomFields);
    const Instructions = request.body.Instructions;

    const session = driver.session();
    try {
      await session.run(
        'MATCH (e:Experiment {Name: $ExperimentName}) SET e.CustomFields = $CustomFields, e.Instructions = $Instructions RETURN e.Name,e.CustomFields,e.Instructions',
        {ExperimentName, CustomFields, Instructions});
      console.log('Experiment successfully edited.');
    } catch (error) {
      session.close();
      throw error;
    }
  }
  
  async findExperimentByName(params) {
    // Find an Experiment with its name
  
    const Name = params;
    const session = driver.session();

    // Find all Experiments in the database and return them
    try {
    const result = await session.run(
    'MATCH (e:Experiment {Name :$Name})-[:USES]->(d:Device)-[:INCLUDES]->(s:Sensor)-[:IS]->(st:SensorType) ' +
    'WITH DISTINCT e, d, s, st ' +
    'WITH e, d, COLLECT({ Type: st.Name, ID: s.ID, BitDepth: s.BitDepth, Range: s.Range}) AS sensors ' +
    'MATCH (dt:DeviceType)<-[:IS]-(d:Device) ' +
    'WITH e, COLLECT ({ Type: dt.Name, ID: d.ID, Description: d.Description, SampleTime: d.SampleTime, Sensors: sensors}) AS device ' +
    'MATCH (a:Activity)<-[:IS]-(e:Experiment) ' +
    'RETURN {ActivityName: a.Name, ExperimentName: e.Name, Instructions: e.Instructions, CustomFields: e.CustomFields, Devices: device} AS experiment',{Name});
    session.close();
    const experiments = result.records.map(record => {
      const experiment = record.get('experiment');
      experiment.CustomFields = JSON.parse(experiment.CustomFields); // Parse the CustomFields property
      return experiment;
    });
    return experiments;
    } catch (error) {
    session.close();
    throw error;
    }
  }

  async showExperimentsNames() {
    // Return all the names of the existing experiments
    const session = driver.session();

    try {
      const result = await session.run('MATCH (e:Experiment) RETURN e.Name');
      return result.records.map(record => {
        return {
          Name: record.get('e.Name'),
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getExperimentCreatedbyUser(params) {
    // Find an Experiment with its name
  
    const UserID = params;
    const session = driver.session();

    // Find all Experiments in the database and return them
    try {
    const result = await session.run(
    'MATCH (u:User {ID: $UserID})-[:RIGHTS]->(e:Experiment)-[:USES]->(d:Device)-[:INCLUDES]->(s:Sensor)-[:IS]->(st:SensorType) ' +
    'WITH DISTINCT e, d, s, st ' +
    'WITH e, d, COLLECT({ Type: st.Name, ID: s.ID, BitDepth: s.BitDepth, Range: s.Range}) AS sensors ' +
    'MATCH (dt:DeviceType)<-[:IS]-(d:Device) ' +
    'WITH e, COLLECT ({ Type: dt.Name, ID: d.ID, Description: d.Description, SampleTime: d.SampleTime, Sensors: sensors}) AS device ' +
    'MATCH (a:Activity)<-[:IS]-(e:Experiment) ' +
    'RETURN {ActivityName: a.Name, ExperimentName: e.Name, Instructions: e.Instructions, CustomFields: e.CustomFields, Devices: device} AS experiment',{UserID});
    session.close();
    const experiments = result.records.map(record => {
      const experiment = record.get('experiment');
      experiment.CustomFields = JSON.parse(experiment.CustomFields); // Parse the CustomFields property
      return experiment;
    });
    return experiments;
    } catch (error) {
    session.close();
    throw error;
    }
  }
  
  async getExperimentWithActivityName(params) {
    // Return all the experiments corresponding to an activity using the activity name
    const name = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (e:Experiment)-[:IS]->(a:Activity) WHERE a.Name = $name RETURN e.Name,e.CustomFields,e.Instructions', {name});
      return result.records.map(record => {
        return {
          Name: record.get('e.Name'),
          CustomFields: record.get('e.CustomFields'),
          Instructions: record.get('e.Instructions')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getExperimentWithMeasurementID(params) {
    // Return all the experiments corresponding to a Measurement using the measurement ID
    const MeasurementID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (e:Experiment)-[:HAS]->(m:Measurement) WHERE m.ID = $MeasurementID RETURN e.Name,e.CustomFields,e.Instructions', {MeasurementID});
      return result.records.map(record => {
        return {
          Name: record.get('e.Name'),
          CustomFields: record.get('e.CustomFields'),
          Instructions: record.get('e.Instructions')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getExperimentWithSubjectID(params) {
    // Return all the experiments corresponding to a subject using the subject ID
    const SubjectID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (s:Subject)-[:CONDUCTS]->(m:Measurement)<-[:HAS]-(e:Experiment) WHERE s.ID = $SubjectID RETURN e.Name,e.CustomFields,e.Instructions', {SubjectID});
      return result.records.map(record => {
        return {
          Name: record.get('e.Name'),
          CustomFields: record.get('e.CustomFields'),
          Instructions: record.get('e.Instructions')
        };
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getExperimentWithDeviceID(params) {
    // Return all the experiments corresponding to a Device using the Device ID
    const DeviceID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (d:Device)<-[:USES]-(e:Experiment) WHERE d.ID = $DeviceID RETURN e.Name,e.CustomFields,e.Instructions', {DeviceID});
      return result.records.map(record => {
        return {
          Name: record.get('e.Name'),
          CustomFields: record.get('e.CustomFields'),
          Instructions: record.get('e.Instructions')
        };
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getExperimentWithSensorID(params) {
    // Return all the experiments corresponding to a Sensor using the Sensor ID
    const SensorID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (s:Sensor)<-[:INCLUDES]-(Device)<-[:USES]-(e:Experiment) WHERE s.ID = $SensorID RETURN e.Name,e.CustomFields,e.Instructions', {SensorID});
      return result.records.map(record => {
        return {
          Name: record.get('e.Name'),
          CustomFields: record.get('e.CustomFields'),
          Instructions: record.get('e.Instructions')
        };
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async createExperimentDevicesAndSensors(request,UserID) {
    const query = 
      `MATCH (a:Activity {Name: $ActivityName})
      CREATE (e:Experiment {Name: $ExperimentName, Instructions: $Instructions, CustomFields: $CustomFields})-[:IS]->(a)
      FOREACH (deviceData IN $devicesData |
        MATCH (t:DeviceType {Name: deviceData.Type})
        MERGE (d:Device {ID: deviceData.ID})-[:IS]->(t)
        ON CREATE SET d.Description = deviceData.Description, d.SampleTime = deviceData.SampleTime
        CREATE (e)-[:USES]->(d)
        FOREACH (sensorData IN deviceData.sensors |
          MATCH (st:SensorType {Name: sensorData.Type})
          MERGE (d)-[:INCLUDES]->(s:Sensor {ID: sensorData.ID})-[:IS]->(st)
          ON CREATE SET s.BitDepth = sensorData.BitDepth, s.Range = sensorData.Range
        )
      )`;
  
    const params = {
      ActivityName: request.body.ActivityName,
      ExperimentName: request.body.ExperimentName,
      Instructions: request.body.Instructions,
      CustomFields: JSON.stringify(request.body.CustomFields),
      devicesData: request.body.devices
    };

    const session = driver.session();

    try {

      if (UserID) {
        const instanceofUser = new User();
        const Access = await instanceofUser.getUserAccessWithID(UserID);
        if (Access != "Admin" && Access != "User") {
          console.error('Error creating experiment: You do not have the right to create one');
          throw new Error('Error creating experiment: You do not have the right to create one');
        }
      }

      const ActivityName = params.ActivityName;
      const testactivity = await session.run('MATCH (a:Activity {Name :$ActivityName}) RETURN a',{ActivityName});
      if (testactivity.records.length == 0) {
        session.close();
        console.error('Error creating experiment, devices, and sensors: The Name given for the activity does not exist in the database');
        throw new Error('Error creating experiment, devices, and sensors: The Name given for the activity does not exist in the database');
      }

      const ExperimentName = params.ExperimentName;
      const testexperiment = await session.run('MATCH (e:Experiment {Name :$ExperimentName}) RETURN e',{ExperimentName});
      if (testexperiment.records.length != 0) {
        session.close();
        console.error('Error creating experiment, devices, and sensors: The Name given for the experiment already exists in the database and it should be unique');
        throw new Error('Error creating experiment, devices, and sensors: The Name given for the experiment already exists in the database and it should be unique');
      }

      for (const deviceData of params.devicesData) {
        const DeviceID = deviceData.ID;
        const DeviceType = deviceData.Type;
        const devicetypetest = await session.run('MATCH (dt:DeviceType {Name :$DeviceType}) RETURN dt',{DeviceType});
        if (devicetypetest.records.length == 0) {
          session.close();
          console.error('Error creating experiment, devices, and sensors: The DeviceType Name given does not exist in the database');
          throw new Error('Error creating experiment, devices, and sensors: The DeviceType Name given does not exist in the database');
        }
        if (DeviceID === "") {
          deviceData.ID = uuid();
        } else {
          const testdevice = await session.run('MATCH (d:Device {ID :$DeviceID}) RETURN d',{DeviceID});
          if (testdevice.records.length == 0) {
            session.close();
            console.error('Error creating experiment, devices, and sensors: The ID given for the device does not exist in the database');
            throw new Error('Error creating experiment, devices, and sensors: The ID given for the device does not exist in the database');
          }
        }
        for (const sensorData of deviceData.sensors) {
          const SensorID = sensorData.ID;
          const SensorType = sensorData.Type;
          const sensortypetest = await session.run('MATCH (st:SensorType {Name :$SensorType}) RETURN st',{SensorType});
          if (sensortypetest.records.length == 0) {
            session.close();
            console.error('Error creating experiment, devices, and sensors: The SensorType Name given does not exist in the database');
            throw new Error('Error creating experiment, devices, and sensors: The SensorType Name given does not exist in the database');
          }
          if (SensorID === "") {
            sensorData.ID = uuid();
          } else {
            const testsensor = await session.run('MATCH (s:Sensor {ID :$SensorID}) RETURN s',{SensorID});
            if (testsensor.records.length == 0) {
              session.close();
              console.error('Error creating experiment, devices, and sensors: The ID given for the sensor does not exist in the database');
              throw new Error('Error creating experiment, devices, and sensors: The ID given for the sensor does not exist in the database');
            }
          }
        }
      }
      await session.run(query, params);
      if (UserID) {
        await session.run('MATCH (u:User {ID: $UserID}),(e:Experiment {Name: $ExperimentName}) CREATE (u)-[:RIGHTS]->(e)', {UserID,ExperimentName})
      }
      console.log('Experiment, devices, and sensors created successfully.');
    } catch (error) {
      console.error('Error creating experiment, devices, and sensors:', error);
      throw error;
    } finally {
      session.close();
    }
  }
}