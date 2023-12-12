const db = require("../models");
const functions = require('../routes/functions');
const Grabacion = db.emision_radio;
const Op = db.Sequelize.Op;

const recordValidations = (data) =>  {
  let objReturn = {'status': 'success', 'data': {}, 'msg': ''};
  if(data.nombre.trim() == "") {
      objReturn = {'status': 'failed', 'data': {}, 'msg': 'Se debe definir un nombre para la grabación.'};
      return objReturn;
  }
  return objReturn;
}
  

exports.create = async (req, res) => {
    const bodyData = req.body;
    const validations= recordValidations(bodyData);
    const errorMessage = "Ocurrió un error inesperado al intentar crear el registro.";

    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
    }

    Grabacion.create({
      nombre: bodyData.nombre,
      descripcion: bodyData.descripcion
    })
    .then(recordRes => {
        bodyData.id = recordRes.dataValues.id;
        res.status(200).send(bodyData);
    }).catch(err => {
      res.status(500).send({message: errorMessage});
    });
};

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
        if(parameter == 'nombre') {
            condition = {nombre: {[Op.like]: `%${value}%`}};
        }
        if(parameter == 'descripcion') {
            condition = {descripcion: {[Op.like]: `%${value}%`}};
        }
        if(parameter == 'emisor') {
            let emisorIds = functions.searchUserByPersonName(db, value);
            condition = {id_emisor: {[Op.in]: emisorIds}};
        }
        if(parameter == 'fecha') {
            condition = {tiempo_inicio: {[Op.like]: `%${value}%`}};
        }
    }
    condition.status_actual =  {[Op.eq]: 'finalizada'};
    let searchConfig = {where: condition,  include: [{model: db.user, include: [{model: db.person}]}], limit:limit};

    Grabacion.findAll(searchConfig)
    .then((data) => {
        res.send(data)
    }).catch(err => {
        res.status(500).send({message: "Ocurrió un error durante la busqueda de las grabaciones."});
    });
};

exports.findOne = (req, res) => {
    const id = req.params.id;

    Grabacion.findOne({where: {id: id}, include: [{model: db.user, include: [{model: db.person}]}], paranoid: true})
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

exports.update = async (req, res) => {
    const id = req.params.id;
    let bodyData = req.body;
    let validations = recordValidations(bodyData);
    const errorMessage = "Ocurrió un error inesperado al intentar actualizar el registro.";

    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
    }

    Grabacion.update({
      nombre: bodyData.nombre,
      descripcion: bodyData.descripcion
    }, {where: {id: id}})
    .then(recordRes => {
      res.send({message: "El registro fue actualizado satisfactoriamente!!", data: bodyData});
    }).catch(err => {
      res.status(500).send({message: errorMessage});
    });
};

exports.delete = (req, res) => {
    const id = req.params.id;
    Grabacion.destroy({
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