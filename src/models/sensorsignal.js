import { Injectable } from '@nestjs/common';
const settings = require('../../settings.js');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const crypto = require('crypto');

const neo4j = require('neo4j-driver');

const driver = neo4j.driver(settings.neo4jsettings.uri, neo4j.auth.basic(settings.neo4jsettings.user,settings.neo4jsettings.password));

@Injectable()
export class SensorSignal {

  async getallSensorSignalsName() {
    const session = driver.session();

    // Find all SensorSignal in the database and return them
    try {
      const result = await session.run('MATCH (s:SensorSignal) RETURN s.File_Name');
      session.close();
      return result.records.map(record => {
        return {
          File_Name: record.get('s.File_Name'),
          }
      });
    } catch (error){
      session.close();
      throw error;
    }
  }

  async getFilewithFileName(File_Name) {
    const session = driver.session();
    try {
      const result = await session.run('MATCH (s:SensorSignal {File_Name: $File_Name}) RETURN s.File_ID',{File_Name});
      const File_ID = result.records[0].get('s.File_ID');
      const fileContent = await readFileAsync(File_ID, 'utf8');
      const jsonData = JSON.parse(fileContent);
      return jsonData;
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async createSensorSignalGolf(Data,MeasurementID,DateTime,DeviceID,SensorID) {
    // Create a new SensorSignal in the database
  
    const session = driver.session();

    try {

      const activityname = await session.run("MATCH (m:Measurement {ID: $MeasurementID})<-[:HAS]-(e: Experiment) WITH e MATCH (e)-[:IS]->(a: Activity) RETURN a.Name", {MeasurementID}); 
      const ActivityName = activityname.records[0].get("a.Name");

      const Properties = ['Buffer','SampleNumber1','SampleNumber2','Time1','Time2'];
      for (const Sensor of SensorID) {
        const name = Sensor.Type;
        const datafield = await session.run("MATCH (st:SensorType {Name: $name}) RETURN st.DataField", {name}); 
        const DataField = datafield.records[0].get("st.DataField");
        const Signals = [];

        for (const item of Data) {
          const SignalData = {};
          for (const property of Properties) {
            if (property === "Buffer") {
              SignalData[property] = item["BufferIX"];
            } else if (property === "SampleNumber1") {
              SignalData[property] = item["SampleNumber"];
            } else if (property === "SampleNumber2") {
              SignalData[property] = item["SampleNumber2"] || null;
            } else if (property === "Time1") {
              SignalData[property] = item["uCTime"];
            } else if (property === "Time2") {
              SignalData[property] = item["uCTime2"] || null;
            }
          }
          for (const data of DataField) {
            SignalData[data] = item[data];
          }
          Signals.push(SignalData);
        }
        const filename = await this.writeDatainFile(MeasurementID,DateTime,name,Signals);
        const filePath = path.join(settings.saveData, ActivityName, filename);
        await this.linkSensorSignalInDataBase(Sensor.ID,filePath,filename,DeviceID,MeasurementID); 
      }
      console.log('SensorSignal successfully created');
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async writeDatainFile(MeasurementID,DateTime,SensorTypeName,Data) {
    const session = driver.session();
    try {
      // Generate the file path
      const activityname = await session.run("MATCH (m:Measurement {ID: $MeasurementID})<-[:HAS]-(e: Experiment) WITH e MATCH (e)-[:IS]->(a: Activity) RETURN a.Name", {MeasurementID}); 
      const ActivityName = activityname.records[0].get("a.Name");
      const hash = crypto.createHash('md5');
      hash.update(JSON.stringify(Data));
      const md5Hash = hash.digest('hex');
      const filename = `${DateTime}_${md5Hash}_${SensorTypeName}.json`;
      const filePath = path.join(settings.saveData, ActivityName, filename);

      fs.writeFile(filePath, JSON.stringify(Data), 'utf8', (err) => {
        if (err) {
          console.error(`Error saving ${filename}:`, err);
        } else {
          console.log(`${filename} saved successfully.`);
        }
      });
      return filename;
    } catch (error) {
      throw error;
    }
  }

  async linkSensorSignalInDataBase(SensorID,FilePath,FileName,DeviceID,MeasurementID) {
    const session = driver.session();
    try {
      await session.run(
        'MATCH (n:Sensor) WHERE n.ID = $SensorID CREATE (n)-[:PRODUCES]->(s:SensorSignal {File_ID: $FilePath, File_Name: $FileName}) WITH s MATCH (m:Measurement {ID: $MeasurementID}) CREATE (m)-[:PRODUCES]->(s) WITH s MATCH (d:Device {ID: $DeviceID}) CREATE (d)-[:PRODUCES]->(s)',
        {SensorID,FilePath,FileName,DeviceID,MeasurementID});
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getSensorSignalWithSensorID(params) {
    // Return all the SensorSignals corresponding to a Sensor using the sensor ID
    const SensorID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (se:Sensor)-[:PRODUCES]->(s:SensorSignal) WHERE se.ID = $SensorID RETURN s.File_Name', {SensorID});
      return result.records.map(record => {
        return {
          File_Name: record.get('s.File_Name'),
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getSensorSignalWithDeviceID(params) {
    // Return all the SensorSignals corresponding to a Device using the device ID
    const DeviceID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (d:Device)-[:PRODUCES]->(s:SensorSignal) WHERE d.ID = $DeviceID RETURN s.File_Name', {DeviceID});
      return result.records.map(record => {
        return {
          File_Name: record.get('s.File_Name'),
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getSensorSignalWithMeasurementID(params) {
    // Return all the SensorSignals corresponding to a Measurement using the measurement ID
    const MeasurementID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (m:Measurement)-[:PRODUCES]->(s:SensorSignal) WHERE m.ID = $MeasurementID RETURN s.File_Name', {MeasurementID});
      return result.records.map(record => {
        return {
            File_Name: record.get('s.File_Name'),
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }
}