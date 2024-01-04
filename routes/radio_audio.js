module.exports = app => {
    const multer = require('multer');
    const functions = require('./functions.js');
    const radio_audio = require("../controllers/radio_audio.js");
    var router = require("express").Router();
    const upload = multer({ dest: 'src/fileUploads'});
    
    router.post("/", upload.single('file'), radio_audio.create);
    
    router.get("/", radio_audio.findAll);
  
    router.get("/:id", radio_audio.findOne);
  
    router.put("/:id", radio_audio.update);
  
    router.delete("/:id", radio_audio.delete);
  
    app.use('/api/radio_audio', functions.verifyToken, router);
};