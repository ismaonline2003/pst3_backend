module.exports = app => {
    const functions = require('./functions');
    const estudiante = require("../controllers/estudiante.js");
  
    var router = require("express").Router();
    
    router.post("/", estudiante.create);
  
    router.get("/", estudiante.findAll);
  
    router.get("/:id", estudiante.findOne);
  
    router.put("/:id", estudiante.update);
  
    router.delete("/:id", estudiante.delete);
  
    app.use('/api/estudiante', functions.verifyToken, router);
};
  