const fs = require('fs');
const db = require("../models");
const CarreraUniversitaria = db.carrera_universitaria;
const Op = db.Sequelize.Op;


exports.findAll = (req, res) => {
    const parameter = req.query.parameter;
    const value = req.query.value;
    const limitParameter = req.query.limit;
    let limit = 25;
    if(limitParameter && !isNaN(limitParameter)) {
        limit = parseInt(limitParameter);
    }
    var condition = [];
    if(parameter) {
        if(parameter == 'nombre') {
            condition = {nombre: {[Op.like]: `%${value}%`}};
        }
        if(parameter == 'nombre_pnf') {
            condition = {nombre_pnf: {[Op.eq]: `%${value}%`}};
        }
        if(parameter == 'pertenece_uni') {
            condition = {pertenece_uni: {[Op.eq]: value}};
        }
        if(parameter == 'codigo_pnf') {
            condition = {codigo_pnf: {[Op.like]: `%${value}%`}};
        }
    }

    let searchConfig = {where: condition, limit:limit};

    CarreraUniversitaria.findAll(searchConfig)
    .then((data) => {
        res.send(data)
        })
    .catch(err => {
        res.status(500).send({
        message: "Ocurrió un error durante la busqueda de la carrera universitaria."
        });
    });
};
