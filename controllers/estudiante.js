const fs = require('fs');
const db = require("../models");
const functions = require('../routes/functions');
const Person = db.person;
const Estudiante = db.estudiante;
const Op = db.Sequelize.Op;

exports.create = async (req, res) => {
  let bodyData = JSON.parse(req.body.data);
  let fotoCarnet = req.file;
  const validatePersonData = functions.personaFieldsValidations(bodyData.person);
  const errorMessage = "Ocurrió un error inesperado al intentar crear a el estudiante.";
  
  //validaciones de campos
  if(validatePersonData.status != 'success') {
    res.status(400).send({message: validatePersonData.msg});
  }

  
  if(bodyData.uploadFotoCarnet) {
    if(fotoCarnet) {
      var imageData = fs.readFileSync(fotoCarnet.path);
      bodyData.person.foto_carnet = imageData;
    } else {
      bodyData.person.foto_carnet = null;
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
        Estudiante.create(estudianteData).then(data => {
            estudianteData.person = personData.dataValues;
            estudianteData.id = data.dataValues.id;
            res.send(estudianteData);
        }).catch(err => {
            res.status(500).send({
              message: "Ocurrió un error inesperado al momento de crear al estudiante."
            });
        });
    }).catch(err => {
      res.status(500).send({
        message: "Ocurrió un error inesperado al momento de crear al estudiante."
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
  Estudiante.findOne({include: [{model: db.person}], where: {id: id}})
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `No se pudo encontrar al estudiante con la referencia ${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Ocurió un error inesperado... Intentelo mas tarde."
      });
    });
};

// Update a student details by the id in the request
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
      var imageData = fs.readFileSync(fotoCarnet.path);
      bodyData.person.foto_carnet = imageData;
    } else {
      bodyData.person.foto_carnet = null;
    }
  }
  const personaSearch = await Person.findAll({where:{
    [Op.and]: [
      {ci: {[Op.eq]: bodyData.person.ci}}, 
      {id: {[Op.ne]: id}}
    ]
  }});

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
          if(num == 1) {
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

// remove a Person with the given id 
exports.delete = (req, res) => {
  const id = req.params.id;

  Person.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Successfully deleted student!"
        });
      } else {
        res.send({
          message: `Something went wrong!Can't delete Person with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Can't delete Person with id=" + id
      });
    });
};