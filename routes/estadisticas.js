module.exports = app => {
    const functions = require('./functions');
    const estadisticas = require("../controllers/estadisticas.js");
    var router = require("express").Router();
    
    router.get("/visitasWebGeneral", estadisticas.visitasWebGeneral);
    router.get("/tendenciaTraficoDiario", estadisticas.tendenciaTraficoDiario);
    router.get("/top10Categorias", estadisticas.top10Categorias);
    router.get("/top10Articulos", estadisticas.top10Articulos);
  
    app.use('/api/estadisticas', functions.verifyToken, router);
};