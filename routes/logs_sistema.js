module.exports = app => {
    const functions = require('./functions');
    const logs_sistema = require("../controllers/logs_sistema.js");
    var router = require("express").Router();

    router.get("/", logs_sistema.findAll);
  
    router.get("/api/login", logs_sistema.findAllLogin);
  
    app.use('/api/logs_sistema', functions.verifyToken, router);
};
  