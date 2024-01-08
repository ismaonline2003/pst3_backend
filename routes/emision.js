module.exports = app => {
    const functions = require('./functions');
    const emision = require("../controllers/emision.js");
    var router = require("express").Router();

    router.get("/api/current", emision.getCurrent);

    router.get("/", emision.findAll);

    router.get("/:id", emision.findOne);

    router.post("/api/suscribe", emision.suscribe);
    router.post("/api/unsuscribe", emision.unsuscribe);
    router.post("/api/view", emision.postView);
  
    app.use('/api/emision', router);
};