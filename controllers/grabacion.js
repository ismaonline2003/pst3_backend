const db = require("../models");
const functions = require('../routes/functions');
const Grabacion = db.emision_radio;
const Op = db.Sequelize.Op;
const jwt = require('jsonwebtoken');
const fs = require('fs');
const ffmepg = require('ffmpeg-static');
const childProcess = require('child_process');
const childProcess_audioPiecesPath = `${process.cwd()}/src/current_emision/pieces`;
const childProcess_finalEmisionsPath = `${process.cwd()}/src/radioEmisions`;
const fs_audioPiecesPath = `./src/current_emision/pieces`;
const fs_currentAudioFilePath = `./src/current_emision/current_audio.mp3`;
const fs_outputAudioFilePath = `./src/current_emision/output_audio.mp3`;

const recordValidations = (data) =>  {
  let objReturn = {'status': 'success', 'data': {}, 'msg': ''};
  if(data.titulo.trim() == "") {
      objReturn = {'status': 'failed', 'data': {}, 'msg': 'La emisión de radio debe tener un título válido'};
      return objReturn;
  }
  if(data.descripcion.trim() == "") {
      objReturn = {'status': 'failed', 'data': {}, 'msg': 'La emisión de radio debe tener una descripción válida'};
      return objReturn;
  }
  return objReturn;
}
  

exports.create = async (req, res) => {
    const bodyData = req.body;
    const validations= recordValidations(bodyData);
    const errorMessage = "Ocurrió un error inesperado al intentar crear el registro.";
    const token = req.headers["authorization"];
    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
      return;
    }
    
    let createGrabacionBody = {
      titulo: bodyData.titulo,
      descripcion: bodyData.descripcion,
      status_actual: bodyData.status_actual,
      fecha_inicio: new Date(),
      id_emisor: req.user.userid
    }
    
    Grabacion.create(createGrabacionBody)
    .then(recordRes => {
        bodyData.id = recordRes.dataValues.id;
        functions.createActionLogMessage(db, "Grabación", req.headers.authorization, recordRes.dataValues.id);
        res.status(200).send(bodyData);
    }).catch(err => {
      res.status(500).send({message: errorMessage});
    });
};

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
        if(parameter == 'nombre') {
            condition = {nombre: {[Op.like]: `%${value}%`}};
        }
        if(parameter == 'descripcion') {
            condition = {descripcion: {[Op.like]: `%${value}%`}};
        }
        if(parameter == 'emisor') {
            let emisorIds = functions.searchUserByPersonName(db, value);
            condition = {id_emisor: {[Op.in]: emisorIds}};
        }
        if(parameter == 'fecha') {
            condition = {tiempo_inicio: {[Op.like]: `%${value}%`}};
        }
    }
    condition.status_actual =  {[Op.eq]: 'finalizada'};
    let searchConfig = {where: condition,  include: [{model: db.user, include: [{model: db.person}]}], limit:limit};

    Grabacion.findAll(searchConfig)
    .then((data) => {
        res.send(data)
    }).catch(err => {
        res.status(500).send({message: "Ocurrió un error durante la busqueda de las grabaciones."});
    });
};

exports.findOne = (req, res) => {
    const id = req.params.id;

    Grabacion.findOne({where: {id: id}, include: [{model: db.user, include: [{model: db.person}]}], paranoid: true})
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

exports.getEmisionActual = (req, res) => {
  Grabacion.findAll({
    where: {status_actual: "en_emision"}, 
    include: [{model: db.user, include: [{model: db.person}]}], 
    order: [['fecha_inicio', 'DESC']],
    limit: 1
  })
  .then(data => {
    if (data) {
      res.send(data[0]);
    } else {
      res.status(404).send({message: `No se encontró ningún registro.`});
    }
  })
  .catch(err => {
    res.status(500).send({message: "Ocurió un error inesperado... Intentelo mas tarde."});
  });
};

const currentEmisionEmail = (mailList) => {
  const nodeMailerConfig = require('../config/nodemailer_config');
  const mailOptions = {
    from: nodeMailerConfig.email,
    to: mailList,
    subject: `Nueva Emisión de Radio!!! ${nodeMailerConfig.platform_name}`,
    text: `
      Buenos dias estimado radio oyente, nos complace anunciarle que hemos iniciado una nueva emisión de 
      radio en nuestra plataforma. Para sintonizar nuestra emisión en vivo, presione el siguiente enlace<br/>
      <a href="${nodeMailerConfig.frontend_url}/radioOnline" target="_blank">Emisión</a>
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

exports.sendNotificaciones = async (req, res) => {
  try {
    const searchEmision = await db.emision_radio.findAll({
      where: {status_actual: "en_emision"}, 
      order: [['fecha_inicio', 'DESC']],
      limit: 1
    });
    if(searchEmision.length > 0) {
      let suscriptoresEmails = [];
      const searchSuscriptores = await db.suscripcion.findAll({
        where: {}, 
        include: [{model: db.user}]
      });
      for(let i = 0; i < searchSuscriptores.length; i++) {
        suscriptoresEmails.push(searchSuscriptores[i].user.login);
      }
      currentEmisionEmail(suscriptoresEmails);
      res.status(200).send();
    } 
  } catch(err) {
    res.satus(400).send();
  }
}

exports.update = async (req, res) => {
    const id = req.params.id;
    const bodyData = req.body;
    const validations= recordValidations(bodyData);
    const errorMessage = "Ocurrió un error inesperado al intentar actualizar los datos de la emisión.";
    const token = req.headers["authorization"];
    let searchGrabacion = await Grabacion.findAll({where: {id: id}});
    if(searchGrabacion.length > 0) {
      if(searchGrabacion[0].dataValues.id_emisor != parseInt(req.user.userid)) {
        res.status(404).send({message: `Usted no puede actualizar este registro.`});
        return;
      }
    }

    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
      return;
    }
    
    let updateGrabacionBody = {
      titulo: bodyData.titulo,
      descripcion: bodyData.descripcion
    }

    Grabacion.update(updateGrabacionBody, {where: {id: id}})
    .then(recordRes => {
      functions.updateActionLogMessage(db, "Grabación", req.headers.authorization, id);
      res.send({message: "El registro fue actualizado satisfactoriamente!!", data: bodyData});
    }).catch(err => {
      res.status(500).send({message: errorMessage});
    });
};

const processAudioFile = async () => {
  let filesList = fs.readdirSync(fs_audioPiecesPath);
  if(filesList.length > 0) {
    let concatFilesScript = 'concat:';
    const currentDate = new Date();
    const audioName = `radio_emision_${currentDate.getTime()}.mp3`;
    const audioPath = `${childProcess_finalEmisionsPath}/${audioName}`;
    for(let i = 0; i < filesList.length; i++) {
      let concatScript = "";
      concatFilesScript = `${concatFilesScript}${childProcess_audioPiecesPath}/${filesList[i]}`;
      if(i+1 != filesList.length) {
        concatFilesScript = `${concatFilesScript}|`;
      }
      
      if(i === 1) {
        concatScript = `concat:${childProcess_audioPiecesPath}/${filesList[0]}|${childProcess_audioPiecesPath}/${filesList[1]}`;
      } else if(i > 1) {
        concatScript = `concat:${audioPath}|${childProcess_audioPiecesPath}/${filesList[i]}`;
      }
      if(concatScript) {
        const child = childProcess.spawn(
          ffmepg,
          // note, args must be an array when using spawn
          [
              '-i',
              concatScript,
              '-acodec',
              'copy',
              audioPath
          ]
        );
    
        await child.on('error', () => {
            // catches execution error (bad file)
            console.log(`*** processAudioFile *** Error executing binary: ${ffmpegPath}`);
        });
    
        await child.stdout.on('data', (data) => {
            console.log('*** processAudioFile *** FFmpeg stdout', data.toString());
        });
    
        await child.stderr.on('data', (data) => {
            console.log(`*** concatOutputAudioToCurrentEmisionAudio *** ${data}`);
        });
    
        await child.on('close', (code) => {
            console.log(`*** processAudioFile *** Process exited with code: ${code}`);
            if (code === 0) {
              console.log(`*** processAudioFile *** FFmpeg finished successfully`);
              /*
              for(let i = 0; i < filesList.length; i++) {
                fs.unlinkSync(`${fs_audioPiecesPath}/${filesList[i]}`);
              }
              fs.unlinkSync(fs_currentAudioFilePath);
              fs.unlinkSync(fs_outputAudioFilePath);
              */
            } else {
                console.log(`*** processAudioFile *** FFmpeg encountered an error, check the console output`);
            }
        });
      }
    }
    /*
    const child = childProcess.spawn(
      ffmepg,
      // note, args must be an array when using spawn
      [
          '-i',
          concatFilesScript,
          '-acodec',
          'copy',
          audioPath
      ]
    );

    await child.on('error', () => {
        // catches execution error (bad file)
        console.log(`*** processAudioFile *** Error executing binary: ${ffmpegPath}`);
    });

    await child.stdout.on('data', (data) => {
        console.log('*** processAudioFile *** FFmpeg stdout', data.toString());
    });

    await child.stderr.on('data', (data) => {
        console.log(`*** concatOutputAudioToCurrentEmisionAudio *** ${data}`);
    });

    await child.on('close', (code) => {
        console.log(`*** processAudioFile *** Process exited with code: ${code}`);
        if (code === 0) {
          console.log(`*** processAudioFile *** FFmpeg finished successfully`);
          for(let i = 0; i < filesList.length; i++) {
            fs.unlinkSync(`${fs_audioPiecesPath}/${filesList[i]}`);
          }
          fs.unlinkSync(fs_currentAudioFilePath);
          fs.unlinkSync(fs_outputAudioFilePath);
        } else {
            console.log(`*** processAudioFile *** FFmpeg encountered an error, check the console output`);
        }
    });
    */
    return audioName;
  }
  return '';
};

exports.finalizar = async (req, res) => {
  const id = req.params.id;
  const errorMessage = "Ocurrió un error inesperado al intentar finalizar la emisión.";
  let searchGrabacion = await Grabacion.findAll({where: {id: id}});
  if(searchGrabacion.length > 0) {
    if(searchGrabacion[0].dataValues.id_emisor != parseInt(req.user.userid)) {
      res.status(404).send({message: `Usted no puede actualizar este registro.`});
      return;
    }
  }
  
  const currentDate = new Date();
  const duracion = currentDate.getTime() - new Date(searchGrabacion[0].fecha_inicio).getTime();
  const audioName = await processAudioFile();

  let updateGrabacionBody = {
    status_actual: "finalizada",
    fecha_fin: currentDate,
    duracion: duracion,
    file: audioName
  }

  Grabacion.update(updateGrabacionBody, {where: {id: id}})
  .then(recordRes => {
    functions.updateActionLogMessage(db, "Grabación", req.headers.authorization, id);
    res.send({message: "La emisión ha sido finalizada exitosamente!!"});
  }).catch(err => {
    res.status(500).send({message: errorMessage});
  });
};

exports.delete = (req, res) => {
    const id = req.params.id;
    Grabacion.destroy({
      where: { id: id },
      individualHooks: true
    })
    .then(num => {
        if (num == 1) {
          functions.deleteActionLogMessage(db, "Grabación", req.headers.authorization, id);
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