module.exports = app => {
    const functions = require('./functions');
    const carrera_universitaria = require("../controllers/carrera_universitaria.js");
    var router = require("express").Router();

    //busqueda
    router.get("/", carrera_universitaria.findAll);
  
    app.use('/api/carrera_universitaria', functions.verifyToken, router);
};
  