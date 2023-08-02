import { Injectable } from '@nestjs/common';
const settings = require('../../settings.js');
import {User} from './user';
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(settings.neo4jsettings.uri, neo4j.auth.basic(settings.neo4jsettings.user,settings.neo4jsettings.password));

@Injectable()
export class SubjectProperties {

  async getallProperties() {
    const session = driver.session();

    // Find all subject properties in the database and return them
    try {
      const result = await session.run('MATCH (p:SubjectProperties) RETURN p.Date,p.Height,p.Weight,p.Bodyfat,p.Sport,p.Result');
      session.close();
      return result.records.map(record => {
        return {
            Date: record.get('p.Date'),
            Height: record.get('p.Height'),
            Weight: record.get('p.Weight'),
            Bodyfat: record.get('p.Bodyfat'),
            Sport: record.get('p.Sport'),
            Result: record.get('p.Result')
          }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async createProperties(request,UserID) {

    const ID = request.body.ID;
    const Date = request.body.Date;
    const Height = request.body.Height;
    const Weight = request.body.Weight;
    const Bodyfat = request.body.Bodyfat;
    const Sport = request.body.Sport;
    const Result = request.body.Result;
 
    // Save the new subject properties in the database
    const session = driver.session();
    try {
      if (UserID) {
        const instanceofUser = new User();
        const Access = await instanceofUser.getUserAccessWithID(UserID);
        if (Access != "Admin" && Access != "User") {
          console.error('Error creating subject properties: You do not have the right to create one');
          throw new Error('Error creating subject properties: You do not have the right to create one');
        }
        const usertest = await session.run('MATCH (u:User)-[:CREATES]->(s:Subject {ID: $ID}) RETURN u.ID',{ID});
        const record = usertest.records[0];
        if (record != UserID) {
          console.error('Error creating subject properties: You did not create the subject given, so you cannot create properties for him');
          throw new Error('Error creating subject properties: You did not create the subject given, so you cannot create properties for him');
        }
      }
      const subjecttest = await session.run('MATCH (s:Subject {ID :$ID}) RETURN s',{ID});
      if (subjecttest.records.length == 0) {
        session.close();
        console.error('Error creating SubjectProperties: The Subject ID given does not exist in the database');
        throw new Error('Error creating SubjectProperties: The Subject ID given does not exist in the database');
      }
      await session.run(
        'MATCH (s:Subject) WHERE s.ID = $ID CREATE (p:SubjectProperties {Date: $Date, Height: $Height, Weight: $Weight, Bodyfat : $Bodyfat, Sport : $Sport, Result : $Result}) -[:STATE_ON]->(s)',
        { ID: ID, Date: Date, Height: Height, Weight : Weight, Bodyfat : Bodyfat, Sport : Sport, Result : Result }
      );
      if (UserID) {
        await session.run('MATCH (u:User {ID: $UserID})-[:CREATES]->(s:Subject {ID: $ID})<-[:STATE_ON]-(p:SubjectProperties {Date: $Date}) CREATE (u)-[:RIGHTS]->(e)', {UserID,ID,Date})
      }
      console.log("Properties successfully created");
    } catch (error) {
      session.close();
      throw error;
    }
  }
  
  async getPropertiesByDate(params) {

    const Date = params;

    const session = driver.session();
  
    // Find all the properties for a special date
    try {
      const result = await session.run('MATCH (p:SubjectProperties {Date: $Date}) RETURN p.Date,p.Height,p.Weight,p.Bodyfat,p.Sport,p.Result', { Date });
      session.close();
      return result.records.map(record => {
        return {
            Date: record.get('p.Date'),
            Height: record.get('p.Height'),
            Weight: record.get('p.Weight'),
            Bodyfat: record.get('p.Bodyfat'),
            Sport: record.get('p.Sport'),
            Result: record.get('p.Result')
          }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getPropertiesBySport(params) {

    const Sport = params;

    const session = driver.session();
  
    // Find all the properties for a special sport
    try {
      const result = await session.run('MATCH (p:SubjectProperties {Sport: $Sport}) RETURN p.Date,p.Height,p.Weight,p.Bodyfat,p.Sport,p.Result', { Sport });
      session.close();
      return result.records.map(record => {
        return {
            Date: record.get('p.Date'),
            Height: record.get('p.Height'),
            Weight: record.get('p.Weight'),
            Bodyfat: record.get('p.Bodyfat'),
            Sport: record.get('p.Sport'),
            Result: record.get('p.Result')
          }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getPropertiesWithSubjectID(params) {
    // Return all the properties corresponding to a subject using the subject ID
    const ID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (p:SubjectProperties)-[:STATE_ON]->(s:Subject) WHERE s.ID = $ID RETURN p.Date,p.Height,p.Weight,p.Bodyfat,p.Sport,p.Result', {ID});
      return result.records.map(record => {
        return {
          Date: record.get('p.Date'),
          Height: record.get('p.Height'),
          Weight: record.get('p.Weight'),
          Bodyfat: record.get('p.Bodyfat'),
          Sport: record.get('p.Sport'),
          Result: record.get('p.Result')
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getPropertiesWithMeasurementID(params) {
    // Return all the properties corresponding to a measurement using the measurement ID
    const MeasurementID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (p:SubjectProperties)-[:STATE_ON]->(Subject)-[:CONDUCTS]->(m:Measurement) WHERE m.ID = $MeasurementID RETURN p.Date,p.Height,p.Weight,p.Bodyfat,p.Sport,p.Result', {MeasurementID});
      return result.records.map(record => {
        return {
          Date: record.get('p.Date'),
          Height: record.get('p.Height'),
          Weight: record.get('p.Weight'),
          Bodyfat: record.get('p.Bodyfat'),
          Sport: record.get('p.Sport'),
          Result: record.get('p.Result')
        };
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }
}