const fs = require('fs');
const ffmepg = require('ffmpeg-static');
const childProcess = require('child_process');
const ytdl = require('ytdl-core');
const db = require("../models");
const functions = require('../routes/functions');
const RadioAudio = db.radio_audio;
const Op = db.Sequelize.Op;
const childProcess_radioAudiosFilePath = `${process.cwd()}/src/radioAudios`;


const recordValidations = (data) =>  {
  let objReturn = {'status': 'success', 'data': {}, 'msg': ''};
  if(data.title.trim() == "") {
      objReturn = {'status': 'failed', 'data': {}, 'msg': 'Se debe definir un título para el audio'};
      return objReturn;
  }

  try {
    parseInt(data.id_autor);
  } catch(error) {
    objReturn = {'status': 'failed', 'data': {}, 'msg': 'Se debe seleccionar un autor válido.'};
  }

  if(!['local', 'yt'].includes(data.source)) {
    objReturn = {'status': 'failed', 'data': {}, 'msg': 'El tipo de audio seleccionado es invalida.'};
    return objReturn;
  }
  if(!['cancion', 'record'].includes(data.type)) {
    objReturn = {'status': 'failed', 'data': {}, 'msg': 'El tipo de audio es invalida.'};
    return objReturn;
  }
  if(data.source === 'yt') {
    if(data.yt_url.trim() === "") {
      objReturn = {'status': 'failed', 'data': {}, 'msg': 'Debe definir una url.'};
      return objReturn;
    }
  }
  return objReturn;
}

const ytFileSearch = async(url) =>  {
  const currentDate = new Date();
  const Temporalfilename = `${currentDate.getTime()}.mp4`;
  const filename = Temporalfilename.replace('mp4', 'mp3');
  const DownloadOutputFilePath = `./src/radioAudios/${Temporalfilename}`;
  try {
      const getInfo = await ytdl.getInfo(url);
      // Create a write stream to save the video file
      const format = ytdl.chooseFormat(getInfo.formats, {quality:"highestaudio"});
      const outputStream = fs.createWriteStream(DownloadOutputFilePath);
      // Download the video file
      ytdl.downloadFromInfo(getInfo, {format:format}).pipe(outputStream);
      outputStream.on('finish', async () => {
        console.log(`YT Finished downloading: ${DownloadOutputFilePath}`);
        const child = childProcess.spawn(
            ffmepg,
            // note, args must be an array when using spawn
            [
                '-i',
                `${childProcess_radioAudiosFilePath}/${Temporalfilename}`,
                `${childProcess_radioAudiosFilePath}/${filename}`
            ]
        );
        await child.on('error', () => {
            // catches execution error (bad file)
            console.log(`Error executing binary: ${ffmpegPath}`);
        });
        
        await child.stdout.on('data', (data) => {
            console.log('FFmpeg stdout', data.toString());
        });
        
        await child.stderr.on('data', (data) => {
            console.log(data);
        });
        
        await child.on('close', (code) => {
            if (code === 0) {
                console.log('FFMPEG mp4 to mp3 conversion success!!!');
                fs.unlinkSync(DownloadOutputFilePath);
            } else {
                console.log(`FFmpeg encountered an error, check the console output`);
            }
        });
      });
  } catch(err) {
      return false
  }
  return filename;
}
  

exports.create = async (req, res) => {
    let bodyData = JSON.parse(req.body.data);
    const audioFile = req.file;
    const validations= recordValidations(bodyData);
    const errorMessage = "Ocurrió un error inesperado al intentar registrar el audio.";
    const currentDate = new Date();
    let filename =  `${currentDate.getTime()}.mp3`;
    let filenamePath = `./src/radioAudios/${filename}`;
    
    if(bodyData.source === 'local') {
        if(audioFile === undefined) {
          res.status(400).send({message: 'Cuando la fuente es "Computadora" Debe cargar un audio.'});
          return;
        }
        if(!["audio/mp3", "audio/mpeg"].includes(audioFile.mimetype)) {
          res.status(400).send({message: 'El audio debe estar en formato mp3.'});
          return;
        }
        if(audioFile.size > 524300000) {
            res.status(400).send({message: 'El audio debe tener un peso máximo de 50 mb (megabytes).'});
            return;
        }
        let uploadedFilepath = `${audioFile.path}.mp3`;
        fs.renameSync(audioFile.path,  uploadedFilepath);
        fs.renameSync(uploadedFilepath, filenamePath);
        try {
          fs.unlinkSync(uploadedFilepath);
        } catch(err) {
          
        }
        bodyData.filename = filename;
    }

    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
      return;
    }

    bodyData.id_autor = parseInt(bodyData.id_autor);

    if(bodyData.source === 'yt') {
      filename = await ytFileSearch(bodyData.yt_url);
      if(!filename) {
        res.status(400).send({message: 'Ocurrió un error inesperado con la plataforma de Youtube. Vuelva a intentarlo mas tarde.'});
        return;
      }
      bodyData.filename = filename;
    }

    RadioAudio.create(bodyData)
    .then(recordRes => {
        bodyData.id = recordRes.dataValues.id;
        functions.createActionLogMessage(db, "Audio de Radio", req.headers.authorization, bodyData.id);
        res.status(200).send(bodyData);
    }).catch(err => {
      res.status(500).send({message: errorMessage});
    });
};

const searchAutorIdsByName = async (value) => {
    let ids_list = [];
    let recordsSearch = await db.sequelize.query(`SELECT id FROM author WHERE name LIKE '%${value}%' AND deleted_at IS NULL`);
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
        if(parameter == 'title') {
            condition = {title: {[Op.like]: `%${value}%`}};
        }
        if(parameter == 'autor') {
            const autoresIdsList = await searchAutorIdsByName();
            condition = {id_autor: {[Op.in]: autoresIdsList}};
        }
    }

    let searchConfig = {where: condition, limit:limit, include: [{model: db.author}]};

    RadioAudio.findAll(searchConfig)
    .then((data) => {
        res.send(data)
    })
    .catch(err => {
        res.status(500).send({message: "Ocurrió un error durante la busqueda de los audios de radio."});
    });
};

exports.findOne = (req, res) => {
    const id = req.params.id;

    RadioAudio.findOne({where: {id: id}, include: [{model: db.author}], paranoid: true})
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
    const bodyData = req.body;
    let validations = recordValidations(bodyData);
    const errorMessage = "Ocurrió un error inesperado al intentar actualizar el registro.";

    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
    }

    RadioAudio.update(bodyData, {where: {id: id}})
    .then(recordRes => {
      functions.updateActionLogMessage(db, "Audio de Radio", req.headers.authorization, id);
      res.send({message: "La información del audio fue actualizado satisfactoriamente!!", data: bodyData});
    }).catch(err => {
      res.status(500).send({message: errorMessage});
    });
};

exports.delete = (req, res) => {
    const id = req.params.id;
    RadioAudio.destroy({
      where: { id: id },
      individualHooks: true
    })
    .then(num => {
        if (num == 1) {
          functions.deleteActionLogMessage(db, "Audio de Radio", req.headers.authorization, id);
          res.send({
            message: "El audio fue eliminado exitosamente!!"
          });
        } else {
          res.send({
            message: `No se pudo eliminar el audio.`
          });
        }
    })
    .catch(err => {
      console.log(err);
      res.status(500).send({
        message: "Ocurrio un error inesperado... No se pudo eliminar el audio"
      });
    });
};