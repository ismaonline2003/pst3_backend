const db = require("../models");
const fs = require('fs');
const ffmepg = require('ffmpeg-static');
const childProcess = require('child_process');
const cron = require('node-cron');
const Op = db.Sequelize.Op;
const childProcess_currentAudioFile = `${process.cwd()}/src/current_emision/current_audio.mp3`;
const childProcess_outputAudioFile = `${process.cwd()}/src/current_emision/output_audio.mp3`;

const fs_currentAudioFile = `./src/current_emision/current_audio.mp3`;
const fs_outputAudioFile = `./src/current_emision/output_audio.mp3`;
const fs_audioPieces = `./src/current_emision/pieces`;
const fs_latestAudioPieces = `./src/current_emision/latest_pieces`;
const fs_radioAudioEmisionPieces = `./src/current_emision/current_emision_radio_audio_pieces`

const { Readable } = require('stream');
class WSController {
    constructor() {
        this.socket = undefined;
    }
    _getuuidv4 = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    connection = (socket) => {
        console.log('socket connection');
        this.socket = socket;
        this.socket.on('MicroAudio', this.onMicroAudio);
        this.socket.on('newMessage', this.onChatMessage);
    }
    sendAudioStreamToClients = (io) => {
        let filesList = fs.readdirSync(fs_latestAudioPieces);
        if(filesList.length > 0) {
            let filePath = `${fs_latestAudioPieces}/${filesList[0]}`;
            //let read = fs.readFileSync(filePath);
            io.sockets.emit('radioAudio', {'filename': filesList[0]});
            fs.copyFileSync(filePath,  `${fs_audioPieces}/${filesList[0]}`);
            fs.unlinkSync(filePath);
        }
    }
    sendScheduledAudioToClients = async (io) => {
        try {
            const currentDate = new Date();
            const search = await db.emision_audio.findAll({
                where: {fecha_emision_programada: {[Op.lte]: currentDate}, fecha_fin_emision_programada: {[Op.gte]: currentDate}, taken: true}, 
                limit: 1,
                order: [['fecha_emision_programada', 'ASC']],
                include: [{model: db.radio_audio, include: [{model: db.author}]}]
            });
            if(search.length > 0) {
                const targetPath = `${fs_radioAudioEmisionPieces}/${search[0].dataValues.radio_audio.filename}`;
                const diff = new Date(search[0].dataValues.fecha_fin_emision_programada).getTime() - currentDate.getTime();
                const secondsDiff = (diff / 1000) - 4; //el -4 es el tiempo que se deja entre cada emisión
                const AudioStartPoint = search[0].dataValues.radio_audio.seconds_duration - secondsDiff;
                search[0].dataValues.audio_played_current_time = 0
                if(AudioStartPoint > 8) {
                    search[0].dataValues.audio_played_current_time = AudioStartPoint; 
                }
                io.sockets.emit('emisionScheduledAudio', {'radio_audio': true, 'audio_data': search[0].dataValues});
                return true;
            }
        } catch(err) {
            console.log("*ERRROR **", err);
        }
     }
    _sliceAudio = async() => {
        const self = this;
        // spawn an ffmpeg process
        const child = childProcess.spawn(
            ffmepg,
            // note, args must be an array when using spawn
            [
                '-y',
                '-i',
                childProcess_currentAudioFile,
                '-codec:a',
                'libmp3lame',
                '-qscale:a',
                '5',
                `${childProcess_outputAudioFile}`
            ]
        );
        await child.on('error', () => {
            // catches execution error (bad file)
            console.log(`Error executing binary: ${ffmpegPath}`);
        });
        
        await child.stdout.on('data', (data) => {
            console.log('FFmpeg stdout', data.toString());
        });
        
        await child.stderr.on('data', (data) => {
            console.log(data);
        });
        
        await child.on('close', (code) => {
            if (code === 0) {
                console.log(`Process exited with code: ${code}`);
                const currentDate = new Date();
                fs.copyFileSync(fs_outputAudioFile,  `${fs_latestAudioPieces}/${currentDate.getTime()}.mp3`);
            } else {
                console.log(`FFmpeg encountered an error, check the console output`);
            }
        });
    }
    onMicroAudio = async (data) => {
        fs.writeFile(fs_currentAudioFile, data.audioData, () => console.log('audio saved!') );
        this._sliceAudio();
        //const stream = await blobObj.stream();
        //const outbound = JSON.stringify(data);
    }
    onChatMessage = async (data) => {
        const currentDate = new Date();
        const emisionRadioRecord = await db.sequelize.query(`
            SELECT id FROM emision_radio WHERE status_actual = 'en_emision' ORDER BY fecha_inicio DESC LIMIT 1
        `);
        if(emisionRadioRecord.length > 0) {
            const chatMessageData = await db.radio_espectador_mensaje.create({
                id_emision_radio: emisionRadioRecord[0][0].id,
                user_id: data.user_id,
                username: data.username,
                content: data.content,
                fecha_envio: currentDate
            })
            this.socket.server.sockets.emit("messages", {...data, time: currentDate, id: chatMessageData.dataValues.id});
            this.socket.server.sockets.off('newMessage', this.onChatMessage);
        }
    }
    close = () => {
    }
}
module.exports = WSController;