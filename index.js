// ./src/index.js
// importing the dependencies
// node index.js
// npx nodemon index.js
const WSControllerClass = require('./controllers/websocket.js');
const { createServer } = require('node:http');
const cors = require("cors");
const express = require("express");
const app = express();
const WSserver = createServer(app);
//set port for websocket


const db = require("./models");
//const WebSocket = require('ws');
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

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Users App - Backend!!!" });
});

//including routes
require("./routes/person.js")(app);
require("./routes/users.js")(app);
require("./routes/author.js")(app);
require("./routes/estudiante.js")(app);
require("./routes/seccion.js")(app);
require("./routes/carrera_universitaria.js")(app);

// set port, listen for requests
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is up and running on port ${PORT}.`);
});
WSserver.listen(3002, () => {
  console.log('server running at http://localhost:3002');
});

const WSController = new WSControllerClass();
console.log('hello web socket connection');
io.on('connection', WSController.connection);

//WSController.sendAudioStreamToClients();
/*
for(let i = 0; i < 12000; i++) {
  setTimeout(async () => {
    await WSController.sendAudioStreamToClients();
  }, 3000);
}
*/
 //const wss = new WebSocket.Server({ port: 3002 });
//const clients = new Map();
//wsController.clients = clients;
//wss.on('connection', wsController.connection);
//console.log("wss up");


