module.exports = app => {
    const multer = require('multer');
    const functions = require('./functions');
    const grabacion = require("../controllers/grabacion.js");
    var router = require("express").Router();
    const upload = multer({ dest: 'src/fileUploads' })
    
    router.post("/", grabacion.create);
    
    router.get("/", grabacion.findAll);
  
    router.get("/:id", grabacion.findOne);
  
    router.put("/:id", grabacion.update);
  
    router.delete("/:id", grabacion.delete);
  
    app.use('/api/grabacion', functions.verifyToken, router);
};
  