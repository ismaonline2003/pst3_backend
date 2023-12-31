module.exports = app => {
    const functions = require('./functions');
    const emision = require("../controllers/emision.js");
    var router = require("express").Router();

    router.get("/api/current", emision.getCurrent);
  
    app.use('/api/emision', router);
};