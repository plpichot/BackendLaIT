import { Injectable } from '@nestjs/common';
const settings = require('../../settings.js');
const fs = require('fs');
const path = require('path');
import {User} from './user';
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(settings.neo4jsettings.uri, neo4j.auth.basic(settings.neo4jsettings.user,settings.neo4jsettings.password));

@Injectable()
export class Activity {

  async getallActivities() {
    const session = driver.session();

    // Find all Activities in the database and return them
    try {
    const result = await session.run('MATCH (a:Activity) RETURN a.Name,a.Description');
    session.close();
    return result.records.map(record => {
      return {
          Name: record.get('a.Name'),
          Description: record.get('a.Description')
        }
    });
    } catch (error) {
    session.close();
    throw error;
    }
  }

  async createActivity(request,UserID) {

    // Create a new Activity in the database

    const Name = request.body.Name;
    const Description= request.body.Description;
    const session = driver.session();
  
    try {
      if (UserID) {
        const instanceofUser = new User();
        const Access = await instanceofUser.getUserAccessWithID(UserID);
        if (Access != "Admin") {
          console.error('Error creating activity: You do not have the right to create one');
          throw new Error('Error creating activity: You do not have the right to create one');
        }
      }

      const testactivity = await session.run('MATCH (a:Activity {Name :$Name}) RETURN a',{Name});
      if (testactivity.records.length != 0) {
        session.close();
        console.error('Error creating activity: The Name given already exists in the database and it should be unique');
        throw ('Error creating activity: The Name given already exists in the database and it should be unique');
      }
      const folderPath = path.join(settings.saveData, Name);
      fs.mkdirSync(folderPath);

      await session.run(
        'CREATE (a:Activity {Name: $Name, Description: $Description}) RETURN a',
        {
          Name: Name,
          Description: Description,
        }
      );

      console.log('Activity successfully created');
    } catch (error) {
      session.close();
      throw error;
    }
  }
  
  async findActivityByName(params) {
    // Find an Activity with its name and return it

    const Name = params;
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (a:Activity {Name: $Name}) RETURN a.Name,a.Description',
        { Name }
      );
  
      return result.records.map(record => {
        return {
            Name: record.get('a.Name'),
            Description: record.get('a.Description')
          }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getActivityWithExperimentName(params) {
    // Return all the Acitivities corresponding to an experiment using the experiment name
    const name = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (e:Experiment)-[:IS]->(a:Activity) WHERE e.Name = $name RETURN a.Name,a.Description', {name});
      return result.records.map(record => {
        return {
          Name: record.get('a.Name'),
          Description: record.get('a.Description')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getActivityNameWithMeasurementID(params) {
    // Return all the Acitivities corresponding to a measurement using the measurement ID
    const MeasurementID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (m:Measurement)<-[:HAS]-(e:Experiment)-[:IS]->(a:Activity) WHERE m.ID = $MeasurementID RETURN a.Name,a.Description', {MeasurementID});
      return result.records.map(record => {
        return {
          Name: record.get('a.Name'),
          Description: record.get('a.Description')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getActivityWithSubjectID(params) {
    // Return all the Acitivities corresponding to a subject using the subject ID
    const SubjectID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (s:Subject)-[:CONDUCTS]->(Measurement)<-[:HAS]-(Experiment)-[:IS]->(a:Activity) WHERE s.ID = $SubjectID RETURN a.Name,a.Description', {SubjectID});
      return result.records.map(record => {
        return {
          Name: record.get('a.Name'),
          Description: record.get('a.Description')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

}