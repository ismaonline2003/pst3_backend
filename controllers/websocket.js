const fs = require('fs');
const ffmepg = require('ffmpeg-static');
const childProcess = require('child_process');
const currentAudioFile = `${process.cwd()}/src/current_emision/curent_audio.mp3`;
const outputAudioFile = `${process.cwd()}/src/current_emision/output_audio.mp3`;

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
    sendAudioStreamToClients = () => {
        setTimeout(() => {
            let read = fs.readFileSync('./src/current_emision/output_audio.mp3');
            this.socket.emit('radioAudio', {'file': read});
            this.sendAudioStreamToClients();
        }, 9000);
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
                currentAudioFile,
                '-codec:a',
                'libmp3lame',
                '-qscale:a',
                '5',
                `${outputAudioFile}`
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
            console.log(`Process exited with code: ${code}`);
            if (code === 0) {
                console.log(`FFmpeg finished successfully`);
            } else {
                console.log(`FFmpeg encountered an error, check the console output`);
            }
        });
    }
    onMicroAudio = async (data) => {
        console.log('data.audioData', data.audioData);
        fs.writeFile('./src/current_emision/curent_audio.mp3', data.audioData, () => console.log('audio saved!') );
        this._sliceAudio();
        //const stream = await blobObj.stream();
        //const outbound = JSON.stringify(data);
    }
    close = () => {
    }
}
module.exports = WSController;