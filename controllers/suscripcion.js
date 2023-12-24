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

    let createData = {
      tipo: bodyData.tipo,
      username: bodyData.username,
      activa: true
    }
    let userSearch = false;

    if(bodyData.user_id) {

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
      userSearch = await db.user.findAll({where: {id: user_id}, include: [{model: db.person}]});
      createData.user_id = userSearch.dataValues.id;

    } else {
      userSearch = await db.user.findAll({where: {person_id: bodyData.id_persona}, include: [{model: db.person}]});
      if(userSearch.length == 0) {
        res.status(400).send({message: `La persona seleccionada no tiene ningun usuario creado.`});
        return;
      }
      if(userSearch.length > 0) {
        createData.user_id = userSearch[0].dataValues.id;
      }
    }

    createData.fecha_suscripcion = new Date();

    Suscripcion.create(createData)
    .then(suscripcionRes => {
      suscripcionRes.dataValues.user = userSearch[0].dataValues;

      functions.createActionLogMessage(db, "Suscripción", req.headers.authorization, suscripcionRes.id);

      res.status(200).send(suscripcionRes.dataValues);
    }).catch(err => {
      res.status(500).send({message: errorMessage});
    });
};

exports.findAll = async (req, res) => {
  const parameter = req.query.parameter;
  const value = req.query.value;
  let tipo = req.query.tipo;
  const limitParameter = req.query.limit;
  let limit = 25;
  if(limitParameter && !isNaN(limitParameter)) {
    limit = parseInt(limitParameter);
  }
  if(!tipo) {
    tipo = "radio";
  }
  var condition = {};
  if(parameter) {
    if(parameter == 'username') {
        condition = {username: {[Op.like]: `%${value}%`}};
    }
    if(parameter == 'persona') {
        let user_ids = await functions.searchUserByPersonName(db, value);
        condition = {user_id: {[Op.in]: user_ids}};
    }
    if(parameter == 'fecha_suscripcion') {
        //el value tiene que ser tipo date (no datetime) con formato "YYYY-mm-dd"
        condition = {fecha_suscripcion: {[Op.gte]: new Date(`${value} 00:00:01`), [Op.lte]: new Date(`${value} 23:59:59`)}};
    }
  }

  condition.tipo = {[Op.eq]: tipo};

  let searchConfig = {where: condition, include: [{model: db.user, include: [{model: db.person}]}], limit:limit};

  Suscripcion.findAll(searchConfig)
  .then((data) => {
    res.send(data)
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: "Ocurrió un error durante la busqueda de los registros."
    });
  });
};

exports.searchPersonas = async (req, res) => {
  const tipo = req.query.tipo;
  const value = req.query.value;
  let ids_list = [];
  if(tipo && value) {
      let recordsSearch = await db.sequelize.query(`
      SELECT 
        person.id AS id,
        CONCAT(person.name,' ', person.lastname) AS name,
        person.ci_type AS ci_type,
        person.ci AS ci
      FROM person 
      INNER JOIN users ON users.person_id = person.id
      WHERE CONCAT(person.name,' ', person.lastname) LIKE '%${value}%' 
      AND person.id NOT IN (
          SELECT 
            p.id AS id 
          FROM person AS p 
          INNER JOIN users AS u ON u.person_id = person.id
          INNER JOIN suscripcion AS s ON s.user_id = u.id
          WHERE s.tipo = '${tipo}'
          AND p.deleted_at IS NULL 
          AND u.deleted_at IS NULL
          AND s.deleted_at IS NULL
      )
      AND person.deleted_at IS NULL
      AND users.deleted_at IS NULL
    `);

    if(recordsSearch.length > 0) {
      ids_list = recordsSearch[0];
    }

  }
  res.status(200).send(ids_list);
}




exports.findOne = (req, res) => {
  const id = req.params.id;
  Suscripcion.findOne({include: [{model: db.user, include: [{model: db.person}]}], where: {id: id}, paranoid: true})
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
      functions.updateActionLogMessage(db, "Suscripción", req.headers.authorization, id);
      res.send({message: "La suscripción fue desactivada satisfactoriamente!!"});
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
          functions.deleteActionLogMessage(db, "Suscripción", req.headers.authorization, id);
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