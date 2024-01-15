const fs = require('fs');
const db = require("../models");
const functions = require('../routes/functions');
const wordpressConfig = require('../config/wordpress_config')
const WPAPI = require('wpapi')
const wapi_config = wordpressConfig.wapi_config;
const Noticia = db.noticia;
const NoticiaImagen = db.noticia_imagen;
const Op = db.Sequelize.Op;
const searchInclude = {include: [
  {model: db.user, include: [{model: db.person}]},
  {model: db.categoria_noticia},
  {model: db.noticia_imagen}
]}

const recordValidations = (data) =>  {
  let objReturn = {'status': 'success', 'data': {}, 'msg': ''};
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  if(data.nombre == "") {
      objReturn = {'status': 'failed', 'data': {}, 'msg': 'Se debe definir un nombre para la noticia.'};
      return objReturn;
  }
  //if(!newMiniaturaObj) {
  //    objReturn = {'status': 'failed', 'data': {}, 'msg': 'Debe cargar una miniatura para la noticia'};
  //    return objReturn;
  //}
  if(data.addedImgs.length > 70) {
      objReturn = {'status': 'failed', 'data': {}, 'msg': 'La cantidad máxima de imagenes que se pueden cargar es de 70.'};
      return objReturn;
  }
  if(!data.categId) {
      objReturn = {'status': 'failed', 'data': {}, 'msg': 'Debe seleccionar una categoria para la noticia'};
      return objReturn;
  }
  return objReturn;
}

const getFileName = (file) => {
  let filename = "";
  let type = "";
  filename = `${file.filename}`;
  if(file.mimetype == 'image/jpeg') {
    type = "jpeg";
  }
  if(file.mimetype == 'image/jpg') {
    type = "jpg";
  }
  if(file.mimetype == 'image/png') {
    type = "png";
  }
  filename += `.${type}`;
  return filename;
}

const createFileInDirectory = (fileIndex, files) => {
  let objReturn = {path: '', url: ''};
  let file = files[fileIndex];
  const fileRead = fs.readFileSync(file.path);
  const filename = getFileName(file);
  const filePath = `api/files/getFile/${filename}`;
  const fileUrl = `${wordpressConfig.external_backend_url}/api/files/getFile/${filename}`
  fs.writeFileSync(`src/fileUploads/${filename}`, fileRead);
  fs.unlinkSync(file.path);
  objReturn.path = filePath;
  objReturn.url = fileUrl;
  return objReturn;
}

const prepareContent = (data={}, files=[], mode="create") => {
  let objReturn = {status: 'success', msg: '', content: data.contenido, fileList: [], miniaturaPath: ''};
  data.addedImgs.map((item) => {
    let fileAddresses = createFileInDirectory(item.index, files);
    objReturn.content = objReturn.content.replace(item.url, fileAddresses.url);
    objReturn.fileList.push(fileAddresses.path);
  });
  let miniaturaFileAddresses = false;
  if(mode == 'create') {
    miniaturaFileAddresses = createFileInDirectory(data.miniaturaFileIndex, files);
    objReturn.miniaturaPath = miniaturaFileAddresses.path;
  } 
  if(mode == 'update' && data.miniaturaUpdated) {
    miniaturaFileAddresses = createFileInDirectory(data.miniaturaFileIndex, files);
    objReturn.miniaturaPath = miniaturaFileAddresses.path;
  }
  return objReturn;
}

const createNoticiaImgsRecords = async (noticiaId, fileList, t) => {
  let objReturn = {status: 'success', msg: '', data: []};
  for(let i = 0; i < fileList.length; i++) {
    await NoticiaImagen.create({noticia_id: noticiaId, file: fileList[i]}, {transaction:t})
    .then((res) => {
        objReturn.data.push(res.id)
    })
    .catch((err) => {
        objReturn = {status: 'error', msg: `Ocurrió un error durante el proceso... Vuelva a intentarlo mas tarde.`, data: []};
        return objReturn;
    })
  }
  return objReturn;
}

exports.create = async (req, res) => {
    const t = await db.sequelize.transaction();
    const bodyData = JSON.parse(req.body.data);
    const validations= recordValidations(bodyData);
    let errorMessage = "Ocurrió un error inesperado al intentar crear el registro.";

    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
    }

    let contentPrepared = prepareContent(bodyData, req.files);
    
    let createData = {
        nombre: bodyData.nombre,
        descripcion: bodyData.descripcion,
        contenido: contentPrepared.content,
        categ_id: bodyData.categId,
        user_id: bodyData.userId,
        miniatura: contentPrepared.miniaturaPath
    }

    Noticia.create(createData, {transaction: t})
    .then(async (recordRes) => {

      let createImgs = await createNoticiaImgsRecords(recordRes.id, contentPrepared.fileList, t);
      if(createImgs.status != 'success') {
        errorMessage = createImgs.msg;
        throw new Error(errorMessage);
      }

      await t.commit();

      const noticiaSearch = await Noticia.findOne({...searchInclude, where: {id: recordRes.id}});

      functions.createActionLogMessage(db, "Noticia", req.headers.authorization, recordRes.id);

      res.status(200).send(noticiaSearch.dataValues);
    }).catch(async (err) => {
      await t.rollback();
      res.status(500).send({message: errorMessage});
    });
};

const searchCategIds = async (value) => {
    let ids_list = [];
    let recordsSearch = await db.sequelize.query(`
        SELECT id FROM categoria_noticia WHERE nombre LIKE '%${value}%' AND updated_at IS NOT NULL LIMIT 1
    `);
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
        if(parameter == 'nombre') {
            condition = {nombre: {[Op.like]: `%${value}%`}};
        }
        if(parameter == 'categoria_noticia') {
            const categ_ids = await searchCategIds(value);
            condition = {categ_id: {[Op.in]: categ_ids}};
        }
        if(parameter == 'redactor') {
            const user_ids = await functions.searchUserByPersonName(db, value);
            condition = {user_id: {[Op.in]: user_ids}};
        }
    }

    let searchConfig = {...searchInclude, where: condition, limit:limit};
    
    Noticia.findAll(searchConfig)
    .then((data) => {
        res.send(data)
    })
    .catch(err => {
        res.status(500).send({
        message: "Ocurrió un error durante la busqueda de las noticias."
        });
    });
};

exports.findOne = (req, res) => {
  const id = req.params.id;
  Noticia.findOne({...searchInclude, where: {id: id}, paranoid: true})
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({message: `No se pudo encontrar el registro.`});
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Ocurió un error inesperado... Intentelo mas tarde."
      });
    });
};


const getWordpressContent = (data) => {
  /*
        <img class="img-fluid wp-post-image" src="${wordpressConfig.external_backend_url}/${data.miniatura}" alt="" decoding="async"  style="width: 80% !important;">
  */
  let wordpressContent = `
    <article class="page-content-single small single">
      ${data.contenido}
    </article>
  `;
  return wordpressContent;
}

const sendMiniaturaToWordpress = async(wp, data) => {
  try {
    let bodyData = {
      status: 'publish'
    };
    const wordpressPostRes = await wp.media().file(`./src/fileUploads/${data.miniatura.replace('api/files/getFile/', '')}`).create(bodyData); 
    return wordpressPostRes;
  } catch(err) {
    console.log(err);
  }
  return false;
}

const sendPostToWordpress = async(data) => {
  try {
    const wp = new WPAPI(wapi_config);
    let categories = [];
    if(!data.miniatura_wordpress_id) {
      const miniaturaWordpressId = await sendMiniaturaToWordpress(wp, data);
      if(miniaturaWordpressId) {
        await db.noticia.update({miniatura_wordpress_id: miniaturaWordpressId.id}, {where: {id: data.id}});
        data.miniatura_wordpress_id = miniaturaWordpressId.id;
      }
    }

    if(data.categoria_noticium.wordpress_id) {
      categories = [data.categoria_noticium.wordpress_id];
    }
    const wordpressContent = getWordpressContent(data);
    const wordpressPostRes = await wp.posts().create({
        featured_media: data.miniatura_wordpress_id,
        // "title" and "content" are the only required properties
        title: data.nombre,
        content: wordpressContent,
        categories: categories,
        // Post will be created as a draft by default if a specific "status"
        // is not specified
        status: 'publish'
    }); 
    console.log(wordpressPostRes);
    return wordpressPostRes.id;
  } catch(err) {
    console.log(err);
  }
  return false;
}

const updateInWordpress = async(data) => {
  try {
      if(data.wordpress_id) {
        const wp = new WPAPI(wapi_config);
        const wordpressContent = getWordpressContent(data);

        let categories = [];

        if(!data.miniatura_wordpress_id) {
          const miniaturaWordpressId = await sendMiniaturaToWordpress(wp, data);
          if(miniaturaWordpressId) {
            await db.noticia.update({miniatura_wordpress_id: miniaturaWordpressId.id}, {where: {id: data.id}});
            data.miniatura_wordpress_id = miniaturaWordpressId.id;
          }
        }

        if(data.categoria_noticia.wordpress_id) {
          categories = [data.categoria_noticia.wordpress_id];
        }

        const wordpressRes = await wp.posts().id(data.wordpress_id).update({
          featured_media: data.miniatura_wordpress_id,
          title: data.nombre,
          content: wordpressContent,
          categories: categories,
          status: 'publish'
        }); 

        console.log(wordpressRes);
        return true;
      }
  } catch(err) {
    console.log(err);
  }
  return false;
}

const hideInWordpress = async(wordpressId) => {
  try {
      if(wordpressId) {
        const wp = new WPAPI(wapi_config);
        const wordpressRes = await wp.posts().id(wordpressId).update({status: 'private'}); 
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
      const wordpressRes = await wp.posts().id(wordpressId).delete({force: true}); 
      console.log(wordpressRes);
      return true;
    }
  } catch(err) {
    console.log(err);
  }
  return false;
}


exports.update = async (req, res) => {
    const t = await db.sequelize.transaction();
    const bodyData = JSON.parse(req.body.data);
    const validations= recordValidations(bodyData);
    let errorMessage = "Ocurrió un error inesperado al intentar crear el registro.";

    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
    }

    let contentPrepared = prepareContent(bodyData, req.files, 'update');
    
    let updateData = {
        nombre: bodyData.nombre,
        descripcion: bodyData.descripcion,
        contenido: contentPrepared.content,
        categ_id: bodyData.categId,
        user_id: bodyData.userId
    }
    if(bodyData.post) {
      updateData.is_published = true;
      updateData.fecha_publicacion = new Date();
    }
    if(bodyData.miniaturaUpdated) {
      updateData.miniatura = contentPrepared.miniaturaPath;
      updateData.miniatura_wordpress_id = "";
    }

    Noticia.update(updateData, {where: {id: bodyData.id}})
    .then(async (recordRes) => {
      let createImgs = await createNoticiaImgsRecords(bodyData.id, contentPrepared.fileList, t);
      if(createImgs.status != 'success') {
        errorMessage = createImgs.msg;
        throw new Error(errorMessage);
      }
      const noticiaSearch = await Noticia.findOne({...searchInclude, where: {id: bodyData.id}});

      if(bodyData.post && !noticiaSearch.dataValues.wordpress_id) {
        //crear
        const wordpressId = await sendPostToWordpress(noticiaSearch.dataValues);
        if(!wordpressId) {
          throw new Error(errorMessage);
        }
        await Noticia.update({wordpress_id : wordpressId}, {where: {id: bodyData.id}, transaction: t});
      }

      if(!bodyData.post && noticiaSearch.dataValues.wordpress_id) {
        //ocultar
        const wordpressRes= hideInWordpress(noticiaSearch.dataValues.wordpress_id);
        if(!wordpressRes) {
          throw new Error(errorMessage);
        }
      } 
      
      if(bodyData.post && noticiaSearch.dataValues.wordpress_id) {
        //actualizar
        const wordpressRes = updateInWordpress(noticiaSearch.dataValues);
        if(!wordpressRes) {
          throw new Error(errorMessage);
        }
      }

      functions.updateActionLogMessage(db, "Noticia", req.headers.authorization, bodyData.id);
      await t.commit();
      res.send({message: "La noticia fue actualizada satisfactoriamente!!", data: noticiaSearch});
    }).catch(async(err) => {
      await t.rollback();
      res.status(500).send({message: errorMessage});
    });
};

exports.delete = async (req, res) => {
    const id = req.params.id;
    const noticiaSearch = await Noticia.findOne({where: {id: id}});
    let wordpressId = false;
    if(noticiaSearch) {
      if(noticiaSearch.dataValues.wordpress_id) {
        wordpressId = noticiaSearch.dataValues.wordpress_id;
      }
    }
    Noticia.destroy({
      where: { id: id },
      individualHooks: true
    })
    .then(async (num) => {
        if (num == 1) {
          functions.deleteActionLogMessage(db, "Noticia", req.headers.authorization, id);
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