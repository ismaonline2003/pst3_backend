// ./src/index.js
// importing the dependencies
// node index.js
// npx nodemon index.js
const WSControllerClass = require('./controllers/websocket.js');
const { createServer } = require('node:http');
const cors = require("cors");
const express = require("express");
const cron = require('node-cron')
const app = express();
const WSserver = createServer(app);

//set port for websocket
const db = require("./models");

const io = require('socket.io')(WSserver, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


//this will re-set the database everytime you start the server
db.sequelize.sync({ force: false, alter: true }).then(() => {
  /*
  let personData = {
    'name': 'Ismael',
    'lastname': 'Castillo',
    'ci': '29990562',
    'phone': '04263219464',
    'mobile': '04263219464',
    'address': 'Av. San Martin'
  }
  let userData = {
    'login': 'ismaonline2000@gmail.com',
    'password': 'ismael123',
    'person_id': 1
  }
  let authorData = [
    {
      'name': 'Ninguno',
      'code': '0'
    },
    {
      'name': 'Autor 1',
      'code': '1'
    }
  ]
  db.person.bulkCreate([personData]);
  db.user.bulkCreate([userData]);
  db.author.bulkCreate(authorData);
  */
  console.log("#droped the database and and re-synced.");
});

app.use(cors({
  origin: "*"
}));

// parse requests of content-type - application/json
app.use(express.json());
app.use(express.static('/src/fileUploads'));

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); 
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method, Access-Control-Allow-Credentials');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
  //res.header("Access-Control-Allow-Origin", "http://localhost:3002"); 
  next();
});

//including routes
require("./routes/person.js")(app);
require("./routes/users.js")(app);
require("./routes/author.js")(app);
require("./routes/estudiante.js")(app);
require("./routes/profesor.js")(app);
require("./routes/carrera_universitaria.js")(app);
require("./routes/seccion.js")(app);
require("./routes/proyecto.js")(app);
require("./routes/noticia.js")(app);
require("./routes/grabacion.js")(app);
require("./routes/emision.js")(app);
require("./routes/radio_audio.js")(app);
require("./routes/emision_audio.js")(app);
require("./routes/categoria_noticia.js")(app);
require("./routes/suscripciones.js")(app);
require("./routes/files.js")(app);
require("./routes/logs_sistema.js")(app);

// set port, listen for requests
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is up and running on port ${PORT}.`);
});
WSserver.listen(3002, () => {
  console.log('server running at http://localhost:3002');
});

const WSController = new WSControllerClass();
io.on('connection', WSController.connection);

//*cron jobs*//

//send live radio audios
cron.schedule('*/4 * * * * *', () => {
  WSController.sendAudioStreamToClients(io);
});

cron.schedule('*/4 * * * * *', () => {
  WSController.sendScheduledAudioToClients(io);
});

//set emision radio audios duration
cron.schedule('*/4 * * * * *', async() => {
  const audiosToCheckPath = './src/radioAudiosToCheck/';
  const getMP3Duration = require('get-mp3-duration');
  const fs = require('fs');
  const filesList = fs.readdirSync(audiosToCheckPath);
  for(let i = 0; i < filesList.length; i++) {
    try {
      const audioSearch = await db.radio_audio.findAll({where: {filename: filesList[i]}, limit: 1});
      if(audioSearch.length > 0) {
        const filePath = `${audiosToCheckPath}/${audioSearch[0].dataValues.filename}`;
        const buffer = fs.readFileSync(filePath);
        const duration = getMP3Duration(buffer);
        const response = await db.radio_audio.update({seconds_duration: duration/1000}, {where: {id: audioSearch[0].dataValues.id}})
        fs.unlinkSync(filePath);
      }
    } catch(err) {
      console.log(err);
    }
  }
});

cron.schedule('*/4 * * * * *', async() => {
  /*
  const fs = require('fs');
  const moment = require('moment');
  const ffmepg = require('ffmpeg-static');
  const childProcess = require('child_process');
  const radioAudioPiecesPath = './src/current_emision/current_emision_radio_audio_pieces';
  const childProcess_radioAudios_path = `${process.cwd()}/src/radioAudios`;
  const childProcess_currentEmisionRadioAudio_path = `${process.cwd()}/src/current_emision/current_emision_radio_audio_pieces`;
  const Op = db.Sequelize.Op;
  const currentDate = new Date();
  try {
    const search = await db.emision_audio.findAll({
      where: {fecha_emision_programada: {[Op.lte]: currentDate}, fecha_fin_emision_programada: {[Op.gte]: currentDate}, taken: false}, 
      limit: 1,
      order: [['fecha_emision_programada', 'ASC']],
      include: [{model: db.radio_audio}]
    });
    if(search.length > 0) {
      fs.rmSync(radioAudioPiecesPath, { recursive: true, force: true });
      fs.mkdirSync(radioAudioPiecesPath);
        const child = childProcess.spawn(
          ffmepg,
          // note, args must be an array when using spawn
          [
              '-i',
              `${childProcess_radioAudios_path}/${search[0].dataValues.radio_audio.filename}`,
              '-f',
              `segment`,
              '-segment_time',
              '4',
              '-c',
              'copy',
              `${childProcess_currentEmisionRadioAudio_path}/out%03d.mp3`
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
        
        await child.on('close', async (code) => {
            if (code === 0) {
              await db.emision_audio.update({taken: true}, {where: {id: search[0].dataValues.id}});
            } else {
                console.log(`FFmpeg encountered an error, check the console output`);
            }
        });
    }
  } catch(err) {
    console.log(err);
  }
  */
});

//cron para guardar los archivos por emitir en current_emision_radio_audio_pieces
cron.schedule('*/4 * * * * *', async() => {
  const fs = require('fs');
  const ffmepg = require('ffmpeg-static');
  const childProcess = require('child_process');
  const radioAudioPiecesPath = './src/current_emision/current_emision_radio_audio_pieces';
  const childProcess_radioAudios_path = `${process.cwd()}/src/radioAudios`;
  const childProcess_currentEmisionRadioAudio_path = `${process.cwd()}/src/current_emision/current_emision_radio_audio_pieces`;
  const Op = db.Sequelize.Op;
  const currentDate = new Date();

  try {
    const search = await db.emision_audio.findAll({
      where: {fecha_emision_programada: {[Op.lte]: currentDate}, fecha_fin_emision_programada: {[Op.gte]: currentDate}, taken: false}, 
      limit: 1,
      order: [['fecha_emision_programada', 'ASC']],
      include: [{model: db.radio_audio}]
    });
    console.log(search);
    if(search.length > 0) {
      const diff = new Date(search[0].dataValues.fecha_fin_emision_programada).getTime() - currentDate.getTime();
      const secondsDiff = (diff / 1000) - 4; //el -4 es el tiempo que se deja entre cada emisión
      const AudioStartPoint = search[0].dataValues.radio_audio.seconds_duration - secondsDiff;
      if(AudioStartPoint > 0) {
        console.log('search[0].dataValues.audio_volume', search[0].dataValues.audio_volume);
        const child = childProcess.spawn(
          ffmepg,
          // note, args must be an array when using spawn
          [
              '-i',
              `${childProcess_radioAudios_path}/${search[0].dataValues.radio_audio.filename}`,
              '-filter:a',
              `volume=${search[0].dataValues.audio_volume}`,
              `${childProcess_currentEmisionRadioAudio_path}/${currentDate.getTime()}.mp3`
          ]
        );
        await child.on('error', () => {
            // catches execution error (bad file)
            console.log(`Error executing binary: ${ffmpegPath}`);
        });
        
        await child.stdout.on('data', (data) => {
            console.log('FFmpeg stdout', data.toString());
        });
        
        await child.stderr.on('data', async(data) => {
            console.log('**** ERROR ***');
            console.log(data);
            await db.emision_audio.update({taken: true}, {where: {id: search[0].dataValues.id}});
        });
        
        await child.on('close', async (code) => {
            if (code === 0) {
              await db.emision_audio.update({taken: true}, {where: {id: search[0].dataValues.id}});
            } else {
                console.log(`FFmpeg encountered an error, check the console output`);
            }
        });
      } else {
        await db.emision_audio.update({taken: true}, {where: {id: search[0].dataValues.id}});
      }
    }
  } catch(err) {
    console.log(err);
  }
});

//cron para eliminar los archivos que quedan en current_emision_radio_audio_pieces
cron.schedule('*/4 * * * * *', async() => {
  const fs = require('fs');
  const radioAudioPiecesPath = './src/current_emision/current_emision_radio_audio_pieces';
  const Op = db.Sequelize.Op;
  const currentDate = new Date();
  try {
    const search = await db.emision_audio.findAll({
      where: {fecha_fin_emision_programada: {[Op.lte]: currentDate}, taken: true, finished: false}, 
      limit: 1,
      order: [['fecha_fin_emision_programada', 'DESC']],
      include: [{model: db.radio_audio}]
    });
    if(search.length > 0) {
      await db.emision_audio.update({finished: true}, {where: {id: search[0].dataValues.id}});
      const emisionAudioFilesList = fs.readdirSync(radioAudioPiecesPath);
      if(emisionAudioFilesList.length > 0) {
        const directoryPath = `${radioAudioPiecesPath}/${emisionAudioFilesList[0]}`;
        fs.unlinkSync(directoryPath);
      }
    }
  } catch(err) {
    console.log(err);
  }
});



