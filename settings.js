const neo4jsettings = {
  uri: 'bolt://212.235.190.210:7687',
  user: 'neo4j',
  password: 'Gazda11Od22Lait33',
};

const saveData = 'Data';

module.exports = {
  neo4jsettings,
  saveData,
  getDriver: () => driver,
  closeDriver: () => driver.close(),
};