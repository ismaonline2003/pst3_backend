const fs = require('fs');
const db = require("../models");
const functions = require('../routes/functions');
const Proyecto = db.proyecto;
const IntegranteProyecto = db.integrante_proyecto;
const ProyectoArchivo = db.proyecto_archivo;

const Seccion = db.seccion;
const CarreraUniversitaria = db.carrera_universitaria;
const Op = db.Sequelize.Op;

const recordValidations = (data) =>  {
  let objReturn = {'status': 'success', 'data': {}, 'msg': ''};
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
            AND ip.deleted_at IS NULL
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
                let integranteData = {proyecto_id: proyectoId, inscripcion_id: query2[0][0]['id']}
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
  

exports.create = async (req, res) => {
    const t = await db.sequelize.transaction();
    const bodyData = JSON.parse(req.body.data);
    const validations= recordValidations(bodyData);
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
      const proyectoSearch = await Proyecto.findOne({include: { all: true, nested: true }, where: {id: bodyData.id}})
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
    const id = req.params.id;
    let bodyData = req.body;
    let validations = recordValidations(bodyData);
    const errorMessage = "Ocurrió un error inesperado al intentar actualizar el registro.";
    if(validations.status != 'success') {
      res.status(400).send({message: validations.msg});
    }

    Proyecto.update(bodyData, {where: {id: id}})
    .then(recordRes => {
      res.send({message: "El registro fue actualizado satisfactoriamente!!"});
    }).catch(err => {
      res.status(500).send({message: errorMessage});
    });
};

exports.delete = (req, res) => {
    const id = req.params.id;
    Proyecto.destroy({
      where: { id: id },
      individualHooks: true
    })
    .then(num => {
        if (num == 1) {
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