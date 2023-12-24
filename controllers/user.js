const db = require("../models");
const User = db.user;
const Op = db.Sequelize.Op;
const functions = require('../routes/functions')
const nodeMailerConfig = require('../config/nodemailer_config');

const userCreateValidations = async (data) => {
  let objReturn = {status: 'success', message: '', data: {}};
  const emailRegExp =  /^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/g;
  const specialCharactersAllowed = /[!@#$%&*?]/;
  const specialCharsNotAllowed = /[^()_+\-=\[\]{};':"\\|,.<>\/~]/g;
  const userSearch = await User.findAll({where: {login: data.login}});
  
  if(userSearch.length > 0) {
    objReturn = {status: 'already_exists', message: `El email "${data.login}" ya está en uso.`, data: {}};
    return objReturn;
  }

  if(data.login.trim() == "") {
      objReturn = {'status': 'failed', 'data': {}, 'msg': 'Se debe definir un email valido para el usuario.'};
      return objReturn;
  }
  
  if(!emailRegExp.test(data.login)) {
      objReturn = {status: 'failed', data: {}, msg: 'El correo electrónico especificado es inválido.'};
      return objReturn;
  }
  if(!data.id_persona) {
      objReturn = {status: 'failed', data: {}, msg: 'Debe seleccionar una persona para el usuario.'};
      return objReturn;
  }
  if(data.password.length < 12) {
      objReturn = {status: 'failed', data: {}, msg: 'La contraseña debe tener un mínimo 12 caracteres.'};
      return objReturn;
  }

  if(/\s/.test(data.password)) {
      objReturn = {status: 'failed', data: {}, msg: 'La contraseña no puede tener espacios en blanco.'};
      return objReturn;
  }

  if(!/[A-Z]/.test(data.password)) {
      objReturn = {status: 'failed', data: {}, msg: 'La contraseña debe tener al menos una letra mayúscula.'};
      return objReturn;
  }

  if(!/[a-z]/.test(data.password)) {
      objReturn = {status: 'failed', data: {}, msg: 'La contraseña debe contener letras minusculas.'};
      return objReturn;
  }

  if(!/\d/.test(data.password)) {
      objReturn = {status: 'failed', data: {}, msg: 'La contraseña debe contener al menos un caracter numérico.'};
      return objReturn;
  }

  if(!specialCharactersAllowed.test(data.password)) {
      objReturn = {status: 'failed', data: {}, msg: `La contraseña debe contener al menos uno de los siguientes caracteres especiales: !@#$%&*?`};
      return objReturn;
  }
  
  if(data.password != data.password_repeat) {
      objReturn = {status: 'failed', data: {}, msg: `Ambas contraseñas deben ser iguales.`};
      return objReturn;
  }

  if(!["A","P","ER","E"].includes(data.rol)) {
    objReturn = {status: 'failed', data: {}, msg: `El rol de usuario es inválido, debe seleccionar uno de los siguientes roles: "Administrador", "Profesor", "Emisor de Radio", "Espectador"`};
    return objReturn;
  }

  return objReturn;
}

const userUpdateValidations = async (data, id) => {
  let objReturn = {status: 'success', message: '', data: {}};
  const emailRegExp =  /^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/g;
  const specialCharactersAllowed = /[!@#$%&*?]/;
  const specialCharsNotAllowed = /[^()_+\-=\[\]{};':"\\|,.<>\/~]/g;
  const userSearch = await User.findAll({ where: { login: {[Op.eq]: data.login}, id: {[Op.not]: id} } });
  
  if(userSearch.length > 0) {
    objReturn = {status: 'already_exists', message: `El email "${data.login}" ya está en uso.`, data: {}};
    return objReturn;
  }

  if(data.login.trim() == "") {
      objReturn = {'status': 'failed', 'data': {}, 'msg': 'Se debe definir un email valido para el usuario.'};
      return objReturn;
  }
  
  if(!emailRegExp.test(data.login)) {
      objReturn = {status: 'failed', data: {}, msg: 'El correo electrónico especificado es inválido.'};
      return objReturn;
  }
  if(data.change_password) {
    if(data.password.length < 12) {
      objReturn = {status: 'failed', data: {}, msg: 'La contraseña debe tener un mínimo 12 caracteres.'};
      return objReturn;
    }

    if(/\s/.test(data.password)) {
        objReturn = {status: 'failed', data: {}, msg: 'La contraseña no puede tener espacios en blanco.'};
        return objReturn;
    }

    if(!/[A-Z]/.test(data.password)) {
        objReturn = {status: 'failed', data: {}, msg: 'La contraseña debe tener al menos una letra mayúscula.'};
        return objReturn;
    }

    if(!/[a-z]/.test(data.password)) {
        objReturn = {status: 'failed', data: {}, msg: 'La contraseña debe contener letras minusculas.'};
        return objReturn;
    }

    if(!/\d/.test(data.password)) {
        objReturn = {status: 'failed', data: {}, msg: 'La contraseña debe contener al menos un caracter numérico.'};
        return objReturn;
    }

    if(!specialCharactersAllowed.test(data.password)) {
        objReturn = {status: 'failed', data: {}, msg: `La contraseña debe contener al menos uno de los siguientes caracteres especiales: !@#$%&*?`};
        return objReturn;
    }
    
    if(data.password != data.password_repeat) {
        objReturn = {status: 'failed', data: {}, msg: `Ambas contraseñas deben ser iguales.`};
        return objReturn;
    }
  }

  if(!["A","P","ER","E"].includes(data.rol)) {
    objReturn = {status: 'failed', data: {}, msg: `El rol de usuario es inválido, debe seleccionar uno de los siguientes roles: "Administrador", "Profesor", "Emisor de Radio", "Espectador"`};
    return objReturn;
  }
  
  return objReturn;
}

const userCreationMail = (userData) => {
  const mailOptions = {
    from: nodeMailerConfig.email,
    to: userData.login,
    subject: `Nuevo Usuario Creado, ${nodeMailerConfig.platform_name}`,
    text: `
      Buenos dias estimado ${userData.person.name} ${userData.person.lastname}.
      <br/>
      <br/>
      Nos complace notificarle que su usuario interno dentro de la plataforma ${nodeMailerConfig.platform_name} ha sido creado exitosamente!!<br/>
      Para verificar su usuario debe hacer click en el siguiente enlace<br/>
      <a href="${nodeMailerConfig.frontend_url}/userVerificacion/${userData.id}" target="_blank">Enlace de Verificación</a>
    `
  };
  nodeMailerConfig.transporter.sendMail(mailOptions, function(err, data) {
    if (err) {
      console.log("Error " + err);
    } else {
      console.log("Email sent successfully");
    }
  });
}


exports.userVerify = async (req, res) => {
  const bcrypt = require("bcrypt");
  const id = req.params.id;
  const userSearch = await User.findByPk(id);
  const unexpectedErrorMessage = "Ocurrió un error inesperado durante la verificación del usuario... Vuelva a intentarlo mas tarde.";

  if(userSearch.length == 0) {
    res.status(404).send({'message': 'El usuario no fue encontrado.'});
    return;
  }

  if(userSearch.dataValues.verifiedDate && userSearch.dataValues.verifiedToken) {
    res.status(400).send({'message': 'El usuario ya había sido verificado previamente.'});
    return;
  }

  const currentDateTime = new Date();
  const key = `${userSearch.dataValues.login}_${currentDateTime.getDay()}${currentDateTime.getMonth()+1}${currentDateTime.getFullYear()}${currentDateTime.getHours()}${currentDateTime.getMinutes()}${currentDateTime.getSeconds()}_${id}`;
  
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(key, salt, function(err, hash) {

        const bodyData = {
          verifiedDate: currentDateTime,
          verifiedToken: hash
        }
      
        User.update(bodyData, {where: {id: id}})
        .then(async num => {
          if (num == 1) {
            res.status(200).send({message: "El usuario fue verificado satisfactoriamente!!"});
          } else {
            res.status(400).send({message: unexpectedErrorMessage});
          }
        })
        .catch(err => {
          res.status(500).send({message: unexpectedErrorMessage});
        });
    })
  })
  
}

//Insert new User
exports.create = async (req, res) => {
    const defaultErrorMessage = "Ocurrió un error inesperado durante la creación del usuario... Vuelva a intentarlo mas tarde";
    const bcrypt = require("bcrypt");
    const validations = await userCreateValidations(req.body);
    const userDbPassword = req.body.password;
    if(validations.status != 'success') {
      res.status(400).send({message: validations.message});
      return;
    }
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(userDbPassword, salt, function(err, hash) {
          // Store hash in the database
          // Create an User
          let user = {
            login: req.body.login.trim(),
            password: hash,
            person_id: req.body.id_persona,
            rol: req.body.rol
          };
          // Save student in the database
          User.create(user).then(async data => {
            user.id = data.id;
            const personData = await db.person.findAll({where: {id: user.person_id}});
            user.person = personData[0].dataValues;
            userCreationMail(user);
            functions.createActionLogMessage(db, "Usuario", req.headers.authorization, data.id);
            res.send(data);
          })
          .catch(err => {
            res.status(500).send({message:defaultErrorMessage});
          });
      });
    })
    if (!req.body.login) {
        res.status(400).send({message: defaultErrorMessage});
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
exports.update = async (req, res) => {
  const bcrypt = require("bcrypt");
  const id = req.params.id;
  const defaultErrorMessage = "Ocurrió un error inesperado durante la actualización del usuario... Vuelva a intentarlo mas tarde";
  const validations = await userUpdateValidations(req.body);
  if(validations.status != 'success') {
    res.status(400).send({message: validations.message});
    return;
  }
  const userSearch = await User.findAll({where: {id: {[Op.eq]: id} }});
  let bodyData = {
    login: req.body.login,
    rol: req.body.rol
  }
  if(bodyData.login != userSearch[0].dataValues.login) {
    bodyData.verifiedDate = null;
    bodyData.verifiedToken = null;
  }
  //cambio de contraseña
  if(req.body.change_password) {
    await bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(req.body.password, salt, (err, hash) =>{
        bodyData.password = hash;
        bodyData.verifiedDate = null,
        bodyData.verifiedToken = null;
        User.update(bodyData, {where: { id: id }})
        .then(async num => {
          if (num == 1) {
            const userSearch = await User.findAll({where: {id: {[Op.eq]: id}}, include: [{model: db.person}]});
            functions.updateActionLogMessage(db, "Usuario", req.headers.authorization, id);
            res.send({message: "El usuario fue actualizado satisfactoriamente!!", data: userSearch});
          } else {
            res.status(400).send({message: defaultErrorMessage});
          }
        })
        .catch(err => {
          res.status(500).send({message: defaultErrorMessage});
        });
          });
        });
  } else {
    User.update(bodyData, {where: { id: id }})
    .then(async num => {
      if (num == 1) {
        const userSearch = await User.findAll({where: {id: {[Op.eq]: id}}, include: [{model: db.person}]});
        functions.updateActionLogMessage(db, "Usuario", req.headers.authorization, id);
        res.send({message: "El usuario fue actualizado satisfactoriamente!!", data: userSearch});
      } else {
        res.status(400).send({message: defaultErrorMessage});
      }
    })
    .catch(err => {
      res.status(500).send({message: defaultErrorMessage});
    });
  }
};

// remove a User with the given id 
exports.delete = (req, res) => {
  const id = req.params.id;
  const defaultErrorMessage = "Ocurrió un error inesperado durante la eliminación del usuario... Vuelva a intentarlo mas tarde";

  User.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        functions.deleteActionLogMessage(db, "Usuario", req.headers.authorization, id);
        res.send({
          message: "El usuario fue eliminado satisfactoriamente!!"
        });
      } else {
        res.send({
          message: defaultErrorMessage
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: defaultErrorMessage
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