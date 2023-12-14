const db = require("../models");
const User = db.user;
const Op = db.Sequelize.Op;
const functions = require('../routes/functions')

//Insert new User
exports.create = (req, res) => {
    const bcrypt = require("bcrypt");
    let userDbPassword = req.body.password;
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(userDbPassword, salt, function(err, hash) {
          // Store hash in the database
          // Create an User
          const user = {
            login: req.body.login,
            password: hash,
            person_id: req.body.person_id
          };
          // Save student in the database
          User.create(user).then(data => {
              res.send(data);
            })
            .catch(err => {
              res.status(500).send({
                message:
                  err.message || "Error occurred while creating the User."
              });
            });
      });
    })
    if (!req.body.login) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
        return;
    }
};

// Retrieve all users
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
      if(parameter == 'login') {
          condition = {login: {[Op.like]: `%${value}%`}};
      }
      if(parameter == 'verificado') {
          let verificado = false;
          condition = {verifiedDate: {[Op.is]: null}};
          if(value == "1") {
            condition = {verifiedDate: {[Op.not]: null}};
          }
      }
      if(parameter == 'nombre') {
        let userIds = await functions.searchUserByPersonName(db, value);
        condition = {id: {[Op.in]: userIds}};
      }
  }

  let searchConfig = {where: condition, include: [{model: db.person}], limit:limit};

  User.findAll(searchConfig)
  .then((data) => {
      res.send(data)
  })
  .catch(err => {
      res.status(500).send({message: "Ocurrió un error durante la busqueda de los usuarios"});
  });
};

//search a single user with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  User.findByPk(id, {include: [{model: db.person}]})
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `No se pudo encontrar a el usuario con la referencia ${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Ocurrió un error inesperado durante la busqueda del usuario"
      });
    });
};

// Update a student details by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  User.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Successfully Updated User."
        });
      } else {
        res.send({
          message: `Can't update student with id=${id}.Something has gone wrong!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Can't update User with id=" + id
      });
    });
};

// remove a User with the given id 
exports.delete = (req, res) => {
  const id = req.params.id;

  User.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Successfully deleted student!"
        });
      } else {
        res.send({
          message: `Something went wrong!Can't delete User with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Can't delete User with id=" + id
      });
    });
  }

// login a User with the given id 
exports.login = (req, res) => {
    const bcrypt = require("bcrypt");
    const jwt = require('jsonwebtoken');
    const login = req.body.login;
    const password = req.body.password;
    User.findAll({
      include: [{model: db.person}],
      where: {
        login: {
          [Op.eq]: login
        }
      }
    }).then(data => {
        bcrypt.compare(password, data[0].dataValues.password, function(err, result) {
          if(result) {
              let currentTime = new Date();
              jwt.sign({
                "userid": `${data[0].id}`,
                "username": data[0].login,
                "iat": currentTime.getTime(),
                "iat": currentTime.getTime()
              }, 'secret_key', {expiresIn: '10h'}, (err,token) => {
                  if(err){
                    res.status(500).send({
                      message: "Ocurrió un error durante el proceso... Vuelva a intentarlo mas tarde",
                      error: err
                    });
                  } else {
                    currentTime.setHours(currentTime.getHours() + 10);
                    res.status(200).send({
                      message: "El usuario se ha logeado exitosamente!!",
                      token: token,
                      expiration_time: currentTime.getTime(),
                      userData: data[0]
                    });
                  }
              });
          } else {
            res.status(400).send({
              message: "Login fallido. El login o la contraseña son incorrectos."
            });
          }
        });
      })
    .catch(err => {
      res.status(500).send({
        message: "Ocurrió un error durante el proceso... Vuelva a intentarlo mas tarde",
        error: err
      });
    });
};

exports.logout = (req, res) => {
  const authHeader = req.headers["authorization"];
  jwt.sign(authHeader, "", { expiresIn: 1 } , (logout, err) => {
     if (logout) {
        res.send({msg : 'Has sido desconectado' });
     } else {
        res.send({msg:'Error'});
     }
  });
}