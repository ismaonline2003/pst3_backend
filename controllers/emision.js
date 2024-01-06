const db = require("../models");
const functions = require('../routes/functions');
const Emision = db.emision_radio;
const EmisionMessages = db.radio_espectador_mensaje;
const User = db.user;
const Suscripcion = db.suscripcion;
const Op = db.Sequelize.Op;

exports.findAll = (req, res) => {
    const value = req.query.value;
    let where = {status_actual: 'finalizada'}
    if(value) {
        let conditions = {titulo: {[Op.like]: `%${value}%`}, status_actual: {[Op.eq]: 'finalizada'}};
        where = conditions;
    }
    Emision.findAll({
        where: where, 
        order: [['fecha_inicio', 'DESC']]
    })
    .then((data) => {
        res.send(data);
    }).catch(err => {
        res.status(500).send({message: "Ocurrió un error durante la búsqueda de las emisiones."});
    });
}

exports.findOne = async (req, res) => {
    const id = req.params.id;
    const notFoundMessage = "La emisión no fue encontrada";
    if(!id) {
        res.status(404).send({message: notFoundMessage});
        return; 
    }
    if(isNaN(id)) {
        res.status(400).send({message: notFoundMessage});
        return; 
    }
    const emisionSearch = await Emision.findOne({where: {id: id, status_actual: 'finalizada'}});
    if(!emisionSearch) {
        res.status(404).send({message: notFoundMessage});
        return;
    }
    const emisionMessagesSearch = await EmisionMessages.findAll({where: {id_emision_radio: id}, order: [['fecha_envio', 'ASC']]});
    emisionSearch.dataValues.messages = emisionMessagesSearch;
    let messagesCount = await db.sequelize.query(`SELECT COUNT(id) AS msgs_count FROM radio_espectador_mensaje WHERE id_emision_radio = ${id} AND deleted_at IS NULL`);
    emisionSearch.dataValues.messagesCount = messagesCount[0][0].msgs_count;
    res.status(200).send(emisionSearch.dataValues);
}

exports.getCurrent = async (req, res) => {
    try {
        let resData = {radio_emision: false, emision_audio: false}
        const currentDate = new Date();
        const searchEmision = await Emision.findAll({
            where: {status_actual: "en_emision"}, 
            order: [['fecha_inicio', 'DESC']],
            limit: 1,
            include: [{model: db.radio_espectador_mensaje}]
        })
        const searchEmisionAudio = await db.emision_audio.findAll({
            where: {fecha_emision_programada: {[Op.lte]: currentDate}, fecha_fin_emision_programada: {[Op.gte]: currentDate}, taken: true}, 
            limit: 1,
            order: [['fecha_emision_programada', 'ASC']],
            include: [{model: db.radio_audio, include: [{model: db.author}]}]
        });
        if(searchEmision.length > 0) {
            resData.radio_emision = searchEmision[0].dataValues;
        }
        if(searchEmisionAudio.length > 0) {
            const diff = new Date(searchEmisionAudio[0].dataValues.fecha_fin_emision_programada).getTime() - currentDate.getTime();
            const secondsDiff = (diff / 1000) - 4; //el -4 es el tiempo que se deja entre cada emisión
            const AudioStartPoint = searchEmisionAudio[0].dataValues.radio_audio.seconds_duration - secondsDiff;
            searchEmisionAudio[0].dataValues.audio_played_current_time = AudioStartPoint; 
            resData.emision_audio = searchEmisionAudio[0].dataValues;
        }
        res.send(resData);
    } catch(err) {
        res.status(400).send({message: "Ha Ocurrido un error inesperado... Vuelva a intentarlo mas tarde."});
    }
};

exports.suscribe = async(req, res) => {
    const body = req.body;
    const searchUser = await User.findByPk(body.user_id, {include: [{model: db.person}]});
    const searchSuscripcion = await Suscripcion.findAll({where: {user_id: body.user_id, tipo: 'radio', activa: true}, limit:1});
    if(!searchUser) {
        res.status(404).send({message: "El usuario no fue encontrado"});
        return;
    }
    if(searchSuscripcion.length > 0) {
        res.status(400).send({message: 'Usted ya tiene una suscripción activa'});
        return;
    }
    Suscripcion.create({
        user_id: body.user_id,
        fecha_suscripcion: new Date(),
        username: body.username,
        email: searchUser.dataValues.login,
        tipo: 'radio',
        activa: true
    })
    .then((data) => {
        res.send(data.dataValues);
    })
    .catch(err => {
        res.status(500).send({message: "Ocurrió un error durante el registro de la suscripción."});
    });
}

exports.unsuscribe = async(req, res) => {
    const body = req.body;
    const searchSuscripcion = await Suscripcion.findAll({where: {id: body.id, tipo: 'radio', activa: true}, limit:1});
    if(searchSuscripcion.length == 0) {
        res.status(400).send({message: 'La suscripción no fue encontrada'});
        return;
    }
    Suscripcion.update({activa: false}, {where: {id: body.id}})
    .then((data) => {
        res.send();
    })
    .catch(err => {
        res.status(500).send({message: "Ocurrió un error durante el registro de la suscripción."});
    });
}
