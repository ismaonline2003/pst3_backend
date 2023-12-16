module.exports = app => {
    const functions = require('./functions');
    const suscripcion = require("../controllers/suscripcion.js");
    var router = require("express").Router();
    
    router.post("/", suscripcion.create);
    
    router.get("/", suscripcion.findAll);
  
    router.get("/:id", suscripcion.findOne);
  
    router.put("/:id", suscripcion.update);
  
    router.delete("/:id", suscripcion.delete);
  
    app.use('/api/suscripcion', functions.verifyToken, router);
};