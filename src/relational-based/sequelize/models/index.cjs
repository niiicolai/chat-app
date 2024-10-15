'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// Use the database.json file to get the database configuration
const config = require(__dirname + '/../config/app.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-4) === '.cjs' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const f = require(path.join(__dirname, file));
    if (typeof f !== 'function') {
      return;
    }
    const model = f(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

sequelize
  .authenticate()
  .then(() => {
    console.log('INFO: Connected to MySQL');
  })
  .catch(err => {
    console.error('ERROR: Unable to connect to the MySQL database:', err);
  });

module.exports = db;