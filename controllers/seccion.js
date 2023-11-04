const fs = require('fs');
const db = require("../models");
const functions = require('../routes/functions');
const Seccion = db.seccion;
const CarreraUniversitaria = db.carrera_universitaria;
const Op = db.Sequelize.Op;

const searchCarreraUniversitaria = async (Id) => {
  let search = await CarreraUniversitaria.findAll({where: {id: Id}});
  return search
}

const recordValidations = (data) =>  {
  let objReturn = {'status': 'success', 'data': {}, 'msg': ''};
  let carreraUniversitariaId = searchCarreraUniversitaria(data.pnf_id);
  if(data.nombre.trim() == "") {
      objReturn = {'status': 'failed', 'data': {}, 'msg': 'Se debe definir un nombre para la sección.'};
      return objReturn;
  }
  if(data.nombre.length > 6) {
      objReturn = {'status': 'failed', 'data': {}, 'msg': 'El nombre de la sección no debe sobrepasar los 6 caracteres.'};
      return objReturn;
  }
  if(isNaN(data.year)) {
      objReturn = {'status': 'failed', 'data': {}, 'msg': 'El año debe ser un valor numérico'};
      return objReturn;
  }
  if(!["0", "1", "2", "3", "4", "5"].includes(data.trayecto)) {
      objReturn = {'status': 'failed', 'data': {}, 'msg': 'El trayecto debe ser Inicial, 1, 2, 3, 4 o 5'};
      return objReturn;
  }
  if(!["1", "2", "3"].includes(data.turno)) {
      objReturn = {'status': 'failed', 'data': {}, 'msg': 'El turno debe ser "Mañana", "Tarde", o "Noche"'};
      return objReturn;
  }
  if(carreraUniversitariaId.length == 0) {
      objReturn = {'status': 'failed', 'data': {}, 'msg': 'Debe seleccionar un pnf válido.'};
      return objReturn;
  }
  return objReturn;
}

const getTurnoName = (turno) => {
    let turnoName = "";
    if(turno == 1) {
        turnoName = "Mañana";
    }
    if(turno == 2) {
        turnoName = "Tarde";
    }
    if(turno == 3) {
        turnoName = "Noche";
    }
    return turnoName;
}
  

exports.create = async (req, res) => {
    const bodyData = req.body;
    const validations= recordValidations(bodyData);
    const errorMessage = "Ocurrió un error inesperado al intentar crear el registro.";

    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
    }

    const seccionSearch = await Seccion.findAll({where: {
          nombre: bodyData.nombre, 
          pnf_id: bodyData.pnf_id,  
          year: bodyData.year,
          trayecto: bodyData.trayecto,
          turno: bodyData.turno
    }});

    if(seccionSearch.length > 0) {
      res.status(400).send({
          message: `La sección ${bodyData.nombre} del PNF ${bodyData.pnf_data.nombre_pnf} del trayecto ${bodyData.trayecto} en el turno ${getTurnoName(parseInt(bodyData.turno))} en el año ${bodyData.year} ya esta previamente creada.`
      });
      return
    }

    Seccion.create({
      pnf_id: bodyData.pnf_id,
      year: bodyData.year,
      trayecto: bodyData.trayecto,
      nombre: bodyData.nombre,
      turno: bodyData.turno
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
  var condition = [];
  if(parameter) {
    if(parameter == 'nombre') {
        condition = {nombre: {[Op.like]: `%${value}%`}};
    }
    if(parameter == 'year') {
        condition = {year: {[Op.eq]: value}};
    }
    if(parameter == 'trayecto') {
        condition = {trayecto: {[Op.eq]: value}};
    }
    if(parameter == 'turno') {
        condition = {turno: {[Op.eq]: value}};
    }
    //cambiar
    if(parameter == 'pnf') {
        condition = {nombre_pnf: {[Op.like]: `%${value}%`}};
    }
  }

  let searchConfig = {include: [{model: db.carrera_universitaria}], limit:limit};
  if(!['pnf'].includes(parameter)) {
    searchConfig['where'] = condition;
  } else {
    searchConfig.include[0]['where'] = condition;
  }

  Seccion.findAll(searchConfig)
  .then((data) => {res.send(data)})
  .catch(err => {
    res.status(500).send({
      message: "Ocurrió un error durante la busqueda del registro."
    });
  });
};



exports.findOne = (req, res) => {
  const id = req.params.id;
  Seccion.findOne({include: [{model: db.carrera_universitaria}], where: {id: id}, paranoid: true})
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
    let validations = recordValidations(bodyData);
    const errorMessage = "Ocurrió un error inesperado al intentar actualizar el registro.";
    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
    }

    Seccion.update(bodyData, {where: {id: id}})
    .then(seccionRes => {
      res.send({message: "El registro fue actualizado satisfactoriamente!!"});
    }).catch(err => {
      res.status(500).send({message: errorMessage});
    });
};

exports.delete = (req, res) => {
    const id = req.params.id;
    Seccion.destroy({
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