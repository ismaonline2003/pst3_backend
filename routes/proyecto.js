module.exports = app => {
    const multer = require('multer');
    const functions = require('./functions');
    const proyecto = require("../controllers/proyecto.js");
    var router = require("express").Router();
    const upload = multer({ dest: 'src/fileUploads' })
    
    router.post("/", upload.array('files', 71), proyecto.create);
    
    router.get("/", proyecto.findAll);
  
    router.get("/:id", proyecto.findOne);
  
    router.put("/:id", upload.array('files', 71), proyecto.update);
  
    router.delete("/:id", proyecto.delete);
  
    app.use('/api/proyecto', functions.verifyToken, router);
};