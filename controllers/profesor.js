const fs = require('fs');
const db = require("../models");
const functions = require('../routes/functions');
const Person = db.person;
const Profesor = db.profesor;
const Op = db.Sequelize.Op;

const processImage = (file) => {
  const fileRead = fs.readFileSync(file.path);
  const filename = functions.getFileName(file);
  const filePath = `src/fileUploads/${filename}`;
  fs.writeFileSync(filePath, fileRead);
  fs.unlinkSync(file.path);
  return filename;
}

exports.profesorPorNombre = async (req, res) => {
  try {
    let query = `
        SELECT 
          pro.id AS id,
          CONCAT(p.name, ' ', p.lastname, ' - CI: ', p.ci_type, '-', p.ci) AS name
      FROM profesor AS pro
      INNER JOIN person AS p ON p.id = pro.id_persona
      WHERE CONCAT(p.name, ' ', p.lastname, ' - CI: ', p.ci_type, '-', p.ci) LIKE '%${req.params.val}%' 
      AND pro.deleted_at IS NULL 
      AND p.deleted_at IS NULL
    `;
    let recordsSearch = await db.sequelize.query(query);
    if(recordsSearch[0].length > 0) {
      res.status(200).send(recordsSearch[0]);
      return;
    }
    res.status(404).send();
  } catch(err) {
    console.log(err);
    res.status(500).send();
  }
  return false;
}

exports.create = async (req, res) => {
  let bodyData = JSON.parse(req.body.data);
  let fotoCarnet = req.file;
  const validatePersonData = functions.personaFieldsValidations(bodyData.person);
  const errorMessage = "Ocurrió un error inesperado al intentar crear a el profesor.";
  
  //validaciones de campos
  if(validatePersonData.status != 'success') {
    res.status(400).send({message: validatePersonData.msg});
  }

  
  if(bodyData.uploadFotoCarnet) {
    if(fotoCarnet) {
      const imgFilename = processImage(fotoCarnet);
      bodyData.person.foto_carnet_filename = imgFilename;
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

  //guarda al profesor
  Person.create(bodyData.person)
    .then(personData => {
        let profesorData = {
          id_persona: personData.dataValues.id,
          grado_instruccion: bodyData.grado_instruccion
        }
        Profesor.create(profesorData).then(data => {
            profesorData.person = personData.dataValues;
            profesorData.id = data.dataValues.id;
            functions.createActionLogMessage(db, "Profesor", req.headers.authorization, profesorData.id);
            res.send(profesorData);
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
  Profesor.findAll(searchConfig)
  .then((data) => {res.send(data)})
  .catch(err => {
    res.status(500).send({
      message:
        err.message || "Ocurrió un error durante la busqueda del profesor."
    });
  });
};

exports.findOne = (req, res) => {
  const id = req.params.id;
  Profesor.findOne({include: [{model: db.person}], where: {id: id}, paranoid: true})
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `No se pudo encontrar al profesor.`
        });
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
  let bodyData = JSON.parse(req.body.data);
  let fotoCarnet = req.file;
  const validatePersonData = functions.personaFieldsValidations(bodyData.person);
  const errorMessage = "Ocurrió un error inesperado al intentar actualizar el profesor.";
  if(validatePersonData.status != 'success') {
    res.status(400).send({message: validatePersonData.msg});
  }
  if(bodyData.updateFotoCarnet) {
    if(fotoCarnet) {
      const imgFilename = processImage(fotoCarnet);
      bodyData.person.foto_carnet_filename = imgFilename;
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
  
  Person.update(bodyData.person, {
    where: { id: bodyData.id_persona }
  }).then(num => {
    if (num != 1) {
      res.status(400).send({message: errorMessage});
    } else {
       Profesor.update({grado_instruccion: bodyData.grado_instruccion}, {where: { id: id }})
      .then(num => {
          if(num == 1) {
            functions.updateActionLogMessage(db, "Profesor", req.headers.authorization, id);
            res.send({message: "El profesor fue actualizado satisfactoriamente!!"});
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

exports.delete = (req, res) => {
  const id = req.params.id;
  Profesor.destroy({
    where: { id: id },
    individualHooks: true
  })
    .then(num => {
      if (num == 1) {
        functions.deleteActionLogMessage(db, "Profesor", req.headers.authorization, id);
        res.send({
          message: "El profesor fue eliminado exitosamente!!"
        });
      } else {
        res.send({
          message: `No se pudo eliminar al profesor.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "No se pudo eliminar al profesor"
      });
    });
};