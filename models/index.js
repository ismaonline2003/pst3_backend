
const databaseConfig = require("../config/database_config.js");
const Sequelize = require("sequelize");

const sequelizeInstance = new Sequelize(databaseConfig.DB, databaseConfig.USER, databaseConfig.PASSWORD, {
  host: databaseConfig.HOST,
  dialect: databaseConfig.dialect,
  operatorsAliases: false,

  pool: {
    max: databaseConfig.pool.max,
    min: databaseConfig.pool.min,
    acquire: databaseConfig.pool.acquire,
    idle: databaseConfig.pool.idle
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelizeInstance;
db.sequelize.addHook('beforeDestroy', async (record, options) => {
  let searchRecord = await options.model.findAll({include: {all: true}, where: {id: record.id}})
  if(searchRecord.length > 0) {
    if(searchRecord[0]._options.includeNames) {

      if(searchRecord[0]._options.includeNames.length > 0) {

        searchRecord[0]._options.includeNames.map((includeName) => {
          if(
              (Array.isArray(searchRecord[0].dataValues[includeName]) && searchRecord[0].dataValues[includeName].length > 0) ||
              (!Array.isArray(searchRecord[0].dataValues[includeName]) && searchRecord[0].dataValues[includeName])
            ) {
            console.log('No se puede eliminar este registro porque tiene otros registros asociados');
            throw ('No se puede eliminar este registro porque tiene otros registros asociados');
          }

        })

      }

    } 
  }
});
db.person = require("./person.js")(sequelizeInstance, Sequelize);
db.user = require("./user.js")(sequelizeInstance, Sequelize, db.person);
db.author = require("./author.js")(sequelizeInstance, Sequelize, db.person);
db.estudiante = require("./estudiante.js")(sequelizeInstance, Sequelize, db.person);
//foreing keys
module.exports = db;

