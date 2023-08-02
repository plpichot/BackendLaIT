const neo4j = require('neo4j-driver');

const neo4jsettings = {
  uri: 'neo4j://localhost:7687',
  user: 'neo4j',
  password: 'password',
};

const saveData = '/Users/plpichot/Desktop/backend/Data';

module.exports = {
  neo4jsettings,
  saveData,
  getDriver: () => driver,
  closeDriver: () => driver.close(),
};