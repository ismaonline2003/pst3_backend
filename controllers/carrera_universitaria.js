const fs = require('fs');
const db = require("../models");
const functions = require('../routes/functions');
const CarreraUniversitaria = db.carrera_universitaria;
const Op = db.Sequelize.Op;

const recordValidations = (data) =>  {
    let objReturn = {'status': 'success', 'data': {}, 'msg': ''};
    if(data.nombre.trim() == "") {
        objReturn = {'status': 'failed', 'data': {}, 'msg': 'Se debe definir un nombre para la categoría de noticia.'};
        return objReturn;
    }
    return objReturn;
  }

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

exports.findOne = (req, res) => {
    const id = req.params.id;
    CarreraUniversitaria.findOne({where: {id: id}, paranoid: true})
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({message: `No se pudo encontrar el registro.`});
      }
    })
    .catch(err => {
      res.status(500).send({message: "Ocurió un error inesperado... Intentelo mas tarde."});
    });
};

exports.create = async (req, res) => {
    const bodyData = req.body;
    const validations= recordValidations(bodyData);
    const errorMessage = "Ocurrió un error inesperado al intentar crear el registro.";

    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
    }

    CarreraUniversitaria.create({
      nombre: bodyData.nombre,
      nombre_pnf: bodyData.nombre_pnf,
      codigo_pnf: bodyData.codigo_pnf,
      pertenece_uni: true
    })
    .then(recordRes => {
        bodyData.id = recordRes.dataValues.id;
        functions.createActionLogMessage(db, "PNF", req.headers.authorization, bodyData.id);
        res.status(200).send(bodyData);
    }).catch(err => {
      res.status(500).send({message: errorMessage});
    });
};

exports.update = async (req, res) => {
    const id = req.params.id;
    let bodyData = req.body;
    let validations = recordValidations(bodyData);
    const errorMessage = "Ocurrió un error inesperado al intentar actualizar el registro.";

    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
    }

    CarreraUniversitaria.update({
        nombre: bodyData.nombre,
        nombre_pnf: bodyData.nombre_pnf,
        codigo_pnf: bodyData.codigo_pnf
    }, {where: {id: id}})
    .then(recordRes => {
      functions.updateActionLogMessage(db, "PNF", req.headers.authorization, id);
      res.send({message: "El registro fue actualizado satisfactoriamente!!", data: bodyData});
    }).catch(err => {
      res.status(500).send({message: errorMessage});
    });
};

exports.delete = (req, res) => {
    const id = req.params.id;
    CarreraUniversitaria.destroy({
      where: { id: id },
      individualHooks: true
    })
    .then(num => {
        if (num == 1) {
          functions.deleteActionLogMessage(db, "PNF", req.headers.authorization, id);
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
