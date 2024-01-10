module.exports = app => {
    const functions = require('./functions');
    const seccion = require("../controllers/seccion.js");
    var router = require("express").Router();
    
    router.post("/", seccion.create);

    router.get("/api/seccionPorNombre/:val", seccion.seccionPorNombre);
    
    router.get("/", seccion.findAll);
  
    router.get("/:id", seccion.findOne);
  
    router.put("/:id", seccion.update);
  
    router.delete("/:id", seccion.delete);
  
    app.use('/api/seccion', functions.verifyToken, router);
};