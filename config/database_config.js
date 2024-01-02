module.exports = {
    HOST: "localhost",
    USER: "root",
    PASSWORD: "",
    DB: "pst3",
    dialect: "mysql",
    pool: {//pool configuration
      max: 100,//maximum number of connection in pool
      min: 0,//minimum number of connection in pool
      acquire: 30000,//maximum time in ms that pool will try to get connection before throwing error
      idle: 10000//maximum time in ms, that a connection can be idle before being released
    },
    logging: false
};

//contraseña para todos los usuarios de prueba}
//email: anafernandez03@gmail.com
//password: Admin2465656@1+