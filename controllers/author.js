const db = require("../models");
const Author = db.author;
const Op = db.Sequelize.Op;

//Insert new Person
exports.create = (req, res) => {
  // Create an Person
  const newAuthor = {
    name: req.body.name,
    code: req.body.code
  };

  Author.create(newAuthor)
    .then(data => {
      res.send(data);
    }).catch(err => {
      res.status(500).send({
        message:
          err.message || "Ocurrió un error durante la creación del Autor... Verifíque los datos e intentelo de nuevo mas tarde."
      });
    });
};

exports.findByName = (req, res) => {
  const name = req.params.name;
  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;
  Author.findAll({ where: condition })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Ocurrió un error inesperado durante la busqueda... Vuelva a intentarlo mas tarde..."
      });
    });
};

exports.findByCode = (req, res) => {
    const authorCode = req.params.code;
    var condition = authorCode ? { code: authorCode } : null;
    Author.findAll({ where: condition })
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Ocurrió un error inesperado durante la busqueda... Vuelva a intentarlo mas tarde."
        });
      });
  };

exports.findOne = (req, res) => {
  const id = req.params.id;
  Author.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `No se encontró al autor por la referencia ${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Ocurrió un error inesperado durante la busqueda... Vuelva a intentarlo mas tarde."
      });
    });
};

exports.update = (req, res) => {
  const id = req.params.id;

  Author.update(req.body, {
    where: { id: id }
  }).then(num => {
      if (num == 1) {
        res.send({
          message: "Autor actualizado exitosamente!!"
        });
      } else {
        res.send({
          message: `Ocurrió un error inesperado... No se pudo actualizar al autor de referencia ${id}`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: `Ocurrió un error inesperado... No se pudo actualizar al autor de referencia ${id}`
      });
    });
};

exports.delete = (req, res) => {
  const id = req.params.id;

  Author.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "El autor fue eliminado exitosamente!!"
        });
      } else {
        res.send({
          message: `Ocurrió un error inesperado... No se pudo eliminar al autor de referencia ${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: `Ocurrió un error inesperado... No se pudo eliminar al autor de referencia ${id}.`
      });
    });
};