module.exports = app => {
    const functions = require('./functions');
    const estadisticas = require("../controllers/estadisticas.js");
    var router = require("express").Router();
    
    //web
    router.get("/visitasWebGeneral", estadisticas.visitasWebGeneral);
    router.get("/tendenciaTraficoDiario", estadisticas.tendenciaTraficoDiario);
    router.get("/top10Categorias", estadisticas.top10Categorias);
    router.get("/top10Articulos", estadisticas.top10Articulos);

    //radio
    router.get("/visitasRadio", estadisticas.visitasRadio);
    router.get("/suscripcionesRadio", estadisticas.suscripcionesRadio);
  
    app.use('/api/estadisticas', functions.verifyToken, router);
};