import { Injectable } from '@nestjs/common';
const settings = require('../../settings.js');
const { v4: uuid } = require('uuid');
import {User} from './user';
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(settings.neo4jsettings.uri, neo4j.auth.basic(settings.neo4jsettings.user,settings.neo4jsettings.password));

@Injectable()
export class Subject {

  async getallSubjects() {
    const session = driver.session();

    // Find all subjects in the database and return them
    try {
    const result = await session.run('MATCH (s:Subject) RETURN s.ID,s.Name,s.BirthDate,s.BirthPlace,s.Gender,s.Country ORDER BY s.Name');
    session.close();
    return result.records.map(record => {
      return {
          ID: record.get('s.ID'),
          Name: record.get('s.Name'),
          BirthDate: record.get('s.BirthDate'),
          BirthPlace: record.get('s.BirthPlace'),
          Gender: record.get('s.Gender'),
          Country: record.get('s.Country')
        }
    });
    } catch (error) {
    session.close();
    throw error;
    }
  }

  async showSubjectsNames() {
    // Show all the names of the existing subjects

    const session = driver.session();
    try {
      const result = await session.run('MATCH (s:Subject) RETURN s.Name');
      return result.records.map(record => {
        return {
          Name: record.get('s.Name'),
        }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async createSubject(request,UserID) {

    // Create a new subject in the database
    const ID = uuid();

    const Name = request.body.Name;
    const BirthDate = request.body.BirthDate;
    const BirthPlace = request.body.BirthPlace;
    const Gender = request.body.Gender;
    const Country = request.body.Country;

    const session = driver.session();
    try {
      if (UserID) {
        const instanceofUser = new User();
        const Access = await instanceofUser.getUserAccessWithID(UserID);
        if (Access != "Admin" && Access != "User") {
          console.error('Error creating subject: You do not have the right to create one');
          throw new Error('Error creating subject: You do not have the right to create one');
        }
      }
      await session.run(
        'CREATE (s:Subject {ID: $ID, Name: $Name, BirthDate: $BirthDate, BirthPlace: $BirthPlace, Gender: $Gender, Country: $Country}) RETURN s',
        {
          ID: ID,
          Name: Name,
          BirthDate: BirthDate,
          BirthPlace: BirthPlace,
          Gender: Gender,
          Country: Country,
        }
      );
      if (UserID) {
        await session.run('MATCH (u:User {ID: $UserID}),(s:Subject {ID: $ID}) CREATE (u)-[:CREATES]->(s)', {UserID,ID})
      }
      console.log('Subject successfully created');
    } catch (error) {
      session.close();
      throw error;
    }
  }
  
  async modifySubjectByID(params, request) {
    // Change the informations about a subject while finding him with his ID
    const ID = params;
    const Name = request.body.Name;
    const BirthDate = request.body.BirthDate;
    const BirthPlace = request.body.BirthPlace;
    const Gender = request.body.Gender;
    const Country = request.body.Country;

    const session = driver.session();

    const IDtest = await session.run('MATCH (s:Subject {ID :$ID}) RETURN s',{ID});
      if (IDtest.records.length == 0) {
        session.close();
        console.error('Error modifying subject: The Subject ID given does not exist in the database');
        throw new Error('Error modifying subject: The Subject ID given does not exist in the database');
      }

    try {
      const result = await session.run(
        'MATCH (s:Subject {ID: $ID}) SET s.Name = $Name, s.BirthDate = $BirthDate, s.BirthPlace = $BirthPlace, s.Gender = $Gender, s.Country = $Country RETURN s.ID,s.Name,s.BirthDate,s.BirthPlace,s.Gender,s.Country',
        { ID, Name, BirthDate, BirthPlace, Gender, Country }
      );
  
      return result.records.map(record => {
        return {
            ID: record.get('s.ID'),
            Name: record.get('s.Name'),
            BirthDate: record.get('s.BirthDate'),
            BirthPlace: record.get('s.BirthPlace'),
            Gender: record.get('s.Gender'),
            Country: record.get('s.Country')
          }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }
  
  async findSubjectByID(params) {
    // Find a subject with his ID and return him

    const ID = params;
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (s:Subject {ID: $ID}) RETURN s.ID,s.Name,s.BirthDate,s.BirthPlace,s.Gender,s.Country',
        { ID }
      );
  
      return result.records.map(record => {
        return {
            ID: record.get('s.ID'),
            Name: record.get('s.Name'),
            BirthDate: record.get('s.BirthDate'),
            BirthPlace: record.get('s.BirthPlace'),
            Gender: record.get('s.Gender'),
            Country: record.get('s.Country')
          }
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async findSubjectsByName(params) {
    // Find subjects with Names approximately matching the provided Name and return suggestions
    if (params.trim() == '' || !params) {
      return []; // Return an empty array if params is empty or falsy
    }
  
    const Name = params;
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (s:Subject) WHERE toLower(s.Name) CONTAINS toLower($Name) RETURN s.ID, s.Name, s.BirthDate, s.BirthPlace, s.Gender, s.Country',
        { Name }
      );
  
      return result.records.map(record => {
        return {
          ID: record.get('s.ID'),
          Name: record.get('s.Name'),
          BirthDate: record.get('s.BirthDate'),
          BirthPlace: record.get('s.BirthPlace'),
          Gender: record.get('s.Gender'),
          Country: record.get('s.Country')
        };
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getSubjectCreatedbyUser(params) {
    // Return all the subjects corresponding to a Measurement using the measurement ID
    const UserID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (u:User)-[:CREATES]->(s:Subject) WHERE u.ID = $UserID RETURN s.ID, s.Name, s.BirthDate, s.BirthPlace, s.Gender, s.Country', {UserID});
      return result.records.map(record => {
        return {
          ID: record.get('s.ID'),
          Name: record.get('s.Name'),
          BirthDate: record.get('s.BirthDate'),
          BirthPlace: record.get('s.BirthPlace'),
          Gender: record.get('s.Gender'),
          Country: record.get('s.Country')
        };
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }


  async getSubjectWithMeasurementID(params) {
    // Return all the subjects corresponding to a Measurement using the measurement ID
    const MeasurementID = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (s:Subject)-[:CONDUCTS]->(m:Measurement) WHERE m.ID = $MeasurementID RETURN s.ID, s.Name, s.BirthDate, s.BirthPlace, s.Gender, s.Country', {MeasurementID});
      return result.records.map(record => {
        return {
          ID: record.get('s.ID'),
          Name: record.get('s.Name'),
          BirthDate: record.get('s.BirthDate'),
          BirthPlace: record.get('s.BirthPlace'),
          Gender: record.get('s.Gender'),
          Country: record.get('s.Country')
        };
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }

  async getSubjectWithExperimentName(params) {
    // Return all the subjects corresponding to an Experiment using the experiment name
    const ExperimentName = params;
    const session = driver.session();
    try {
      const result = await session.run('MATCH (s:Subject)-[:CONDUCTS]->(m:Measurement)<-[:HAS]-(e:Experiment) WHERE e.Name = $ExperimentName RETURN s.ID, s.Name, s.BirthDate, s.BirthPlace, s.Gender, s.Country', {ExperimentName});
      return result.records.map(record => {
        return {
          ID: record.get('s.ID'),
          Name: record.get('s.Name'),
          BirthDate: record.get('s.BirthDate'),
          BirthPlace: record.get('s.BirthPlace'),
          Gender: record.get('s.Gender'),
          Country: record.get('s.Country')
        };
      });
    } catch (error) {
      session.close();
      throw error;
    }
  }
}