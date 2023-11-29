module.exports = app => {
    const functions = require('./functions');
    const carrera_universitaria = require("../controllers/carrera_universitaria.js");
    var router = require("express").Router();

    //busqueda
    router.get("/", carrera_universitaria.findAll);

    router.post("/", carrera_universitaria.create);

    router.get("/:id", carrera_universitaria.findOne);

    router.put("/:id", carrera_universitaria.update);
    
    router.delete("/:id", carrera_universitaria.delete);
  
    app.use('/api/carrera_universitaria', functions.verifyToken, router);
};
  