const fs = require('fs');
const db = require("../models");
const functions = require('../routes/functions');
const Person = db.person;
const Estudiante = db.estudiante;
const Op = db.Sequelize.Op;


const processImage = (file) => {
  const fileRead = fs.readFileSync(file.path);
  const filename = functions.getFileName(file);
  const filePath = `src/fileUploads/${filename}`;
  fs.writeFileSync(filePath, fileRead);
  fs.unlinkSync(file.path);
  return filename;
}

exports.create = async (req, res) => {
  let bodyData = JSON.parse(req.body.data);
  let fotoCarnet = req.file;
  let fotoCarnetFilepath = "";
  const validatePersonData = functions.personaFieldsValidations(bodyData.person);
  const errorMessage = "Ocurrió un error inesperado al intentar crear a el estudiante.";
  
  //validaciones de campos
  if(validatePersonData.status != 'success') {
    res.status(400).send({message: validatePersonData.msg});
  }

  
  if(bodyData.uploadFotoCarnet) {
    if(fotoCarnet) {
      fotoCarnetFilepath = processImage(fotoCarnet);
      bodyData.person.foto_carnet_filename = fotoCarnetFilepath;
    } else {
      bodyData.person.foto_carnet_filename = "";
    }
  }

  //validación de ci
  const personaSearch = await Person.findAll({where: {ci: bodyData.person.ci}});
  if(personaSearch.length > 0) {
    res.status(400).send({
        message: `La persona con la cédula de identidad ${bodyData.person.ci} ya está creada previamente en el sistema.`
    });
    return
  }

  //validación de nro de expediente
  const estudianteSearch = await Estudiante.findAll({where: {nro_expediente: bodyData.nro_expediente}});
  if(estudianteSearch.length > 0) {
    res.status(400).send({
        message:`El estudiante con el número de expediente ${bodyData.nro_expediente} ya esta creado previamente en el sistema.`
    });
    return
  }

  //guarda al estudiante
  Person.create(bodyData.person)
    .then(personData => {
        let estudianteData = {
          id_persona: personData.dataValues.id,
          nro_expediente: bodyData.nro_expediente,
          year_ingreso: bodyData.year_ingreso
        }
        Estudiante.create(estudianteData).then((data) => {
          let inscripciones = [];
          estudianteData.person = personData.dataValues;
          estudianteData.id = data.dataValues.id;
          if(bodyData.secciones.length > 0) {
            bodyData.secciones.map(async (item) => {
              let inscripcionCreate = await db.inscripcion.create({estudiante_id: estudianteData.id, seccion_id: item.id});
              inscripciones.push(inscripcionCreate);
            }) 
          }
          estudianteData.inscripcions = inscripciones;
          functions.createActionLogMessage(db, "Estudiante", req.headers.authorization, estudianteData.id);
          res.send(estudianteData);
        }).catch(err => {
            res.status(500).send({
              message: errorMessage
            });
        });
    }).catch(err => {
      res.status(500).send({
        message: errorMessage
      });
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
        condition = {
          [Op.or]: [
            {name: {[Op.like]: `%${value}%`}},
            {lastname: {[Op.like]: `%${value}%`}}
          ]
        }
    }
    if(parameter == 'ci') {
        condition = {ci: {[Op.like]: `%${value}%`}};
    }
    if(parameter == 'nro_telefono') {
        condition = {phone: {[Op.like]: `%${value}%`}};
    }
    if(parameter == 'nro_movil') {
        condition = {mobile: {[Op.like]: `%${value}%`}};
    }
    if(parameter == 'nro_expediente') {
        condition = {nro_expediente: {[Op.like]: `%${value}%`}};
    }
    if(parameter == 'ref') {
      condition = {id: parseInt(value)};
    }
  }

  //let searchConfig = {include: [{model: db.person, where: condition}], limit:limit};

  let searchConfig = {include: [{model: db.person}], limit:limit};
  if(!['nro_expediente', 'ref'].includes(parameter)) {
    searchConfig.include[0]['where'] = condition;
  } else {
    if(parameter != undefined) {
      searchConfig['where'] = condition;
    }
  }
  Estudiante.findAll(searchConfig)
  .then((data) => {res.send(data)})
  .catch(err => {
    res.status(500).send({
      message:
        err.message || "Ocurrió un error durante la busqueda del estudiante."
    });
  });
};

exports.findOne = (req, res) => {
  const id = req.params.id;
  Estudiante.findOne({include: [
      {model: db.person}, 
      {model: db.inscripcion, include: [
        {model: db.seccion, include: [{model: db.carrera_universitaria}
      ]}]}
    ], where: {id: id}, paranoid: true})
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `No se pudo encontrar al estudiante.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Ocurió un error inesperado... Intentelo mas tarde."
      });
    });
};

exports.searchBarBySeccion = async (req, res) => {
  const value = req.query.value;
  const seccion_id = req.query.seccion_id;
  let queryRes = await db.sequelize.query(`
      SELECT 
        e.id AS id,
        p.ci_type AS ci_type, 
        p.ci AS ci,
        p.name AS nombre,
        p.lastname AS apellido,
        CONCAT(p.ci_type, '-', p.ci, ' ', p.name, ' ', p.lastname) AS ci_nombre
      FROM inscripcion AS i
      INNER JOIN estudiante AS e ON e.id = i.estudiante_id
      INNER JOIN person AS p ON p.id = e.id_persona
      WHERE i.seccion_id = ${seccion_id}
      AND CONCAT(p.ci_type, '-', p.ci, ' ', p.name, ' ', p.lastname) LIKE '%${value}%'
      AND i.deleted_at IS NULL
      AND e.deleted_at IS NULL
      AND p.deleted_at IS NULL
    `,
  );
  res.status(200).send({data: queryRes});
}

exports.update = async (req, res) => {
  const id = req.params.id;
  let bodyData = JSON.parse(req.body.data);
  let fotoCarnet = req.file;
  const validatePersonData = functions.personaFieldsValidations(bodyData.person);
  const errorMessage = "Ocurrió un error inesperado al intentar actualizar el estudiante.";
  if(validatePersonData.status != 'success') {
    res.status(400).send({message: validatePersonData.msg});
  }
  if(bodyData.updateFotoCarnet) {
    if(fotoCarnet) {
      const fotoCarnetFilepath = processImage(fotoCarnet);
      bodyData.person.foto_carnet_filename = fotoCarnetFilepath;
    } else {
      bodyData.person.foto_carnet_filename = "";
    }
  }
  let ciCondition = {where: {
    [Op.and]: [
      {ci: {[Op.eq]: bodyData.person.ci}}, 
      {id: {[Op.ne]: bodyData.id_persona}}
    ]
  }};
  const personaSearch = await Person.findAll(ciCondition);
  if(personaSearch.length > 0) {
    res.status(400).send({
        message: `La persona con la cédula de identidad ${bodyData.person.ci} ya está creada previamente en el sistema.`
    });
    return
  }
  
  const estudianteSearch = await Estudiante.findAll({where: {
      [Op.and]: [
        {nro_expediente: {[Op.eq]: bodyData.nro_expediente}}, 
        {id: {[Op.ne]: id}}
      ]
  }});

  if(estudianteSearch.length > 0) {
    res.status(400).send({
        message:`El estudiante con el número de expediente ${bodyData.nro_expediente} ya esta creado previamente en el sistema.`
    });
    return
  }

  Person.update(bodyData.person, {
    where: { id: bodyData.id_persona }
  }).then(num => {
    if (num != 1) {
      res.status(400).send({message: errorMessage});
    } else {
      Estudiante.update({nro_expediente: bodyData.nro_expediente, year_ingreso: bodyData.year_ingreso}, {where: { id: id }})
      .then(num => {
          let inscripciones_deleted = [];
          let inscripciones_create = [];
          if(bodyData.nuevas_secciones.length > 0) {
            bodyData.nuevas_secciones.map(async (item) => {
              let inscripcionCreate = await db.inscripcion.create({estudiante_id: id, seccion_id: item.id});
              inscripciones_create.push(inscripcionCreate);
            }) 
          }
          if(bodyData.secciones_eliminar.length > 0) {
            bodyData.secciones_eliminar.map(async (item) => {
              await db.inscripcion.destroy({where: {id: item.id}});
              inscripciones_deleted.push(item.id);
            }) 
          }
          if(num == 1) {
            functions.updateActionLogMessage(db, "Estudiante", req.headers.authorization, id);
            res.send({message: "El estudiante fue actualizado satisfactoriamente!!"});
          } else {
            res.status(400).send({message: errorMessage});
          }
      }).catch(err => {
          res.status(500).send({message: errorMessage});
      });
    }
  }).catch(err => {
    res.status(500).send({message: errorMessage});
  });
};

exports.delete = async (req, res) => {
  const id = req.params.id;
  try {
    const estudianteSearch = await Estudiante.findAll({where: {id: id}, include: [{model: db.inscripcion}], limit:1});
    if(estudianteSearch.length > 0) {
      estudianteSearch[0].dataValues.inscripcions.map(async (item) => {
        await db.inscripcion.destroy({where: {id: item.id}});
      }) 
    }
  } catch(err) {
    res.status(500).send({
      message: "No se pudo eliminar al estudiante. Esto es debido a que una o varias inscripciones estan asociadas a algun registro."
    });
    return
  }
  Estudiante.destroy({
    where: { id: id },
    individualHooks: true
  })
    .then(num => {
      if (num == 1) {
        functions.deleteActionLogMessage(db, "Estudiante", req.headers.authorization, id);
        res.send({
          message: "El estudiante fue eliminado exitosamente!!"
        });
      } else {
        res.send({
          message: `No se pudo eliminar al estudiante.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "No se pudo eliminar al estudiante"
      });
    });
};