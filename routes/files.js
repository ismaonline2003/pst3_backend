module.exports = app => {
    const functions = require('./functions');
    const files = require("../controllers/files.js");
    var router = require("express").Router();
    
    router.get("/getFile/:fileName", files.getFile);

    app.use('/api/files', router);
};