const db = require("../models");
const functions = require('../routes/functions');
const EmisionAudio = db.emision_audio;
const Op = db.Sequelize.Op;

const recordValidations = (data) =>  {
  let objReturn = {'status': 'success', 'data': {}, 'msg': ''};
  if(data.nombre.trim() == "") {
      objReturn = {'status': 'failed', 'data': {}, 'msg': 'Se debe definir un nombre para la categoría de noticia.'};
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

    EmisionAudio.create({
      nombre: bodyData.nombre,
      descripcion: bodyData.descripcion
    })
    .then(recordRes => {
        bodyData.id = recordRes.dataValues.id;
        functions.createActionLogMessage(db, "Audio de Emisión", req.headers.authorization, bodyData.id);
        res.status(200).send(bodyData);
    }).catch(err => {
      res.status(500).send({message: errorMessage});
    });
};

const searchAudiosIdsByName = async(value) => {
  let ids_list = [];
  let recordsSearch = await db.sequelize.query(`
    SELECT 
      radio_audio.id AS id
    FROM radio_audio 
    INNER JOIN author ON author.id = radio_audio.id_autor
    WHERE CONCAT(author.name,' - ', radio_audio.title) LIKE '%${value}%'
    AND radio_audio.deleted_at IS NULL
  `);
  if(recordsSearch.length > 0) {
      for(let i = 0; i < recordsSearch[0].length; i++) {
          ids_list.push(recordsSearch[0][i].id);
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
        if(parameter == 'audio') {
            const audioIds = await searchAudiosIdsByName(value);
            condition = {id_audio: {[Op.in]: audioIds}};
        }
        if(parameter == 'fecha') {
          condition = {fecha_emision_programada: {[Op.like]: `%${value}%`}};
        }
    }

    let searchConfig = {where: condition, limit:limit, include: [{model: db.radio_audio, include: [{model: db.author }]}]};

    EmisionAudio.findAll(searchConfig)
    .then((data) => {
        res.send(data)
    })
    .catch(err => {
        res.status(500).send({message: "Ocurrió un error durante la busqueda de las categorias de noticias."});
    });
};

exports.findOne = (req, res) => {
    const id = req.params.id;

    EmisionAudio.findOne({where: {id: id}, paranoid: true})
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

    EmisionAudio.update({
      nombre: bodyData.nombre,
      descripcion: bodyData.descripcion
    }, {where: {id: id}})
    .then(recordRes => {
      functions.updateActionLogMessage(db, "Audio de Emisión", req.headers.authorization, id);
      res.send({message: "El registro fue actualizado satisfactoriamente!!", data: bodyData});
    }).catch(err => {
      res.status(500).send({message: errorMessage});
    });
};

exports.delete = (req, res) => {
    const id = req.params.id;
    EmisionAudio.destroy({
      where: { id: id },
      individualHooks: true
    })
    .then(num => {
        if (num == 1) {
          functions.deleteActionLogMessage(db, "Audio de Emisión", req.headers.authorization, id);
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