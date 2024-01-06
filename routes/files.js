module.exports = app => {
    const functions = require('./functions');
    const files = require("../controllers/files.js");
    var router = require("express").Router();
    
    router.get("/getFile/:fileName", files.getFile);

    router.get("/getEmisionAudio/:fileName", files.getEmisionAudio);

    router.get("/getRadioAudio/:fileName", files.getRadioAudio);

    router.get("/getCurrentEmisionAudio/:fileName", files.getCurrentEmisionAudio);

    router.get("/currentScheduledRadioAudio", files.getCurrentScheduledRadioAudio);

    app.use('/api/files', router);

};