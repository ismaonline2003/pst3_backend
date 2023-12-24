const db = require("../models");
const LogsSistema = db.logs_sistema;
const Op = db.Sequelize.Op;
const functions = require('../routes/functions');

exports.findAll = async (req, res) => {
    const parameter = req.query.parameter;
    const value = req.query.value;
    const limitParameter = req.query.limit;
    let limit = 25;
    if(limitParameter && !isNaN(limitParameter)) {
        limit = parseInt(limitParameter);
    }
    var condition = {};
    if(parameter) {
        if(parameter == 'ref') {
            condition = {id: {[Op.eq]: value}};
        }
        if(parameter == 'usuario') {
            let usersIds = await functions.searchUserByPersonName(db, value);
            condition = {user_id: {[Op.in]: usersIds}};
        }
        if(parameter == 'descripcion') {
            condition = {body: {[Op.like]: `%${value}%`}};
        }
        if(parameter == 'tipo') {
            condition = {tipo: {[Op.eq]: value}};
        }
        if(parameter == 'fecha') {
            condition = {fecha: {[Op.gte]: new Date(`${value} 00:00:01`), [Op.lte]: new Date(`${value} 23:59:59`)}};
        }
    }

    if(parameter != 'tipo') {
        condition.tipo = {[Op.in]: ['create', 'update', 'delete']}
    }

    let searchConfig = {where: condition, include: [{model: db.user, include: [{model: db.person}]}], limit:limit};

    LogsSistema.findAll(searchConfig)
    .then((data) => {
        res.send(data)
    })
    .catch(err => {
        res.status(500).send({message: "Ocurrió un error durante la busqueda de los logs de inicio de sesión."});
    });
};

/*
    { value: 'ref', label: 'Referencia', type: "number"},
    { value: 'usuario', label: 'Usuario', type: "search"},
    { value: 'fecha', label: 'Fecha', type: "date"}

*/

exports.findAllLogin = async (req, res) => {
    const parameter = req.query.parameter;
    const value = req.query.value;
    const limitParameter = req.query.limit;
    let limit = 25;
    if(limitParameter && !isNaN(limitParameter)) {
        limit = parseInt(limitParameter);
    }
    var condition = {};
    if(parameter) {
        if(parameter == 'ref') {
            condition = {id: {[Op.eq]: value}};
        }
        if(parameter == 'usuario') {
            let usersIds = await functions.searchUserByPersonName(db, value);
            condition = {user_id: {[Op.in]: usersIds}};
        }
        if(parameter == 'fecha') {
            condition = {fecha: {[Op.gte]: new Date(`${value} 00:00:01`), [Op.lte]: new Date(`${value} 23:59:59`)}};
        }
    }

    condition.tipo = {[Op.eq]: 'inicio_sesion'};

    let searchConfig = {where: condition, include: [{model: db.user, include: [{model: db.person}]}], limit:limit};

    LogsSistema.findAll(searchConfig)
    .then((data) => {
        res.send(data)
    })
    .catch(err => {
        res.status(500).send({message: "Ocurrió un error durante la busqueda de los logs de inicio de sesión."});
    });
  };