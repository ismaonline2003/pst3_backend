const fs = require('fs');
const db = require("../models");
const functions = require('../routes/functions');
const Noticia = db.noticia;
const NoticiaImagen = db.noticia_imagen;
const Op = db.Sequelize.Op;

const recordValidations = (data) =>  {
  let objReturn = {'status': 'success', 'data': {}, 'msg': ''};
  if(data.nombre.trim() == "") {
      objReturn = {'status': 'failed', 'data': {}, 'msg': 'Se debe definir un nombre para la noticia.'};
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

const searchCategIds = async (value) => {
    let ids_list = [];
    let recordsSearch = await db.sequelize.query(`
        SELECT id FROM categoria_noticia WHERE nombre LIKE '%${value}%' AND updated_at IS NOT NULL LIMIT 1
    `);
    if(recordsSearch.length > 0) {
        for(let i = 0; i < recordsSearch[0].length; i++) {
            ids_list.push(recordsSearch[0][i].id);
        }
    }
    return ids_list;
}

const searchRedactoresIds = async (value) => {
    let ids_list = [];
    let recordsSearch = await db.sequelize.query(`
        SELECT 
            u.id AS user_id 
        FROM users AS u 
        INNER JOIN person AS p ON p.id = u.person_id
        WHERE CONCAT(p.name,' ', p.lastname) LIKE '%${value}%' 
        AND u.updated_at IS NOT NULL 
        AND p.updated_at IS NOT NULL
    `);
    if(recordsSearch.length > 0) {
        for(let i = 0; i < recordsSearch[0].length; i++) {
            ids_list.push(recordsSearch[0][i].user_id);
        }
    }
    return ids_list;
}

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
        if(parameter == 'categoria_noticia') {
            const categ_ids = await searchCategIds(value);
            condition = {categ_id: {[Op.in]: categ_ids}};
        }
        if(parameter == 'redactor') {
            const user_ids = await searchRedactoresIds(value);
            condition = {user_id: {[Op.in]: user_ids}};
        }
    }

    let searchConfig = {include: { all: true, nested: true }, where: condition, limit:limit};

    Noticia.findAll(searchConfig)
    .then((data) => {
        res.send(data)
    })
    .catch(err => {
        res.status(500).send({
        message: "Ocurrió un error durante la busqueda de las noticias."
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