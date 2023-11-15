const fs = require('fs');
const db = require("../models");
const functions = require('../routes/functions');
const Proyecto = db.proyecto;
const IntegranteProyecto = db.integrante_proyecto;
const ProyectoArchivo = db.proyecto_archivo;

const Seccion = db.seccion;
const CarreraUniversitaria = db.carrera_universitaria;
const Op = db.Sequelize.Op;

const recordValidations = (data) =>  {
  let objReturn = {'status': 'success', 'data': {}, 'msg': ''};
  return objReturn;
}

const searchPNFByName = async (value) => {
    let search = await CarreraUniversitaria.findAll({where: {nombre: {[Op.like]: `%${value}%`}}});
    return search;
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
    const bodyData = JSON.parse(req.body.data);
    const validations= recordValidations(bodyData);
    const errorMessage = "Ocurrió un error inesperado al intentar crear el registro.";

    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
    }

    await Proyecto.create({
      id_seccion: bodyData.id_seccion,
      nombre: bodyData.nombre,
      descripcion: bodyData.descripcion
    }).then(proyectoRes => {
      
      res.status(200).send(recordRes.dataValues);
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
    var condition = [];
    if(parameter) {
        if(parameter == 'ref') {
            condition = {id: value};
        }
        if(parameter == 'nombre') {
            condition = {nombre: {[Op.like]: `%${value}%`}};
        }
        //cambiar
        if(parameter == 'seccion') {
            condition = {nombre: {[Op.like]: `%${value}%`}};
        }
        if(parameter == 'trayecto') {
            condition = {trayecto: value};
        }
        if(parameter == 'pnf') {
            let searchPNF = await searchPNFByName(value);
            if(searchPNF.length > 0) {
                let inArr = [];
                searchPNF.map((item) => {
                    inArr.push(item.dataValues.id);
                })                
                condition = {pnf_id: inArr};
            } else {
                condition = {pnf_id: [0]};
            }
        }
    }
    console.log(condition);
    let searchConfig = {include: [{model: Seccion}], limit:limit};
    if(!['seccion', 'trayecto', 'pnf'].includes(parameter)) {
        searchConfig['where'] = condition;
    } else {
        searchConfig.include[0]['where'] = condition;
    }

    Proyecto.findAll(searchConfig)
    .then((data) => {
        res.send(data)
    })
    .catch(err => {
        res.status(500).send({
            message: "Ocurrió un error durante la busqueda del registro."
        });
    });
};



exports.findOne = (req, res) => {
  const id = req.params.id;
  Proyecto.findOne({include: [{model: db.carrera_universitaria}], where: {id: id}, paranoid: true})
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

    Proyecto.update(bodyData, {where: {id: id}})
    .then(recordRes => {
      res.send({message: "El registro fue actualizado satisfactoriamente!!"});
    }).catch(err => {
      res.status(500).send({message: errorMessage});
    });
};

exports.delete = (req, res) => {
    const id = req.params.id;
    Proyecto.destroy({
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