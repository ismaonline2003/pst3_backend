const jwt = require('jsonwebtoken');
exports.verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (token == null) return res.sendStatus(403);
    jwt.verify(token, "secret_key", (err, user) => {
       if (err) return res.sendStatus(404);
       req.user = user;
       next();
    });
}

exports.personaFieldsValidations = (data) => {
   let objReturn = {status: 'success', msg: ''}
   const whiteSpacesRegEx = /\s/g;
   const numbersRegEx = /\d/g;
   const onlyLettersRegEx =  /^[A-Za-z]+$/g;
   const lettersRegEx =  /[A-Za-z]/g;
   const ciTypes = ["V", "J", "E", "P"];

   //ci type validations    
   if(!ciTypes.includes(data.ci_type)) {
       objReturn = {status: 'error', msg: 'El tipo de número de cédula debe ser uno de los siguientes: V, J, E, P.'}
       return objReturn;
   }

   //ci validations
   if(whiteSpacesRegEx.test(data.ci)) {
       objReturn = {status: 'error', msg: 'El número de cédula no puede contener espacios en blanco.'}
       return objReturn;
   }
   if(isNaN(parseInt(data.ci))) {
       objReturn = {status: 'error', msg: 'El número de cédula solo puede contener números.'}
       return objReturn;
   }
   if(data.ci == "0") {
       objReturn = {status: 'error', msg: 'El número de cédula no puede ser 0.'}
       return objReturn;
   }
   if(data.ci.length > 9) {
       objReturn = {status: 'error', msg: 'El número de cédula no puede superar los 9 caracteres.'}
       return objReturn;
   }
   if(data.ci == "") {
       objReturn = {status: 'error', msg: 'El  número de cédula no puede estar vacío.'}
       return objReturn;
   }

   //name validations
   if(whiteSpacesRegEx.test(data.name)) {
       objReturn = {status: 'error', msg: 'El nombre no puede contener espacios en blanco.'}
       return objReturn;
   }
   if(numbersRegEx.test(data.name)) {
       objReturn = {status: 'error', msg: 'El nombre no puede contener números.'}
       return objReturn;
   }
   if(!data.name.match(onlyLettersRegEx)) {
       objReturn = {status: 'error', msg: 'El nombre solo puede contener letras.'}
       return objReturn;
   }
   if(data.name.length > 20) {
       objReturn = {status: 'error', msg: 'El nombre no puede superar los 20 caracteres.'}
       return objReturn;
   }
   if(data.name == "") {
       objReturn = {status: 'error', msg: 'El nombre no puede estar vacío.'}
       return objReturn;
   }

   //lastname validations
   if(whiteSpacesRegEx.test(data.lastname)) {
       objReturn = {status: 'error', msg: 'El apellido no puede contener espacios en blanco.'}
       return objReturn;
   }
   if(numbersRegEx.test(data.lastname)) {
       objReturn = {status: 'error', msg: 'El apellido no puede contener números.'}
       return objReturn;
   }
   if(!data.lastname.match(onlyLettersRegEx)) {
       objReturn = {status: 'error', msg: 'El apellido solo puede contener letras.'}
       return objReturn;
   }
   if(data.lastname.length > 20) {
       objReturn = {status: 'error', msg: 'El apellido no puede superar los 20 caracteres.'}
       return objReturn;
   }
   if(data.lastname == "") {
       objReturn = {status: 'error', msg: 'El apellido no puede estar vacío.'}
       return objReturn;
   }

   //phone validations
   if(whiteSpacesRegEx.test(data.phone)) {
       objReturn = {status: 'error', msg: 'El número de telefono no puede contener espacios en blanco.'}
       return objReturn;
   }
   if(data.phone.match(lettersRegEx)) {
       objReturn = {status: 'error', msg: 'El número de telefono no puede contener letras.'}
       return objReturn;
   }
   if(data.phone.length > 15) {
       objReturn = {status: 'error', msg: 'El número de telefono no puede superar los 15 digitos.'}
       return objReturn;
   }
   if(data.phone == "") {
       objReturn = {status: 'error', msg: 'El número de teléfono no puede estar vacío.'}
       return objReturn;
   }

   //mobile validations
   if(whiteSpacesRegEx.test(data.mobile)) {
       objReturn = {status: 'error', msg: 'El número de telefono móvil no puede contener espacios en blanco.'}
       return objReturn;
   }
   if(data.mobile.match(lettersRegEx)) {
       objReturn = {status: 'error', msg: 'El número de telefono móvil no puede contener letras.'}
       return objReturn;
   }
   if(data.mobile.length > 15) {
       objReturn = {status: 'error', msg: 'El número de telefono móvil no puede superar los 15 digitos.'}
       return objReturn;
   }
   
   return objReturn;
}

exports.onDeleteRestrictValidation = async (model, foreignKey, id) => {
    //validación de que la persona no tenga algun registro asociado
    let searchRecord = await model.findAll({where: {[foreignKey]: id}})
    if(searchRecord.length > 0) {
      console.log('No se puede eliminar este registro')
      throw ('No se puede eliminar este registro');
    }
}

exports.searchUserByPersonName = async (db, value) => {
    let ids_list = [];
    let recordsSearch = await db.sequelize.query(`
        SELECT 
            u.id AS user_id 
        FROM users AS u 
        INNER JOIN person AS p ON p.id = u.person_id
        WHERE CONCAT(p.name,' ', p.lastname) LIKE '%${value}%' 
        AND u.deleted_at IS NOT NULL 
        AND p.deleted_at IS NOT NULL
    `);
    if(recordsSearch.length > 0) {
        for(let i = 0; i < recordsSearch[0].length; i++) {
            ids_list.push(recordsSearch[0][i].user_id);
        }
    }
    return ids_list;
}