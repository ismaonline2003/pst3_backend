
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
/*
db.sequelize.addHook('beforeDestroy', async (record, options) => {
  //busca las relaciones con otras tablas y verifica si tiene registros relacionados
  //en caso de tenerlos, no deja eliminarlos
  let searchRecord = await options.model.findAll({include: {all: true}, where: {id: record.id}})
  if(searchRecord.length > 0) {
    //console.log(searchRecord[0]._options.includeMap);
    if(searchRecord[0]._options.includeNames) {
      if(searchRecord[0]._options.includeNames.length > 0) {

        searchRecord[0]._options.includeNames.map((includeName) => {
          console.log(searchRecord[0]._options.includeMap[includeName]);
          console.log('includeName', searchRecord[0]._options.includeMap[includeName].parent.model == options.model);
          if(searchRecord[0]._options.includeMap[includeName].parent.model == options.model) {

            if(
              (Array.isArray(searchRecord[0].dataValues[includeName]) && searchRecord[0].dataValues[includeName].length > 0) ||
              (!Array.isArray(searchRecord[0].dataValues[includeName]) && searchRecord[0].dataValues[includeName])
            ) {
              console.log('No se puede eliminar este registro porque tiene otros registros asociados');
              throw ('No se puede eliminar este registro porque tiene otros registros asociados');
            }

          }

        })

      }

    } 
  }
});
*/
db.person = require("./person.js")(sequelizeInstance, Sequelize);
db.carrera_universitaria = require("./carrera_universitaria.js")(sequelizeInstance, Sequelize);
db.user = require("./user.js")(sequelizeInstance, Sequelize, db.person);
//db.author = require("./author.js")(sequelizeInstance, Sequelize, db.person);
db.estudiante = require("./estudiante.js")(sequelizeInstance, Sequelize, db.person);
db.profesor = require("./profesor.js")(sequelizeInstance, Sequelize, db.person);
db.seccion = require("./seccion.js")(sequelizeInstance, Sequelize, db.carrera_universitaria);
db.inscripcion = require("./inscripcion.js")(sequelizeInstance, Sequelize, db.estudiante, db.seccion);
db.proyecto = require("./proyecto.js")(sequelizeInstance, Sequelize, db.seccion);
db.integrante_proyecto = require("./integrante_proyecto.js")(sequelizeInstance, Sequelize, db.proyecto, db.inscripcion);
db.proyecto_archivo = require("./proyecto_archivo.js")(sequelizeInstance, Sequelize, db.proyecto);
db.categoria_noticia = require("./categoria_noticia.js")(sequelizeInstance, Sequelize);
db.noticia = require("./noticia.js")(sequelizeInstance, Sequelize, db.user, db.categoria_noticia);
db.noticia_imagen = require("./noticia_imagen.js")(sequelizeInstance, Sequelize, db.noticia);
db.emision_radio = require("./emision_radio.js")(sequelizeInstance, Sequelize, db.user);
db.suscripcion = require("./suscripcion.js")(sequelizeInstance, Sequelize, db.user);
db.radio_espectador = require("./radio_espectador.js")(sequelizeInstance, Sequelize);
db.visualizacion_emision_radio = require("./visualizacion_emision_radio.js")(sequelizeInstance, Sequelize, db.emision_radio, db.suscripcion, db.radio_espectador);
db.radio_espectador_mensaje = require("./radio_espectador_mensaje.js")(sequelizeInstance, Sequelize, db.emision_radio, db.user);
db.logs_sistema = require("./logs_sistema.js")(sequelizeInstance, Sequelize, db.user);


//foreing keys
module.exports = db;

