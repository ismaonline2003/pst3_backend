// ./src/index.js
// importing the dependencies
// node index.js
// npx nodemon index.js
const cors = require("cors");
const express = require("express");
const app = express();
const db = require("./models");

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

app.use(cors());

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Users App - Backend!!!" });
});

require("./routes/person.js")(app);
require("./routes/users.js")(app);
require("./routes/author.js")(app);

// set port, listen for requests
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is up and running on port ${PORT}.`);
});