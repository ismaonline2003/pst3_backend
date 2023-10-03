const db = require("../models");
const Person = db.person;
const Estudiante = db.estudiante;
const Op = db.Sequelize.Op;

exports.create = async (req, res) => {
  const personData = {
    name: req.body.name,
    lastname: req.body.lastname,
    ci: req.body.ci,
    phone: req.body.phone,
    mobile: req.body.mobile,
    address: req.body.address
  };
  const estudianteData = {
    id_persona: 0,
    nro_expediente:  req.body.nro_expediente
  }
  const personaSearch = await Person.findAll({where: {ci: personData.ci}});
  if(personaSearch) {
    res.status(400).send({
        message:
          err.message || `La persona con la cédula de identidad ${personData.ci} ya esta creada previamente en el sistema.`
    });
    return
  }
  const estudianteSearch = await Estudiante.findAll({where: {nro_expediente: estudianteData.nro_expediente}});
  if(estudianteSearch) {
    res.status(400).send({
        message:
          err.message || `El estudiante con el número de expediente ${estudianteData.nro_expediente} ya esta creado previamente en el sistema.`
    });
    return
  }

  // Save student in the database
  Person.create(personData)
    .then(data => {
        estudianteData.id_persona = data.id;
        Estudiante.create(estudianteData)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
              message:
                err.message || "Ocurrió un error al momento de crear al estudiante."
            });
        });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Ocurrió un error al momento de crear al estudiante."
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

//search a single Person with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Person.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Person with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Person with id=" + id
      });
    });
};

// Update a student details by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  Person.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Successfully Updated Person."
        });
      } else {
        res.send({
          message: `Can't update student with id=${id}.Something has gone wrong!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Can't update Person with id=" + id
      });
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