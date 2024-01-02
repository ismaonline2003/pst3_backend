const db = require("../models");
const functions = require('../routes/functions');
const Emision = db.emision_radio;
const User = db.user;
const Suscripcion = db.suscripcion;
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

exports.suscribe = async(req, res) => {
    const body = req.body;
    const searchUser = await User.findByPk(body.user_id, {include: [{model: db.person}]});
    const searchSuscripcion = await Suscripcion.findAll({where: {user_id: body.user_id, tipo: 'radio', activa: true}, limit:1});
    if(!searchUser) {
        res.status(404).send({message: "El usuario no fue encontrado"});
        return;
    }
    if(searchSuscripcion.length > 0) {
        res.status(400).send({message: 'Usted ya tiene una suscripción activa'});
        return;
    }
    Suscripcion.create({
        user_id: body.user_id,
        fecha_suscripcion: new Date(),
        username: body.username,
        email: searchUser.dataValues.login,
        tipo: 'radio',
        activa: true
    })
    .then((data) => {
        res.send(data.dataValues);
    })
    .catch(err => {
        res.status(500).send({message: "Ocurrió un error durante el registro de la suscripción."});
    });
}

exports.unsuscribe = async(req, res) => {
    const body = req.body;
    const searchSuscripcion = await Suscripcion.findAll({where: {id: body.id, tipo: 'radio', activa: true}, limit:1});
    if(searchSuscripcion.length == 0) {
        res.status(400).send({message: 'La suscripción no fue encontrada'});
        return;
    }
    Suscripcion.update({activa: false}, {where: {id: body.id}})
    .then((data) => {
        res.send();
    })
    .catch(err => {
        res.status(500).send({message: "Ocurrió un error durante el registro de la suscripción."});
    });
}
