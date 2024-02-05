const fs = require('fs');
const WPAPI = require('wpapi');
const db = require("../models");
const functions = require('../routes/functions');
const wordpressConfig = require('../config/wordpress_config')
const wapi_config = wordpressConfig.wapi_config;
const Proyecto = db.proyecto;
const IntegranteProyecto = db.integrante_proyecto;
const ProyectoArchivo = db.proyecto_archivo;
const Seccion = db.seccion;
const CarreraUniversitaria = db.carrera_universitaria;
const Op = db.Sequelize.Op;
const searchInclude = {include: [
  {model: db.seccion, include: [{model: db.carrera_universitaria}]},
  {
    model: db.integrante_proyecto, 
    include: [
      {
        model: db.inscripcion,
        include: [
          {model: db.estudiante, include: [{model: db.person}]},
          {model: db.seccion}
        ]
      }
    ]
  },
  {model: db.proyecto_archivo},
  {model: db.profesor, include: [{model: db.person}]}
]}


const generalValidations = async (data, integrantesAdded) =>  {
  let objReturn = {'status': 'success', 'data': {}, 'msg': ''};
  if(data.nombre.trim() == '') {
    objReturn = {'status': 'error', 'data': {}, 'msg': 'Debe escribir un nombre válido para el proyecto'};
    return objReturn;
  }
  if(data.descripcion.trim() == '') {
    objReturn = {'status': 'error', 'data': {}, 'msg': 'Debe escribir una descripción válida para el proyecto'};
    return objReturn;
  }
  if(isNaN(data.id_seccion)) {
    objReturn = {'status': 'error', 'data': {}, 'msg': 'Debe seleccionar una sección'};
    return objReturn;
  }
  let integrantesIds = [];
  for(let i = 0; i < integrantesAdded.length; i++) {
    let integrante = integrantesAdded[i];
    if(integrantesIds.includes(integrante.id)) {
      objReturn = {'status': 'error', 'data': {}, 'msg': 'No puede asociar al mismo estudiante dos veces.'};
      return objReturn;
    }
    integrantesIds.push(integrante.id);
    let inscripcionSearch = await db.sequelize.query(`
      SELECT 
        i.id AS id
      FROM inscripcion AS i
      INNER JOIN estudiante AS e ON e.id = i.estudiante_id
      WHERE i.estudiante_id = ${integrante.id}
      AND i.seccion_id = ${data.id_seccion}
      AND i.deleted_at IS NULL
      AND e.deleted_at IS NULL
      LIMIT 1
    `);
    if(inscripcionSearch.length == 0) {
      objReturn = {'status': 'error', 'data': {}, 'msg': 'Todos los estudiantes deben estar inscritos a la sección seleccionada.'};
      return objReturn;
    }
  }
  return objReturn;
}

const recordCreateValidations = async (data) =>  {
  let objReturn = {'status': 'success', 'data': {}, 'msg': ''};
  let general_validations = await generalValidations(data, data.integrantes);
  if(general_validations.status != 'success') {
    return general_validations;
  }
  return objReturn;
}

const recordUpdateValidations = async (data) => {
  let objReturn = {'status': 'success', 'data': {}, 'msg': ''};
  let general_validations = await generalValidations(data, data.addedIntegrantes);
  if(general_validations.status != 'success') {
    return general_validations;
  }
  return objReturn;
}

const searchPNFByName = async (value) => {
    let search = await CarreraUniversitaria.findAll({where: {nombre: {[Op.like]: `%${value}%`}}});
    return search;
}

const createIntegrantes = async (proyectoId, seccionId, integrantesData, t) => {
    let objReturn = {status: 'success', msg: '', data: []};
    for(let i = 0; i < integrantesData.length; i++) {
      let integrante = integrantesData[i];
      let query1 = await db.sequelize.query(`
            SELECT 
              ip.inscripcion_id AS inscripcion_id
            FROM integrante_proyecto AS ip
            INNER JOIN inscripcion AS i ON i.id = ip.inscripcion_id
            INNER JOIN estudiante AS e ON e.id = i.estudiante_id
            WHERE ip.proyecto_id = ${proyectoId}
            AND i.seccion_id = ${seccionId}
            AND i.estudiante_id = ${integrante.id}
            AND i.deleted_at IS NULL
            AND e.deleted_at IS NULL
            LIMIT 1
        `);

        if(query1[0].length == 0) {
            let query2 = await db.sequelize.query(`
                SELECT 
                  i.id AS id
                FROM inscripcion AS i
                INNER JOIN estudiante AS e ON e.id = i.estudiante_id
                WHERE i.estudiante_id = ${integrante.id}
                AND i.seccion_id = ${seccionId}
                AND i.deleted_at IS NULL
                AND e.deleted_at IS NULL
                LIMIT 1
            `);

            if(query2[0].length > 0) {
                let integranteData = {proyecto_id: parseInt(proyectoId), inscripcion_id: query2[0][0]['id']}
                await IntegranteProyecto.create(integranteData, {transaction: t})
                .then(integranteRes => {
                    integranteData.record_id = integranteRes.id;
                    objReturn.data.push(integranteData)
                })
                .catch(async (err) => {
                    objReturn = {status: 'error', msg: `Ocurrió un error durante el proceso... Vuelva a intentarlo mas tarde.`, data: []};
                    return objReturn;
                });  
            } 
            
            if(query2[0].length == 0) {
                objReturn = {status: 'error', msg: `El estudiante ${integrante.ci_nombre} no pertenece a la sección seleccionada.`, data: []};
                return objReturn;
            }
        }
    }
    return objReturn;
}

const deleteIntegrantes = async (proyectoId, seccionId, integrantesData, t) => {
    let objReturn = {status: 'success', msg: '', data: []};
    for(let i = 0; i < integrantesData.length; i++) {
        let integrante = integrantesData[i];
        let integranteSearch = await db.sequelize.query(`
              SELECT 
                ip.id AS id
              FROM integrante_proyecto AS ip
              INNER JOIN inscripcion AS i ON i.id = ip.inscripcion_id
              INNER JOIN estudiante AS e ON e.id = i.estudiante_id
              WHERE ip.proyecto_id = ${proyectoId}
              AND i.seccion_id = ${seccionId}
              AND ip.id = ${integrante.id}
              AND i.deleted_at IS NULL
              AND e.deleted_at IS NULL
              LIMIT 1
        `);

        if(integranteSearch.length > 0) {
            await IntegranteProyecto.destroy({where: { id: integranteSearch[0][0]['id'] }, individualHooks: true, transaction: t})
            .then(integranteDeleteRes => {
              objReturn.data.push(integranteSearch[0][0]['id']);
            })
            .catch(async (err) => {
                objReturn = {status: 'error', msg: `Ocurrió un error durante el proceso... Vuelva a intentarlo mas tarde.`, data: []};
                return objReturn;
            });  
        }
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
  if(file.mimetype == 'application/pdf') {
    type = "pdf";
  }
  filename += `.${type}`;
  return filename;
}

const createProjectFiles = async (projectId, fileList, files, type, transaction, initVal) => {
    let objReturn = {status: 'success', msg: '', data: []};
    for(let i = 0; i < fileList.length; i++) {
        let item = fileList[i];
        let file = files[item.index];
        const fileRead = fs.readFileSync(file.path);
        const filename = getFileName(file);
        const filePath = `src/fileUploads/${filename}`;
        fs.writeFileSync(filePath, fileRead);
        fs.unlinkSync(file.path);
        let fileData = {};
        if(type == 'IMG') {
            fileData = {
                id_proyecto: projectId,
                nombre: item.nombre,
                descripcion: item.descripcion,
                posicion: item.position,
                tipo: type,
                url: filePath
            }
        }
        if(type == 'DOC') {
          fileData = {
              id_proyecto: projectId,
              nombre: item.nombre,
              posicion: item.position,
              tipo: type,
              url: filePath
          }
        }

        if(fileData) {
                  await ProyectoArchivo.create(fileData, {transaction:transaction})
        .then((proyectoArchivoRes) => {
            fileData.id = proyectoArchivoRes.id;
            objReturn.data.push(fileData)
        })
        .catch((err) => {
            objReturn = {status: 'error', msg: `Ocurrió un error durante el proceso... Vuelva a intentarlo mas tarde.`, data: []};
            return objReturn;
        })
        }
    }
    return objReturn;
}

const updateProjectFiles = async (projectId, fileList, type, transaction) => {
  let objReturn = {status: 'success', msg: '', data: []};
    for(let i = 0; i < fileList.length; i++) {
        let item = fileList[i];
        let fileData = {};
        if(type == 'IMG') {
            fileData = {nombre: item.nombre, descripcion: item.descripcion}
        }
        if(type == 'DOC') {
          fileData = {nombre: item.nombre}
        }
        await ProyectoArchivo.update(fileData, {where: {id: item.id}, transaction: transaction})
        .then((proyectoArchivoRes) => {
            objReturn.data.push(item.id);
        })
        .catch((err) => {
            objReturn = {status: 'error', msg: `Ocurrió un error durante el proceso... Vuelva a intentarlo mas tarde.`, data: []};
            return objReturn;
        })
    }
    return objReturn;
}

const deleteProjectFiles = async (projectId, fileList, type, transaction) => {
  let objReturn = {status: 'success', msg: '', data: []};
    for(let i = 0; i < fileList.length; i++) {
        let item = fileList[i];
        let fileSearch = await db.sequelize.query(`
              SELECT id FROM proyecto_archivo WHERE id = ${item.id} AND id_proyecto = ${projectId} AND tipo = '${type}' LIMIT 1
        `);
        if(fileSearch.length > 0) {
            await ProyectoArchivo.destroy({where: { id: fileSearch[0][0]['id'] }, individualHooks: true, transaction: transaction})
            .then(proyectoArchivoDeleteRes => {
              objReturn.data.push(fileSearch[0][0]['id']);
            })
            .catch(async (err) => {
                objReturn = {status: 'error', msg: `Ocurrió un error durante el proceso... Vuelva a intentarlo mas tarde.`, data: []};
                return objReturn;
            });  
        }
    }
    return objReturn;
}


const sendMediaFileToWordpress = async(wp, data) => {
  try {
    let bodyData = {
      status: 'publish'
    };
    if(data.nombre) {
      bodyData.title = data.nombre;
      bodyData.alt_text = data.nombre;
    }
    if(data.description) {
      bodyData.caption = data.description;
      bodyData.caption = data.description;
    }
    const wordpressPostRes = await wp.media().file(`${data.url}`).create(bodyData); 
    return wordpressPostRes;
  } catch(err) {
    console.log(err);
  }
  return false;
}

const updateMediaFileToWordpress = async(wp, data) => {
  try {
    let bodyData = {
      status: 'publish'
    };
    if(data.nombre) {
      bodyData.title = data.nombre;
      bodyData.alt_text = data.nombre;
    }
    if(data.description) {
      bodyData.caption = data.description;
      bodyData.caption = data.description;
    }
    await wp.media().id(data.wordpress_id).update(bodyData); 
    const mediaData = await wp.media().id(data.wordpress_id);
    return mediaData;
  } catch(err) {
    console.log(err);
  }
  return false;
}

const sendMiniaturaToWordpress = async(wp, data) => {
  try {
    let bodyData = {
      status: 'publish'
    };
    const wordpressPostRes = await wp.media().file(`./src/fileUploads/${data.miniatura_filename}`).create(bodyData); 
    console.log('wordpressPostRes', wordpressPostRes);
    return wordpressPostRes;
  } catch(err) {
    console.log(err);
  }
  return false;
}

const getPlantillaContent = (data, imgs) => {
  let integrantesProyectoHtml = "";
  data.integrante_proyectos.map((i) => {
    integrantesProyectoHtml += `<li><span style="color: #808080">${i.inscripcion.estudiante.person.name} ${i.inscripcion.estudiante.person.lastname}</span></li>`;
  });
  let proyectoArchivosImgHTML = "";
  imgs.map((p_a) => {
    let proyectoArchivoUrl =  `${wordpressConfig.img_endpoint}/${p_a.url.replace('src/fileUploads/', '')}`;
    proyectoArchivosImgHTML += `
      <figure class="gallery-item">
        <div class="gallery-icon landscape">
          <a
            data-elementor-open-lightbox="yes"
            data-elementor-lightbox-title="${p_a.nombre}"
            href="${p_a.wordpress_url}"
            ><img
              loading="lazy"
              decoding="async"
              width="640"
              height="427"
              src="${p_a.wordpress_url}"
              class="attachment-large size-large"
              alt=""
              aria-describedby="gallery-1-${p_a.wordpress_id}"
          /></a>
        </div>
        <figcaption
          class="wp-caption-text gallery-caption"
          id="gallery-1-${p_a.wordpress_id}"
        >
          ${p_a.nombre}
        </figcaption>
      </figure>
    `; 
    /*
    proyectoArchivosImgHTML += `
        <figure class="gallery-item" style="width: 250px !important;">
          <div class="gallery-icon landscape" style="text-align: center !important; width: 100% !important;">
            <a
              href="${proyectoArchivoUrl}"
              target="_blank"
              style="width: 100% !important; height: 250px !important; background-image: url(${proyectoArchivoUrl}); background-position: center; background-repeat: no-repeat; background-size: cover;"
              ></a>
          </div>
          <figcaption
            class="wp-caption-text gallery-caption"
          >
            <strong>${p_a.nombre}</strong>
          </figcaption>
        </figure>
    `
    */
  });
  let proyectoArchivosDocHTML = "";
  data.proyecto_archivos.filter(p_a => p_a.tipo === 'DOC').map((p_a) => {
    let proyectoArchivoUrl =  `${wordpressConfig.img_endpoint}/${p_a.url.replace('src/fileUploads/', '')}`;
    proyectoArchivosDocHTML += `
      <a href="${proyectoArchivoUrl}" target="_blank" rel="noopener" data-wplink-url-error="true">${p_a.nombre}</a>
    `
  })
  /*
    <div class="elementor-widget-container w-100 text-center">
      <img class="img-fluid wp-post-image" src="${wordpressConfig.img_endpoint}/${data.miniatura_filename}" alt="" decoding="async"  style="width: 80% !important;">
    </div>
    <br/>
  */
  let content = `
    <div class="elementor-widget-container" style="color: #808080 !important;">
      <h3><span style="color: #6ec1e4">Autores del Proyecto</span></h3>
      <ul>
        ${integrantesProyectoHtml}
      </ul>
      <h3>
        <span style="color: #6ec1e4"><strong>Descripción</strong></span>
      </h3>
      ${data.descripcion}
    </div>
    <div class="elementor-widget-container">
      <h3>
        <span style="color: #6ec1e4"><strong>Imagenes</strong></span>
      </h3>
      <div class="elementor-image-gallery">
          <div class="gallery gallery-columns-4 gallery-size-large  text-left">
            ${proyectoArchivosImgHTML}
          </div>
      </div>
    </div>
    `;
    if(proyectoArchivosDocHTML) {
      content += `
        <div class="elementor-widget-container text-left" style="color: #808080 !important;">
          <h3><span style="color: #6ec1e4">Archivos Adjuntos</span></h3>
          <ul>
            ${proyectoArchivosDocHTML}
          </ul>
        </div>
      `;
    }
  return content;
}

const sendPostToWordpress = async(db, t, data) => {
  try {
    const wp = new WPAPI(wapi_config);
    //subir miniatura
    if(!data.miniatura_wordpress_id) {
      const miniaturaWordpressId = await sendMiniaturaToWordpress(wp, data);
      if(miniaturaWordpressId && miniaturaWordpressId.id) {
        await db.proyecto.update({miniatura_wordpress_id: miniaturaWordpressId.id}, {where: {id: data.id}});
        data.miniatura_wordpress_id = miniaturaWordpressId.id;
      }
    }

    //subir imagenes
    const imgsWithoutWordrpessId = data.proyecto_archivos.filter(item => item.tipo === 'IMG' && !item.wordpress_id);
    for(let i = 0; i < imgsWithoutWordrpessId.length; i++) {
      const uploadMediaFile = await sendMediaFileToWordpress(wp, imgsWithoutWordrpessId[i]);
      if(uploadMediaFile) {
        await db.proyecto_archivo.update({wordpress_id: uploadMediaFile.id}, {where: {id: imgsWithoutWordrpessId[i].id}});
        imgsWithoutWordrpessId[i].wordpress_id = uploadMediaFile.id;
      }
    }

    //actualizar imagenes
    const imgsWithWordrpessId = data.proyecto_archivos.filter(item => item.tipo === 'IMG' && item.wordpress_id);
    for(let i = 0; i < imgsWithWordrpessId.length; i++) {
      const mediaData = await updateMediaFileToWordpress(wp, imgsWithWordrpessId[i]);
      if(mediaData) {
        imgsWithWordrpessId[i].wordpress_url = mediaData.source_url;
      }
    }

    const proyectoArchivos = [...imgsWithoutWordrpessId, ...imgsWithWordrpessId];

    const wordpressContent = getPlantillaContent(data, proyectoArchivos);
    const wordpressPostRes = await wp.posts().create({
        featured_media: data.miniatura_wordpress_id,
        // "title" and "content" are the only required properties
        title: data.nombre,
        content: wordpressContent,
        categories: [wordpressConfig.categoria_noticia_proyecto_id],
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

const updateInWordpress = async(db, t, data) => {
  try {
      if(data.wordpress_id) {
        const wp = new WPAPI(wapi_config);
        //subir miniatura
        if(!data.miniatura_wordpress_id) {
          const miniaturaWordpressId = await sendMiniaturaToWordpress(wp, data);
          if(miniaturaWordpressId) {
            await db.proyecto.update({miniatura_wordpress_id: miniaturaWordpressId.id}, {where: {id: data.id}});
            data.miniatura_wordpress_id = miniaturaWordpressId.id;
          }
        }

        //subir imagenes
        const imgsWithoutWordrpessId = data.proyecto_archivos.filter(item => item.tipo === 'IMG' && !item.wordpress_id);
        for(let i = 0; i < imgsWithoutWordrpessId.length; i++) {
          const uploadMediaFile = await sendMediaFileToWordpress(wp, imgsWithoutWordrpessId[i]);
          if(uploadMediaFile) {
            await db.proyecto_archivo.update({wordpress_id: uploadMediaFile.id}, {where: {id: imgsWithoutWordrpessId[i].id}});
            imgsWithoutWordrpessId[i].wordpress_id = uploadMediaFile.id;
          }
        }

        //actualizar imagenes
        const imgsWithWordrpessId = data.proyecto_archivos.filter(item => item.tipo === 'IMG' && item.wordpress_id);
        for(let i = 0; i < imgsWithWordrpessId.length; i++) {
          const mediaData = await updateMediaFileToWordpress(wp, imgsWithWordrpessId[i]);
          if(mediaData) {
            imgsWithWordrpessId[i].wordpress_url = mediaData.source_url;
          }
        }

        const proyectoArchivos = [...imgsWithoutWordrpessId, ...imgsWithWordrpessId];

        const wordpressContent = getPlantillaContent(data, proyectoArchivos);
        const wordpressRes = await wp.posts().id(data.wordpress_id).update({
          featured_media: data.miniatura_wordpress_id,
          title: data.nombre,
          content: wordpressContent,
          categories: [wordpressConfig.categoria_noticia_proyecto_id],
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
    if(wordpressId) {
      const wp = new WPAPI(wapi_config);
      const wordpressRes = await wp.posts().id(wordpressId).delete({force: true}); 
      console.log(wordpressRes);
      return true;
    }
  } catch(err) {
    console.log(err);
  }
  return false;
}

const getMiniaturaFilename = (file) => {
  const fileRead = fs.readFileSync(file.path);
  const filename = getFileName(file);
  const filePath = `src/fileUploads/${filename}`;
  fs.writeFileSync(filePath, fileRead);
  fs.unlinkSync(file.path);
  return filename;
}

exports.create = async (req, res) => {
    const t = await db.sequelize.transaction();
    const bodyData = JSON.parse(req.body.data);
    const validations= await recordCreateValidations(bodyData);
    let errorMessage = "Ocurrió un error inesperado al intentar crear el registro.";
    let filesInitVal = 0;
    let createBodyData = {
      id_seccion: bodyData.id_seccion,
      nombre: bodyData.nombre,
      descripcion: bodyData.descripcion,
      miniatura_filename: ""
    }

    if(bodyData.id_profesor) {
      if(isNaN(bodyData.id_profesor)) {
        res.status(500).send({message: "El profesor seleccionado no existe"});
        return;
      }
  
      const profesorSearch = await db.profesor.findAll({where: {id: bodyData.id_profesor}, limit:1});
      if(profesorSearch.length === 0) {
        res.status(500).send({message: "El profesor seleccionado no existe"});
        return;
      }
      bodyData.id_profesor = bodyData.id_profesor;
    }

    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
    }

    if(bodyData.miniaturaAdded) {
      const miniaturaFilename = getMiniaturaFilename(req.files[0]);
      if(miniaturaFilename) {
        createBodyData.miniatura_filename = miniaturaFilename;
        filesInitVal = 1;
      }
    }

    await Proyecto.create(createBodyData, {transaction: t}).then(async (proyectoRes) => {
      bodyData.id = proyectoRes.id;
      const integrantesCreate = await createIntegrantes(proyectoRes.id, bodyData.id_seccion, bodyData.integrantes, t);
      if(integrantesCreate.status != 'success') {
        errorMessage = integrantesCreate.msg;
        throw new Error(errorMessage);
      }
      bodyData.integrantes = integrantesCreate.data;

      const imgsCreate = await createProjectFiles(proyectoRes.id, bodyData.imgs, req.files, 'IMG', t, filesInitVal);
      if(imgsCreate.status != 'success') {
        errorMessage = imgsCreate.msg;
        throw new Error(errorMessage);
      }
      bodyData.imgs = imgsCreate.data;

      const docsCreate = await createProjectFiles(proyectoRes.id, bodyData.docs, req.files, 'DOC', t, filesInitVal);
      if(docsCreate.status != 'success') {
        errorMessage = docsCreate.msg;
        throw new Error(errorMessage);
      }
      bodyData.docs = docsCreate.data;
      await t.commit();
      const proyectoSearch = await Proyecto.findOne({...searchInclude, where: {id: bodyData.id}});

      functions.createActionLogMessage(db, "Proyecto", req.headers.authorization, bodyData.id);

      res.status(200).send(proyectoSearch.dataValues);
    }).catch(async (err) => {
      await t.rollback();
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
    var condition = [];
    if(parameter) {
        if(parameter == 'ref') {
            condition = {id: value};
        }
        if(parameter == 'nombre') {
            condition = {nombre: {[Op.like]: `%${value}%`}};
        }
        //cambiar
        if(parameter == 'seccion') {
            condition = {nombre: {[Op.like]: `%${value}%`}};
        }
        if(parameter == 'trayecto') {
            condition = {trayecto: value};
        }
        if(parameter == 'pnf') {
            let searchPNF = await searchPNFByName(value);
            if(searchPNF.length > 0) {
                let inArr = [];
                searchPNF.map((item) => {
                    inArr.push(item.dataValues.id);
                })                
                condition = {pnf_id: inArr};
            } else {
                condition = {pnf_id: [0]};
            }
        }
    }
    let searchConfig = {include: [{model: Seccion}, {model: db.profesor}], limit:limit, order: [['id', 'DESC']]};
    if(!['seccion', 'trayecto', 'pnf'].includes(parameter)) {
        searchConfig['where'] = condition;
    } else {
        searchConfig.include[0]['where'] = condition;
    }

    Proyecto.findAll(searchConfig)
    .then((data) => {
        res.send(data)
    })
    .catch(err => {
        res.status(500).send({
            message: "Ocurrió un error durante la busqueda del registro."
        });
    });
};

exports.findOne = (req, res) => {
  const id = req.params.id;
  Proyecto.findOne({...searchInclude, where: {id: id}, paranoid: true})
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

exports.update = async (req, res) => {
    const t = await db.sequelize.transaction();
    const bodyData = JSON.parse(req.body.data);
    let updateData = {
      nombre: bodyData.nombre,
      descripcion: bodyData.descripcion,
      id_seccion: bodyData.id_seccion
    }

    if(bodyData.id_profesor) {
      
      if(isNaN(bodyData.id_profesor)) {
        res.status(500).send({message: "El profesor seleccionado no existe"});
        return;
      }

      const profesorSearch = await db.profesor.findAll({where: {id: bodyData.id_profesor}, limit:1});
      if(profesorSearch.length === 0) {
        res.status(500).send({message: "El profesor seleccionado no existe"});
        return;
      }
      bodyData.id_profesor = bodyData.id_profesor;
    }
    
    let filesInitVal = 0;
    const validations= await recordUpdateValidations(bodyData);
    let errorMessage = "Ocurrió un error inesperado al intentar actualizar el registro.";

    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
      return;
    }

    if(bodyData.miniaturaAdded) {
      const miniaturaFilename = getMiniaturaFilename(req.files[0]);
      if(miniaturaFilename) {
        updateData.miniatura_filename = miniaturaFilename;
        updateData.miniatura_wordpress_id = null;
        filesInitVal = 1;
      }
    }

    Proyecto.update(updateData, {where: {id: bodyData.id}, transaction: t})
    .then(async (proyectoRes) => {
        //integrantes
        const integrantesCreate = await createIntegrantes(bodyData.id, bodyData.id_seccion, bodyData.addedIntegrantes, t);
        if(integrantesCreate.status != 'success') {
          errorMessage = integrantesCreate.msg;
          throw new Error(errorMessage);
        }

        const integrantesDelete = await deleteIntegrantes(bodyData.id, bodyData.id_seccion, bodyData.deletedIntegrantes, t);
        if(integrantesDelete.status != 'success') {
          errorMessage = integrantesDelete.msg;
          throw new Error(errorMessage);
        }

        //imgs
        const imgsCreate = await createProjectFiles(bodyData.id, bodyData.addedImgs, req.files, 'IMG', t, filesInitVal);
        if(imgsCreate.status != 'success') {
          errorMessage = imgsCreate.msg;
          throw new Error(errorMessage);
        }

        const imgsUpdate = await updateProjectFiles(bodyData.id, bodyData.imgsUpdated, 'IMG', t);
        if(imgsUpdate.status != 'success') {
          errorMessage = imgsUpdate.msg;
          throw new Error(errorMessage);
        }

        const imgsDelete = await deleteProjectFiles(bodyData.id, bodyData.deletedImgs, 'IMG', t);
        if(imgsDelete.status != 'success') {
          errorMessage = imgsDelete.msg;
          throw new Error(errorMessage);
        }

        //docs
        const docsCreate = await createProjectFiles(bodyData.id, bodyData.addedDocs, req.files, 'DOC', t, filesInitVal);
        if(docsCreate.status != 'success') {
          errorMessage = docsCreate.msg;
          throw new Error(errorMessage);
        }

        const docsUpdate = await updateProjectFiles(bodyData.id, bodyData.docsUpdated, 'DOC', t);
        if(docsUpdate.status != 'success') {
          errorMessage = docsUpdate.msg;
          throw new Error(errorMessage);
        }

        const docsDelete = await deleteProjectFiles(bodyData.id, bodyData.deletedDocs, 'DOC', t);
        if(docsDelete.status != 'success') {
          errorMessage = docsDelete.msg;
          throw new Error(errorMessage);
        }
        
        //wordpress Integration
        console.log(bodyData);
        await t.commit();
        let proyectoSearch = await Proyecto.findOne({...searchInclude, where: {id: bodyData.id}});
        if(bodyData.post && !proyectoSearch.dataValues.wordpress_id) {
          //crear
          const wordpressId = await sendPostToWordpress(db, t, proyectoSearch.dataValues);
          if(!wordpressId) {
            throw new Error(errorMessage);
          }
          await Proyecto.update({wordpress_id : wordpressId}, {where: {id: bodyData.id}});

        } else if(!bodyData.post && proyectoSearch.dataValues.wordpress_id) {
          //ocultar
          const wordpressRes= hideInWordpress(proyectoSearch.dataValues.wordpress_id);
          if(!wordpressRes) {
            throw new Error(errorMessage);
          }

        } else if(bodyData.post && proyectoSearch.dataValues.wordpress_id) {
          //actualizar
          proyectoSearch = await Proyecto.findOne({...searchInclude, where: {id: bodyData.id}});
          const wordpressRes = updateInWordpress(db, t, proyectoSearch.dataValues);
          if(!wordpressRes) {
            throw new Error(errorMessage);
          }

        }


        functions.updateActionLogMessage(db, "Proyecto", req.headers.authorization, bodyData.id);
        res.status(200).send({...proyectoSearch.dataValues, message: "El proyecto fue actualizado exitosamente!!"});

      }).catch(async (err) => {
        console.log(err);
        await t.rollback();
        res.status(500).send({message: errorMessage});
      });
};

const deleteRelatedRecords = async(projectId, transaction) => {
  let objReturn = {status: 'success', msg: '', data: {integrantes: [], files: []}};
  let integrantesQuery = await db.sequelize.query(`SELECT id FROM integrante_proyecto WHERE proyecto_id = ${projectId}`);
  let proyectoArchivoQuery = await db.sequelize.query(`SELECT id FROM proyecto_archivo WHERE id_proyecto = ${projectId}`);
  if(integrantesQuery.length > 0) {
    for(let i = 0; i < integrantesQuery[0].length; i++) {
      const record = integrantesQuery[0][i];
      await IntegranteProyecto.destroy({where: { id: record.id }, individualHooks: true, transaction: transaction})
      .then(deleteRes => {
        objReturn.data.integrantes.push(record.id);
      })
      .catch(async (err) => {
          objReturn = {status: 'error', msg: `Ocurrió un error durante el proceso... Vuelva a intentarlo mas tarde.`, data: []};
          return objReturn;
      });  
    }
  }
  if(proyectoArchivoQuery.length > 0) {
    for(let i = 0; i < proyectoArchivoQuery[0].length; i++) {
      const record = proyectoArchivoQuery[0][i];
      await ProyectoArchivo.destroy({where: { id: record.id }, individualHooks: true, transaction: transaction})
      .then(deleteRes => {
        objReturn.data.files.push(record.id);
      })
      .catch(async (err) => {
          objReturn = {status: 'error', msg: `Ocurrió un error durante el proceso... Vuelva a intentarlo mas tarde.`, data: []};
          return objReturn;
      });  
    }
  }
  return objReturn;
}

exports.delete = async (req, res) => {
    const id = req.params.id;
    const t = await db.sequelize.transaction();
    const projectDeleteRelatedRecords = await deleteRelatedRecords(id, t);
    if(projectDeleteRelatedRecords.status != 'success') {
      await t.rollback();
      res.status(500).send({message: "Ocurrió un error durante la eliminación del proyecto. Este error es relacionado a la eliminación de los integrnates y archivos relacionados."});
    }
    const proyectoSearch = await Proyecto.findOne({where: {id: id}});
    let wordpressId = false;
    if(proyectoSearch) {
      if(proyectoSearch.dataValues.wordpress_id) {
        wordpressId = proyectoSearch.dataValues.wordpress_id;
      }
    }
    Proyecto.destroy({
      where: { id: id },
      individualHooks: true,
      transaction: t
    })
    .then(async(num) => {
        if (num == 1) {
          if(wordpressId) {
            const wordpressRes = await deleteInWordpress(wordpressId);
            if(!wordpressRes) {
              throw new Error(errorMessage);
            }
          }
          t.commit();
          functions.deleteActionLogMessage(db, "Proyecto", req.headers.authorization, id);
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
      res.status(500).send({message: "No se pudo eliminar el registro"});
    });
};