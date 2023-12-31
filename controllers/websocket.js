const fs = require('fs');
const ffmepg = require('ffmpeg-static');
const childProcess = require('child_process');
const cron = require('node-cron')
const childProcess_currentAudioFile = `${process.cwd()}/src/current_emision/current_audio.mp3`;
const childProcess_outputAudioFile = `${process.cwd()}/src/current_emision/output_audio.mp3`;

const fs_currentAudioFile = `./src/current_emision/current_audio.mp3`;
const fs_outputAudioFile = `./src/current_emision/output_audio.mp3`;
const fs_audioPieces = `./src/current_emision/pieces`;
const fs_latestAudioPieces = `./src/current_emision/latest_pieces`;

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
        this.socket = socket;
        this.socket.on('MicroAudio', this.onMicroAudio);
    }
    sendAudioStreamToClients = (io) => {
        let filesList = fs.readdirSync(fs_latestAudioPieces);
        if(filesList.length > 0) {
            let filePath = `${fs_latestAudioPieces}/${filesList[0]}`;
            let read = fs.readFileSync(filePath);
            io.sockets.emit('radioAudio', {'file': read});
            fs.copyFileSync(filePath,  `${fs_audioPieces}/${filesList[0]}`);
            fs.unlinkSync(filePath);
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
        console.log('data.audioData', data.audioData);
        fs.writeFile(fs_currentAudioFile, data.audioData, () => console.log('audio saved!') );
        this._sliceAudio();
        //const stream = await blobObj.stream();
        //const outbound = JSON.stringify(data);
    }
    close = () => {
    }
}
module.exports = WSController;