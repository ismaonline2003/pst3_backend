const db = require("../models");
const Person = db.person;
const Op = db.Sequelize.Op;

//Insert new Person
exports.create = (req, res) => {
  // Create an Person
  const person = {
    name: req.body.name,
    lastname: req.body.lastname,
    ci: req.body.ci,
    phone: req.body.phone,
    mobile: req.body.mobile,
    address: req.body.address
  };

  // Save student in the database
  Person.create(person)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Error occurred while creating the Person."
      });
    });
};

// Retrieve all users
exports.findAll = (req, res) => {

  const name = req.query.name;
  
  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

  Person.findAll({ where: condition })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving data."
      });
    });
  let query = "SELECT * FROM person WHERE name LIKE '%"+name+"%'";
  "CREATE TABLE persona(....)"
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

exports.findWithoutUser = async (req, res) => {
  const value = req.params.value;
  let recordsSearch = await db.sequelize.query(`
      SELECT * FROM person 
      WHERE CONCAT(name,' ',lastname) LIKE '%${value}%' 
      AND id NOT IN (
        SELECT person.id AS id 
        FROM person 
        INNER JOIN users ON users.person_id = person.id
        WHERE person.deleted_at IS NULL
        AND users.deleted_at IS NULL
      ) 
      AND deleted_at IS NULL
  `);
  res.status(200).send(recordsSearch[0]);
}

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