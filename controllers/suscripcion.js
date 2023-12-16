const fs = require('fs');
const db = require("../models");
const functions = require('../routes/functions');
const Suscripcion = db.suscripcion;
const Op = db.Sequelize.Op;

const recordValidations = (data) =>  {
  let objReturn = {'status': 'success', 'data': {}, 'msg': ''};
  return objReturn;
}

exports.create = async (req, res) => {
    const bodyData = req.body;
    const validations= recordValidations(bodyData);
    const errorMessage = "Ocurrió un error inesperado al intentar crear el registro.";

    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
    }

    const suscripcionSearch1 = await Suscripcion.findAll({where: {user_id: bodyData.user_id, tipo: bodyData.tipo}});

    if(suscripcionSearch1.length > 0) {
      res.status(400).send({message: `El usuario seleccinado ya tiene una suscripción registrada.`});
      return
    }

    const suscripcionSearch2 = await Suscripcion.findAll({where: {username: bodyData.username, tipo: bodyData.tipo}});

    if(suscripcionSearch2.length > 0) {
        res.status(400).send({message: `El nombre de usuario especificado ya esta en uso.`});
        return
      }

    Suscripcion.create({
      user_id: bodyData.user_id,
      username: bodyData.username,
      fecha_suscripcion: new Date(),
      tipo: bodyData.tipo
    })
    .then(seccionRes => {
      res.status(200).send(seccionRes.dataValues);
    }).catch(err => {
      res.status(500).send({message: errorMessage});
    });
};

exports.findAll = (req, res) => {
  const parameter = req.query.parameter;
  const value = req.query.value;
  const limitParameter = req.query.limit;
  let limit = 25;
  if(limitParameter && !isNaN(limitParameter)) {
    limit = parseInt(limitParameter);
  }
  var condition = {};
  if(parameter) {
    if(parameter == 'username') {
        condition = {username: {[Op.like]: `%${value}%`}};
    }
    if(parameter == 'persona') {
        let user_ids = []; //crear función
        condition = {user_id: {[Op.in]: user_ids}};
    }
    if(parameter == 'fecha_suscripcion') {
        //el value tiene que ser tipo date (no datetime) con formato "YYYY-mm-dd"
        condition = {turno: {[Op.between]: [`${value} 00:00:01`, `${value} 23:59:59`]}};
    }

    if(parameter == 'tipo') {
        //el value tiene que ser tipo date (no datetime) con formato "YYYY-mm-dd"
        condition = {tipo: {[Op.eq]: value}};
    }
  }

  let searchConfig = {where: condition, include: [{model: db.user, include: [{model: db.person}]}], limit:limit};

  Suscripcion.findAll(searchConfig)
  .then((data) => {res.send(data)})
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: "Ocurrió un error durante la busqueda de los registros."
    });
  });
};



exports.findOne = (req, res) => {
  const id = req.params.id;
  Suscripcion.findOne({include: { all: true, nested: true }, where: {id: id}, paranoid: true})
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({message: `No se pudo encontrar el registro.`});
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Ocurió un error inesperado... Intentelo mas tarde."
      });
    });
};

exports.update = async (req, res) => {
    const id = req.params.id;
    let bodyData = req.body;
    const errorMessage = "Ocurrió un error inesperado al intentar actualizar el registro.";
    Suscripcion.update({activa: bodyData.activa}, {where: {id: id}})
    .then(seccionRes => {
      res.send({message: "El registro fue actualizado satisfactoriamente!!"});
    }).catch(err => {
      res.status(500).send({message: errorMessage});
    });
};

exports.delete = (req, res) => {
    const id = req.params.id;
    Suscripcion.destroy({
      where: { id: id },
      individualHooks: true
    })
    .then(num => {
        if (num == 1) {
          res.send({
            message: "El registro fue eliminado exitosamente!!"
          });
        } else {
          res.send({
            message: `No se pudo eliminar el registro.`
          });
        }
    })
    .catch(err => {
      console.log(err);
      res.status(500).send({
        message: "No se pudo eliminar el registro"
      });
    });
};