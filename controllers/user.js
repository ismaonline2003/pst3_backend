const db = require("../models");
const User = db.user;
const UserRequest = db.user_request;
const Op = db.Sequelize.Op;
const functions = require('../routes/functions')
const nodeMailerConfig = require('../config/nodemailer_config');


const personaFieldsValidations = async (data) => {
  let objReturn = {status: 'success', msg: '', data: ''}
  const whiteSpacesRegEx = /\s/g;
  const numbersRegEx = /\d/g;
  const onlyLettersRegEx =  /^[A-Za-z]+$/g;
  const lettersRegEx =  /[A-Za-z]/g;
  const ciTypes = ["V", "J", "E", "P"];
  const sexoOptions = ["M", "F"];
  const personSearch = await db.person.findAll({where: {ci: data.ci}});
  
  if(personSearch.length > 0) {
    objReturn = {status: 'already_exists', msg: `La persona con la cédula "${data.ci}" ya está registrada en el sistema.`, data: {}};
    return objReturn;
  }

  //ci type validations    
  if(!ciTypes.includes(data.ci_type)) {
      objReturn = {status: 'error', msg: 'El tipo de número de cédula debe ser uno de los siguientes: V, J, E, P.'}
      return objReturn;
  }

  //sexo validations
  if(!sexoOptions.includes(data.sexo)) {
      objReturn = {status: 'error', msg: 'Debe elegir entre los sexo Masculino y Femenino.'}
      return objReturn;
  }

  //ci validations
  if(whiteSpacesRegEx.test(data.ci)) {
      objReturn = {status: 'error', msg: 'El número de cédula no puede contener espacios en blanco.'}
      return objReturn;
  }
  if(isNaN(parseInt(data.ci))) {
      objReturn = {status: 'error', msg: 'El número de cédula solo puede contener números.'}
      return objReturn;
  }
  if(data.ci == "0") {
      objReturn = {status: 'error', msg: 'El número de cédula no puede ser 0.'}
      return objReturn;
  }
  if(data.ci.length > 9) {
      objReturn = {status: 'error', msg: 'El número de cédula no puede superar los 9 caracteres.'}
      return objReturn;
  }
  if(data.ci == "") {
      objReturn = {status: 'error', msg: 'El  número de cédula no puede estar vacío.'}
      return objReturn;
  }

  //name validations
  if(whiteSpacesRegEx.test(data.name)) {
      objReturn = {status: 'error', msg: 'El nombre no puede contener espacios en blanco.'}
      return objReturn;
  }
  if(numbersRegEx.test(data.name)) {
      objReturn = {status: 'error', msg: 'El nombre no puede contener números.'}
      return objReturn;
  }
  if(!data.name.match(onlyLettersRegEx)) {
      objReturn = {status: 'error', msg: 'El nombre solo puede contener letras.'}
      return objReturn;
  }
  if(data.name.length > 20) {
      objReturn = {status: 'error', msg: 'El nombre no puede superar los 20 caracteres.'}
      return objReturn;
  }
  if(data.name == "") {
      objReturn = {status: 'error', msg: 'El nombre no puede estar vacío.'}
      return objReturn;
  }

  //lastname validations
  if(whiteSpacesRegEx.test(data.lastname)) {
      objReturn = {status: 'error', msg: 'El apellido no puede contener espacios en blanco.'}
      return objReturn;
  }
  if(numbersRegEx.test(data.lastname)) {
      objReturn = {status: 'error', msg: 'El apellido no puede contener números.'}
      return objReturn;
  }
  if(!data.lastname.match(onlyLettersRegEx)) {
      objReturn = {status: 'error', msg: 'El apellido solo puede contener letras.'}
      return objReturn;
  }
  if(data.lastname.length > 20) {
      objReturn = {status: 'error', msg: 'El apellido no puede superar los 20 caracteres.'}
      return objReturn;
  }
  if(data.lastname == "") {
      objReturn = {status: 'error', msg: 'El apellido no puede estar vacío.'}
      return objReturn;
  }

  //phone validations
  if(whiteSpacesRegEx.test(data.phone)) {
      objReturn = {status: 'error', msg: 'El número de telefono no puede contener espacios en blanco.'}
      return objReturn;
  }
  if(data.phone.match(lettersRegEx)) {
      objReturn = {status: 'error', msg: 'El número de telefono no puede contener letras.'}
      return objReturn;
  }
  if(data.phone.length > 15) {
      objReturn = {status: 'error', msg: 'El número de telefono no puede superar los 15 digitos.'}
      return objReturn;
  }
  if(data.phone == "") {
      objReturn = {status: 'error', msg: 'El número de teléfono no puede estar vacío.'}
      return objReturn;
  }

  //mobile validations
  if(data.mobile) {
      if(whiteSpacesRegEx.test(data.mobile)) {
          objReturn = {status: 'error', msg: 'El número de telefono móvil no puede contener espacios en blanco.'}
          return objReturn;
      }
      if(data.mobile.match(lettersRegEx)) {
          objReturn = {status: 'error', msg: 'El número de telefono móvil no puede contener letras.'}
          return objReturn;
      }
      if(data.mobile.length > 15) {
          objReturn = {status: 'error', msg: 'El número de telefono móvil no puede superar los 15 digitos.'}
          return objReturn;
      }
  }

  let birthDate = new Date(data.birthdate);
  let currentDate = new Date();
  if(isNaN(birthDate)) {
      objReturn = {status: 'error', msg: 'Debe establecer una fecha de nacimiento.'}
      return objReturn;
  }
  if(birthDate instanceof Date) {
      if(birthDate > currentDate) {
          objReturn = {status: 'error', msg: 'La fecha de nacimiento no puede ser mayor a la fecha actual.'}
          return objReturn;
      }
  }
  
  return objReturn;
}

const userCreateValidations = async (data) => {
  let objReturn = {status: 'success', message: '', data: {}};
  const emailRegExp =  /^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/g;
  const specialCharactersAllowed = /[!@#$%&*?]/;
  const specialCharsNotAllowed = /[^()_+\-=\[\]{};':"\\|,.<>\/~]/g;
  const userSearch = await User.findAll({where: {login: data.login}});
  
  if(userSearch.length > 0) {
    objReturn = {status: 'already_exists', msg: `El email "${data.login}" ya está en uso.`, data: {}};
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


const passwordValidations = (password, passwordRepeated) => {
  let objReturn = {status: 'success', message: '', data: {}};
  const specialCharactersAllowed = /[!@#$%&*?]/;
  
  if(password.length < 12) {
    objReturn = {status: 'failed', data: {}, msg: 'La contraseña debe tener un mínimo 12 caracteres.'};
    return objReturn;
  }

  if(/\s/.test(password)) {
      objReturn = {status: 'failed', data: {}, msg: 'La contraseña no puede tener espacios en blanco.'};
      return objReturn;
  }

  if(!/[A-Z]/.test(password)) {
      objReturn = {status: 'failed', data: {}, msg: 'La contraseña debe tener al menos una letra mayúscula.'};
      return objReturn;
  }

  if(!/[a-z]/.test(password)) {
      objReturn = {status: 'failed', data: {}, msg: 'La contraseña debe contener letras minusculas.'};
      return objReturn;
  }

  if(!/\d/.test(password)) {
      objReturn = {status: 'failed', data: {}, msg: 'La contraseña debe contener al menos un caracter numérico.'};
      return objReturn;
  }

  if(!specialCharactersAllowed.test(password)) {
      objReturn = {status: 'failed', data: {}, msg: `La contraseña debe contener al menos uno de los siguientes caracteres especiales: !@#$%&*?`};
      return objReturn;
  }

  if(password != passwordRepeated) {
      objReturn = {status: 'failed', data: {}, msg: `Ambas contraseñas deben ser iguales.`};
      return objReturn;
  }
  return objReturn;
}

const signupValidations = async (data) => {
  let objReturn = {status: 'success', message: '', data: {}};
  const emailRegExp =  /^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/g;
  const specialCharactersAllowed = /[!@#$%&*?]/;
  const specialCharsNotAllowed = /[^()_+\-=\[\]{};':"\\|,.<>\/~]/g;
  const userData = data.userData;
  const personValidations = await personaFieldsValidations(data.personData);
  const userSearch = await User.findAll({where: {login: userData.login}});
  
  if(personValidations.status != 'success') {
    return personValidations;
  }

  if(userSearch.length > 0) {
    objReturn = {status: 'already_exists', msg: `El email "${userData.login}" ya está en uso.`, data: {}};
    return objReturn;
  }

  if(userData.login.trim() == "") {
      objReturn = {'status': 'failed', 'data': {}, 'msg': 'Se debe definir un email valido para el usuario.'};
      return objReturn;
  }
  
  if(!emailRegExp.test(userData.login)) {
      objReturn = {status: 'failed', data: {}, msg: 'El correo electrónico especificado es inválido.'};
      return objReturn;
  }
  if(userData.password.length < 12) {
      objReturn = {status: 'failed', data: {}, msg: 'La contraseña debe tener un mínimo 12 caracteres.'};
      return objReturn;
  }

  if(/\s/.test(userData.password)) {
      objReturn = {status: 'failed', data: {}, msg: 'La contraseña no puede tener espacios en blanco.'};
      return objReturn;
  }

  if(!/[A-Z]/.test(userData.password)) {
      objReturn = {status: 'failed', data: {}, msg: 'La contraseña debe tener al menos una letra mayúscula.'};
      return objReturn;
  }

  if(!/[a-z]/.test(userData.password)) {
      objReturn = {status: 'failed', data: {}, msg: 'La contraseña debe contener letras minusculas.'};
      return objReturn;
  }

  if(!/\d/.test(userData.password)) {
      objReturn = {status: 'failed', data: {}, msg: 'La contraseña debe contener al menos un caracter numérico.'};
      return objReturn;
  }

  if(!specialCharactersAllowed.test(userData.password)) {
      objReturn = {status: 'failed', data: {}, msg: `La contraseña debe contener al menos uno de los siguientes caracteres especiales: !@#$%&*?`};
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
      <a href="${nodeMailerConfig.frontend_url}/userVerification/${userData.id}" target="_blank">Enlace de Verificación</a>
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

const userSignupMail = (data) => {
  const mailOptions = {
    from: nodeMailerConfig.email,
    to: data.userData.login,
    subject: `Registro de usuario, ${nodeMailerConfig.platform_name}`,
    text: `
      Buenos dias estimado ${data.personData.name} ${data.personData.lastname}.
      <br/>
      <br/>
      Hemos recibido su solicitud de registro de usuario en nuestra plataforma<br/>
      Para verificar su usuario debe hacer click en el siguiente enlace<br/>
      <a href="${nodeMailerConfig.frontend_url}/userVerification/${data.userData.id}" target="_blank">Enlace de Verificación</a>
    `
  };
  nodeMailerConfig.transporter.sendMail(mailOptions, function(err, mailData) {
    if (err) {
      console.log("Error " + err);
    } else {
      console.log("Email sent successfully");
    }
  });
}

const userResetPasswordRequest = (userData, requestID, requestHash) => {
  const mailOptions = {
    from: nodeMailerConfig.email,
    to: userData.login,
    subject: `Solicitud de Recuperación de Contraseña, ${nodeMailerConfig.platform_name}`,
    text: `
      Buenos dias estimado ${userData.person.name} ${userData.person.lastname}.
      <br/>
      <br/>
      Hemos recibido su solicitud de recuperación de contraseña de usuario<br/>
      Para recuperar su contraseña debe hacer click en el siguiente enlace<br/>
      <a href="${nodeMailerConfig.frontend_url}/userPasswordResetRequest/${requestID}" target="_blank">Recuperar Contraseña</a>
    `
  };
  nodeMailerConfig.transporter.sendMail(mailOptions, function(err, mailData) {
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

  if(isNaN(id)) {
    res.status(404).send();
    return;
  }

  const userSearch = await User.findByPk(parseInt(id));
  const unexpectedErrorMessage = "Ocurrió un error inesperado durante la verificación del usuario... Vuelva a intentarlo mas tarde.";
  
  if(!userSearch) {
    res.status(404).send();
    return;
  }

  if(userSearch.dataValues.verifiedDate && userSearch.dataValues.verifiedToken) {
    res.status(400).send();
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
      
        User.update(bodyData, {where: {id: parseInt(id)}})
        .then(async num => {
          if (num == 1) {
            res.status(200).send();
          } else {
            res.status(400).send();
          }
        })
        .catch(err => {
          res.status(500).send();
        });
    })
  });
}

exports.recoverPasswordRequest = async (req, res) => {
  const bcrypt = require("bcrypt");
  const email = req.params.email;
  const unexpectedErrorMessage = "Ocurrió un error inesperado durante la verificación del usuario... Vuelva a intentarlo mas tarde.";
  const currentDateTime = new Date();

  if(email.trim() == "") {
    res.status(404).send();
    return;
  }

  const userSearch = await User.findAll({where: {login: email}, include: [{model: db.person}], limit:1});
  
  if(userSearch.length == 0) {
    res.status(404).send();
    return;
  }

  const resetPasswordRequestSearch = await UserRequest.findAll({where: {user_id: userSearch[0].dataValues.id, r_type: 'password_reset', request_done: false}, limit:1});
  if(resetPasswordRequestSearch.length > 0) {
    const timeDiff = new Date(resetPasswordRequestSearch[0].dataValues.created_at).getTime() - currentDateTime.getTime(); 
    const hoursDiff = ((timeDiff/1000)/60)/60;
    if(hoursDiff > 24) {
      await UserRequest.destroy({where: { id: resetPasswordRequestSearch[0].dataValues.id }});
    } else {
      userResetPasswordRequest(userSearch[0].dataValues, resetPasswordRequestSearch[0].dataValues.id, resetPasswordRequestSearch[0].dataValues.request_hash);
      res.status(400).send();
      return;
    }
  }

  const key = `${userSearch[0].dataValues.login}_${currentDateTime.getDay()}${currentDateTime.getMonth()+1}${currentDateTime.getFullYear()}${currentDateTime.getHours()}${currentDateTime.getMinutes()}${currentDateTime.getSeconds()}_${userSearch[0].dataValues.id}`;

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(key, salt, function(err, hash) {
      UserRequest.create({
        user_id: userSearch[0].dataValues.id,
        request_hash: hash,
        r_type: 'password_reset'
      })
      .then((requestCreationData) => {
        userResetPasswordRequest(userSearch[0].dataValues, requestCreationData.dataValues.id, requestCreationData.dataValues.request_hash);
        res.status(200).send();
      })
      .catch((err) => {
        res.status(500).send();
      })
    })
  })
}

exports.passwordReset = async (req, res) => {
  const bcrypt = require("bcrypt");
  const body = req.body;
  const currentDateTime = new Date();
  const validations = passwordValidations(body.password, body.password_repeated);
  if(validations.status != 'success') {
    res.status(400).send({message: validations.msg});
  }
  const resetPasswordRequestSearch = await UserRequest.findAll({where: {id: body.id, r_type: 'password_reset', request_done: false}, limit:1});
  if(resetPasswordRequestSearch.length > 0) {
    const timeDiff = new Date(resetPasswordRequestSearch[0].dataValues.created_at).getTime() - currentDateTime.getTime(); 
    const hoursDiff = ((timeDiff/1000)/60)/60;
    if(hoursDiff > 24) {
      res.status(400).send({message: "La solicitud de recuperación de contraseña ha expirado"});
      return;
    }
  } else {
    res.status(404).send();
    return;
  }

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(body.password, salt, async function(err, hash) {
      const userUpdate = await User.update({
        password: hash
      }, {where: {id: resetPasswordRequestSearch[0].dataValues.user_id}})

      UserRequest.update({
        request_done: true,
        request_done_date: currentDateTime
      }, {where: {id: resetPasswordRequestSearch[0].dataValues.id}})
      .then((UserRequestUpdate) => {
        res.status(200).send();
      })
      .catch((err) => {
        res.status(500).send();
      });

    });
  });
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
      include: [{model: db.person}, {model: db.suscripcion}],
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
                    db.logs_sistema.create({
                      user_id: data[0].id,
                      tipo: 'inicio_sesion',
                      fecha: new Date()
                    });
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

exports.signup = async (req, res) => {
  const bcrypt = require("bcrypt");
  const jwt = require('jsonwebtoken');
  const defaultErrorMessage = "Ocurrió un error inesperado durante el registro de usuario... Vuelva a intentarlo mas tarde";
  const validations = await signupValidations(req.body);
  if(validations.status != 'success') {
    console.log(validations);
    res.status(400).send({message: validations.msg});
    return;
  }
  const login = req.body.userData.login;
  const password = req.body.userData.password;
  const personData = req.body.personData;
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
        const personCreate = await db.person.create(personData);
        let user = {
          login: login,
          password: hash,
          person_id: personCreate.dataValues.id,
          rol: 'E'
        };
        User.create(user)
        .then(async userData => {
          let userSingupData = req.body;
          userSingupData.userData.id = userData.dataValues.id;
          userSingupData.personData.id = userData.dataValues.person_id;
          userSignupMail(userSingupData);
          res.send({status: 'success', message: userSingupData});
        })
        .catch(err => {
          res.status(500).send({message: defaultErrorMessage});
        });
    })
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