module.exports = app => {
    const functions = require('./functions.js');
    const categoria_noticia = require("../controllers/categoria_noticia.js");
    var router = require("express").Router();
    
    router.post("/", categoria_noticia.create);
    
    router.get("/", categoria_noticia.findAll);
  
    router.get("/:id", categoria_noticia.findOne);
  
    router.put("/:id", categoria_noticia.update);
  
    router.delete("/:id", categoria_noticia.delete);
  
    app.use('/api/categoria_noticia', functions.verifyToken, router);
};