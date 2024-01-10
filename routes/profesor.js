module.exports = app => {
    const multer = require('multer');
    const functions = require('./functions');
    const profesor = require("../controllers/profesor.js");
    var router = require("express").Router();
    const upload = multer({ dest: 'src/fileUploads' })
    
    router.post("/",  upload.single('foto_carnet'), profesor.create);
    
    router.get("/", profesor.findAll);

    router.get("/api/profesorPorNombre/:val", profesor.profesorPorNombre);
  
    router.get("/:id", profesor.findOne);
  
    router.put("/:id", upload.single('foto_carnet'), profesor.update);
  
    router.delete("/:id", profesor.delete);
  
    app.use('/api/profesor', functions.verifyToken, router);
};