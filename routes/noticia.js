module.exports = app => {
    const multer = require('multer');
    const functions = require('./functions.js');
    const noticia = require("../controllers/noticia.js");
    var router = require("express").Router();
    const upload = multer({ dest: 'src/fileUploads' })
    
    router.post("/", upload.array('files', 71), noticia.create);
    
    router.get("/", noticia.findAll);
  
    router.get("/:id", noticia.findOne);
  
    router.put("/:id", upload.array('files', 71), noticia.update);
  
    router.delete("/:id", noticia.delete);
  
    app.use('/api/noticia', functions.verifyToken, router);
};