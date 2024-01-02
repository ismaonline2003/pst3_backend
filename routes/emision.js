module.exports = app => {
    const functions = require('./functions');
    const emision = require("../controllers/emision.js");
    var router = require("express").Router();

    router.get("/api/current", emision.getCurrent);

    router.post("/api/suscribe", emision.suscribe);
    router.post("/api/unsuscribe", emision.unsuscribe);
  
    app.use('/api/emision', router);
};