const fs = require('fs');
const db = require("../models");
const functions = require('../routes/functions');
const Proyecto = db.proyecto;
const IntegranteProyecto = db.integrante_proyecto;
const ProyectoArchivo = db.proyecto_archivo;

const Seccion = db.seccion;
const CarreraUniversitaria = db.carrera_universitaria;
const Op = db.Sequelize.Op;

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

const getTurnoName = (turno) => {
    let turnoName = "";
    if(turno == 1) {
        turnoName = "Mañana";
    }
    if(turno == 2) {
        turnoName = "Tarde";
    }
    if(turno == 3) {
        turnoName = "Noche";
    }
    return turnoName;
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

const createProjectFiles = async (projectId, fileList, files, type, transaction) => {
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


exports.create = async (req, res) => {
    const t = await db.sequelize.transaction();
    const bodyData = JSON.parse(req.body.data);
    const validations= await recordCreateValidations(bodyData);
    let errorMessage = "Ocurrió un error inesperado al intentar crear el registro.";

    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
    }
    await Proyecto.create({
      id_seccion: bodyData.id_seccion,
      nombre: bodyData.nombre,
      descripcion: bodyData.descripcion
    }, {transaction: t}).then(async (proyectoRes) => {
      bodyData.id = proyectoRes.id;
      const integrantesCreate = await createIntegrantes(proyectoRes.id, bodyData.id_seccion, bodyData.integrantes, t);
      if(integrantesCreate.status != 'success') {
        errorMessage = integrantesCreate.msg;
        throw new Error(errorMessage);
      }
      bodyData.integrantes = integrantesCreate.data;

      const imgsCreate = await createProjectFiles(proyectoRes.id, bodyData.imgs, req.files, 'IMG', t);
      if(imgsCreate.status != 'success') {
        errorMessage = imgsCreate.msg;
        throw new Error(errorMessage);
      }
      bodyData.imgs = imgsCreate.data;

      const docsCreate = await createProjectFiles(proyectoRes.id, bodyData.docs, req.files, 'DOC', t);
      if(docsCreate.status != 'success') {
        errorMessage = docsCreate.msg;
        throw new Error(errorMessage);
      }
      bodyData.docs = docsCreate.data;
      await t.commit();
      const proyectoSearch = await Proyecto.findOne({include: { all: true, nested: true }, where: {id: bodyData.id}});

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
    console.log(condition);
    let searchConfig = {include: [{model: Seccion}], limit:limit};
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
  Proyecto.findOne({include: { all: true, nested: true }, where: {id: id}, paranoid: true})
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
    const updateData = {
      nombre: bodyData.nombre,
      descripcion: bodyData.descripcion,
      id_seccion: bodyData.id_seccion
    }
    const validations= await recordUpdateValidations(bodyData);
    let errorMessage = "Ocurrió un error inesperado al intentar actualizar el registro.";

    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
      return;
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
        const imgsCreate = await createProjectFiles(bodyData.id, bodyData.addedImgs, req.files, 'IMG', t);
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
        const docsCreate = await createProjectFiles(bodyData.id, bodyData.addedDocs, req.files, 'DOC', t);
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

        await t.commit();
        const proyectoSearch = await Proyecto.findOne({include: { all: true, nested: true }, where: {id: bodyData.id}});

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
    Proyecto.destroy({
      where: { id: id },
      individualHooks: true,
      transaction: t
    })
    .then(num => {
        if (num == 1) {
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