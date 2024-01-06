const moment = require('moment');
const db = require("../models");
const functions = require('../routes/functions');
const EmisionAudio = db.emision_audio;
const Op = db.Sequelize.Op;

const recordsValidations = async(records) =>  {
  let objReturn = {'status': 'success', 'data': {}, 'msg': ''};
  const currentDate = new Date();
  for(let i = 0; i < records.length; i++) {
    const recordFechaEmisionProgramada = new Date(records[i].fecha_emision_programada);
    const fechaEmisionFormat = moment(recordFechaEmisionProgramada).format('YYYY-MM-DD HH:mm:ss');
    const recordFinishDate = new Date(records[i].fecha_fin_emision_programada);
    const finishDateFormat = moment(recordFinishDate).format('YYYY-MM-DD HH:mm:ss');


    if(recordFechaEmisionProgramada < currentDate) {
      objReturn = {status: 'error', data: {}, msg: 'Las fechas de los registros deben ser menor o igual a la fecha actual.'};
      return objReturn;
    }

    const inTimeRangeEmisionsSearch = await db.sequelize.query(`
      SELECT id 
      FROM emision_audio 
      WHERE fecha_emision_programada BETWEEN '${fechaEmisionFormat}' AND '${fechaEmisionFormat}' 
      AND deleted_at IS NULL
      LIMIT 1
    `);

    const inTimeRangeEmisionsSearch2 = await db.sequelize.query(`
      SELECT id 
      FROM emision_audio 
      WHERE fecha_emision_programada BETWEEN '${finishDateFormat}' AND '${finishDateFormat}' 
      AND deleted_at IS NULL
      LIMIT 1
    `);

    if(inTimeRangeEmisionsSearch[0].length > 0) {
      objReturn = {status: 'error', data: {}, msg: 'Los audios no pueden coincidir en su programación. La programación de cada audio debe tener una separación de al menos 5 segundos (considerando la duración del audio).'};
      return objReturn;
    }

    if(inTimeRangeEmisionsSearch2[0].length > 0) {
      objReturn = {status: 'error', data: {}, msg: 'Los audios no pueden coincidir en su programación. La programación de cada audio debe tener una separación de al menos 5 segundos (considerando la duración del audio).'};
      return objReturn;
    }

    for(let a = 0; a < records.length; a++) {
        if(records[a].id != records[i].id) {
            let date1 = new Date(records[a].fecha_emision_programada);
            let date2 = new Date(records[a].fecha_fin_emision_programada);
            if(recordFechaEmisionProgramada >= date1 && recordFechaEmisionProgramada <= date2) {
                objReturn = {status: 'error', data: {}, msg: 'Los audios no pueden coincidir en su programación. La programación de cada audio debe tener una separación de al menos 5 segundos (considerando la duración del audio).'};
                return objReturn;
            }
        }
    }
  }
  return objReturn;
}
  

exports.create = async (req, res) => {
    const bodyData = req.body;
    const errorMessage = "Ocurrió un error inesperado al intentar crear el registro.";
    const validations= await recordsValidations(bodyData);
    let bodyRes = [];

    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
      return;
    }
    
    try {
      for(let i = 0; i < bodyData.length; i++) {
        const recordBody = bodyData[i];
        const recordFechaEmisionProgramada = new Date(recordBody.fecha_emision_programada);
        const fechaEmisionFormat = moment(recordFechaEmisionProgramada).format('YYYY-MM-DD HH:mm:ss');
        const recordFinishDate = new Date(recordBody.fecha_fin_emision_programada);
        const finishDateFormat = moment(recordFinishDate).format('YYYY-MM-DD HH:mm:ss');
        recordBody.fecha_emision_programada = fechaEmisionFormat;
        recordBody.fecha_fin_emision_programada = finishDateFormat;
        const createRecord = await EmisionAudio.create(recordBody);
        const searchRecord = await EmisionAudio.findOne({where: {id: createRecord.dataValues.id}});
      }
    } catch(err) {
      res.status(500).send({message: errorMessage});
      return;
    }
    res.status(200).send(bodyData);
    return;
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

    let searchConfig = {where: condition, limit:limit, include: [{model: db.radio_audio, include: [{model: db.author }]}], order: [['fecha_emision_programada', 'DESC']]};

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

exports.delete = async(req, res) => {
    const bodyData = req.body;
    const errorMessage = "Ocurrió un error inesperado al intentar actualizar el registro.";
    try {
      for(let i = 0; i < bodyData.length; i++) {
        const deleteRecord = await EmisionAudio.destroy({ where: {id: bodyData[i].id} });
      }
    } catch(err) {
      res.status(500).send({message: errorMessage});
      return;
    }
    res.status(200).send(bodyData);
    return;
};