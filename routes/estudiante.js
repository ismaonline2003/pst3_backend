module.exports = app => {
    const multer = require('multer');
    const functions = require('./functions');
    const estudiante = require("../controllers/estudiante.js");
    var router = require("express").Router();
    const upload = multer({ dest: 'src/fileUploads' })
    
    router.post("/", estudiante.create);
  
    router.get("/", estudiante.findAll);
  
    router.get("/:id", estudiante.findOne);
  
    router.put("/:id", upload.single('foto_carnet'), estudiante.update);
  
    router.delete("/:id", estudiante.delete);
  
    app.use('/api/estudiante', functions.verifyToken, router);
};
  