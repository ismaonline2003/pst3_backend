module.exports = app => {
   const functions = require('./functions.js');
    const emision_audio = require("../controllers/emision_audio.js");
    var router = require("express").Router();
   
    router.post("/", emision_audio.create);
    
    router.get("/", emision_audio.findAll);
  
    router.get("/:id", emision_audio.findOne);
  
    router.put("/:id", emision_audio.update);
  
    router.post("/api/delete", emision_audio.delete);
  
    app.use('/api/emision_audio', functions.verifyToken, router);
};