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
cron.schedule('*/4 * * * * *', () => {
  WSController.sendAudioStreamToClients(io);
});

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
        console.log(response);
      }
    } catch(err) {
      console.log(err);
    }
  }
});


