const db = require("../models");
const functions = require('../routes/functions');
const wordpressConfig = require('../config/wordpress_config')
const WPAPI = require('wpapi')
const wapi_config = wordpressConfig.wapi_config;
const CategoriaNoticia = db.categoria_noticia;
const Op = db.Sequelize.Op;

const recordValidations = (data) =>  {
  let objReturn = {'status': 'success', 'data': {}, 'msg': ''};
  if(data.nombre.trim() == "") {
      objReturn = {'status': 'failed', 'data': {}, 'msg': 'Se debe definir un nombre para la categoría de noticia.'};
      return objReturn;
  }
  return objReturn;
}

const sendToWordpress = async(data) => {
  try {
    if(!data.wordpress_id) {
      const wp = new WPAPI(wapi_config);
      const wordpressRes = await wp.categories().create({
          // "title" and "content" are the only required properties
          name: data.nombre,
          description: data.descripcion
      }); 
      console.log(wordpressRes.id);
      return wordpressRes.id;
    }
  } catch(err) {
    console.log(err);
  }
  return false;
}

const updateInWordpress = async(data) => {
  try {
      const wp = new WPAPI(wapi_config);
      if(data.wordpress_id) {
        const wordpressRes = await wp.categories().id(data.wordpress_id).update({
          name: data.nombre,
          description: data.descripcion
        }); 
        console.log(wordpressRes);
        return true;
      }
  } catch(err) {
    console.log(err);
  }
  return false;
}

const deleteInWordpress = async(wordpressId) => {
  try {
    const wp = new WPAPI(wapi_config);
    if(wordpressId) {
      const wordpressRes = await wp.categories().id(wordpressId).delete({force: true}); 
      console.log(wordpressRes);
      return true;
    }
  } catch(err) {
    console.log(err);
  }
  return false;
}

  

exports.create = async (req, res) => {
    const bodyData = req.body;
    const validations= recordValidations(bodyData);
    const errorMessage = "Ocurrió un error inesperado al intentar crear el registro.";

    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
    }

    CategoriaNoticia.create({
      nombre: bodyData.nombre,
      descripcion: bodyData.descripcion
    })
    .then(async (recordRes) => {
        bodyData.id = recordRes.dataValues.id;
        bodyData.wordpress_id = false;
        functions.createActionLogMessage(db, "Categoría Noticias", req.headers.authorization, bodyData.id);
        const wordpressId = await sendToWordpress(bodyData);
        if(!wordpressId) {
          throw new Error(errorMessage);
        }
        await CategoriaNoticia.update({wordpress_id: wordpressId}, {where: {id: bodyData.id}});
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
    }

    let searchConfig = {where: condition, limit:limit};

    CategoriaNoticia.findAll(searchConfig)
    .then((data) => {
        res.send(data)
    })
    .catch(err => {
        res.status(500).send({message: "Ocurrió un error durante la busqueda de las categorias de noticias."});
    });
};

exports.findOne = (req, res) => {
    const id = req.params.id;

    CategoriaNoticia.findOne({where: {id: id}, paranoid: true})
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
    let bodyData = req.body;
    let validations = recordValidations(bodyData);
    const errorMessage = "Ocurrió un error inesperado al intentar actualizar el registro.";

    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
    }

    CategoriaNoticia.update({
      nombre: bodyData.nombre,
      descripcion: bodyData.descripcion
    }, {where: {id: id}})
    .then(async (recordRes) => {
      functions.updateActionLogMessage(db, "Categoría Noticias", req.headers.authorization, id);
      const catSearch = await CategoriaNoticia.findOne({where: {id:id}});
      if(catSearch.dataValues.wordpress_id) {
        const wordpressRes = await updateInWordpress(catSearch.dataValues);
        if(!wordpressRes) {
          throw new Error(errorMessage);
        }
      }
      res.send({message: "El registro fue actualizado satisfactoriamente!!", data: bodyData});
    }).catch(err => {
      res.status(500).send({message: errorMessage});
    });
};

exports.delete = async (req, res) => {
    const id = req.params.id;
    const catSearch = await CategoriaNoticia.findOne({where: {id: id}});
    const errorMessage = "Ocurrió un error inesperado al intentar actualizar el registro.";
    let wordpressId = false;
    if(catSearch && catSearch.dataValues.wordpress_id) {
      wordpressId = catSearch.dataValues.wordpress_id;
    }
    CategoriaNoticia.destroy({
      where: { id: id },
      individualHooks: true
    })
    .then(async (num) => {
        if (num == 1) {
          functions.deleteActionLogMessage(db, "Categoría Noticias", req.headers.authorization, id);
          if(wordpressId) {
            const wordpressRes = await deleteInWordpress(wordpressId);
            if(!wordpressRes) {
              throw new Error(errorMessage);
            }
          }
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