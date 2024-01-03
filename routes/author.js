module.exports = app => {
    const functions = require('./functions');
    const author = require("../controllers/author.js");
  
    var router = require("express").Router();
  
    // creación
    router.post("/", author.create);
    
    //busqueda por codigo
    router.get("/", author.findAll);

    //busqueda por id
    router.get("/:id", author.findOne);
  
    //actualización
    router.put("/:id", author.update);
  
    //eliminación
    router.delete("/:id", author.delete);
  
    app.use('/api/autor', functions.verifyToken, router);
};
  