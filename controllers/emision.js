const db = require("../models");
const functions = require('../routes/functions');
const Emision = db.emision_radio;
const Op = db.Sequelize.Op;

exports.getCurrent = async (req, res) => {
    Emision.findAll({
        where: {status_actual: "en_emision"}, 
        order: [['fecha_inicio', 'DESC']],
        limit: 1,
        include: [{model: db.radio_espectador_mensaje}]
    })
    .then((data) => {
        res.send(data[0]);
    }).catch(err => {
        res.status(500).send({message: "Ocurrió un error durante la búsqueda de la emisión."});
    });
};
